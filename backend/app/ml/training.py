"""Pipeline d'entraînement : dataset → split temporel → modèles → éval → calibration
→ artefact → registre.

Sélection HONNÊTE : on entraîne plusieurs candidats sur le train, on choisit le
meilleur sur la VALIDATION (AUROC, sinon Brier si AUROC non calculable), on
calibre sur la validation, puis on évalue UNE SEULE FOIS sur le test (jamais
utilisé pour la sélection — pas de fuite). Aucune métrique inventée.

OPEN-LOOP : les modèles produits ne renvoient que des probabilités de risque.
"""
from __future__ import annotations

import math
from datetime import datetime, timezone

import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

from app.ml import calibration, config, dataset_builder, evaluation, registry, tuning
from app.ml.models import MODEL_FACTORIES
from app.ml.models.base import BaseRiskModel
from app.ml.models.rules_baseline import ExpertRulesModel
from app.ml.models.xgb_model import XGBoostModel
from app.ml.splits import temporal_split


def _make_model(key: str, target: str, X_train, y_train) -> BaseRiskModel:
    """Instancie un candidat (cas particuliers : règles=cible, xgboost=tuning)."""
    if key == "expert_rules":
        return ExpertRulesModel(target=target)
    if key == "xgboost":
        params = tuning.tune_xgboost(X_train, y_train)
        return XGBoostModel(params=params)
    return MODEL_FACTORIES[key]()


def _selection_score(metrics: dict) -> float:
    """Score de sélection : AUROC si calculable, sinon -Brier (plus haut = mieux)."""
    if metrics.get("auroc") is not None:
        return metrics["auroc"]
    if metrics.get("brier") is not None:
        return -metrics["brier"]
    return float("-inf")


def train_target(
    db: Session,
    *,
    target: str,
    horizon_min: int,
    dataset: pd.DataFrame | None = None,
    model_keys: list[str] | None = None,
    calibrate: bool = True,
) -> dict:
    """Entraîne et enregistre le meilleur modèle pour (target, horizon)."""
    config.ensure_dirs()
    if dataset is None:
        dataset = dataset_builder.build_dataframe(db)
    if model_keys is None:
        model_keys = list(MODEL_FACTORIES.keys())

    label_col = config.label_column(target, horizon_min)
    if label_col not in dataset.columns:
        raise ValueError(f"Colonne de label absente : {label_col}.")

    # Lignes au label déterminable uniquement (pas de NaN inventé).
    data = dataset[dataset[label_col].notna()].copy()
    data[label_col] = data[label_col].astype(int)
    if data.empty:
        return {"target": target, "horizon_min": horizon_min, "status": "no_data"}

    splits = temporal_split(data)
    feat = list(config.FEATURE_COLUMNS)

    def xy(part):
        return part[feat], part[label_col].to_numpy(dtype=int)

    X_tr, y_tr = xy(splits["train"])
    X_va, y_va = xy(splits["val"])
    X_te, y_te = xy(splits["test"])

    if len(np.unique(y_tr)) < 2:
        return {
            "target": target, "horizon_min": horizon_min, "status": "single_class_train",
            "note": "Une seule classe dans le train : entraînement supervisé impossible.",
        }

    # 1) Entraîner les candidats + évaluer sur validation.
    candidates: dict[str, dict] = {}
    for key in model_keys:
        try:
            model = _make_model(key, target, X_tr, y_tr).fit(X_tr, y_tr)
            p_va = model.predict_proba(X_va)
            val_metrics = evaluation.evaluate(
                y_va, p_va, target=target, horizon_min=horizon_min
            )
            candidates[key] = {"model": model, "val": val_metrics}
        except Exception as exc:  # un candidat qui échoue ne bloque pas les autres
            candidates[key] = {"model": None, "error": str(exc)}

    trained = {k: v for k, v in candidates.items() if v.get("model") is not None}
    if not trained:
        return {"target": target, "horizon_min": horizon_min, "status": "all_failed",
                "errors": {k: v.get("error") for k, v in candidates.items()}}

    # 2) Sélection sur la validation.
    best_key = max(trained, key=lambda k: _selection_score(trained[k]["val"]))
    best_model = trained[best_key]["model"]

    # 3) Calibration sur la validation (appliquée seulement si elle améliore le Brier).
    calibrator = None
    if calibrate:
        p_va = best_model.predict_proba(X_va)
        calibrator = calibration.maybe_calibrate(p_va, y_va, method="isotonic")

    # 4) Évaluation finale sur le test (une seule fois).
    p_te = best_model.predict_proba(X_te)
    if calibrator is not None:
        p_te = calibrator.transform(p_te)
    test_metrics = evaluation.evaluate(y_te, p_te, target=target, horizon_min=horizon_min)
    reliability = calibration.reliability_curve(y_te, p_te)

    # 4bis) Statut d'évaluation scientifique + incertitude (bootstrap) — Phase 2.1.
    # Un couple n'est ACTIVABLE que s'il est évaluable sur le test (pos>0 et neg>0).
    eval_status = evaluation.evaluation_status(test_metrics)
    evaluable = eval_status != config.EVAL_STATUS_MONO_CLASS
    bootstrap = (
        evaluation.bootstrap_metrics(y_te, p_te)
        if evaluable
        else {"note": "test mono-classe : bootstrap non calculable."}
    )

    # 5) Persistance de l'artefact (modèle + calibrateur empaquetés).
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    model_id = f"{best_model.name}-{target}-{horizon_min}-{stamp}"
    artifact_path = config.MODELS_DIR / f"{model_id}.joblib"
    bundle = _Bundle(model=best_model, calibrator=calibrator, feature_columns=feat)
    bundle.save(artifact_path)

    meta = dataset_builder.dataset_meta(data)
    entry = {
        "model_id": model_id,
        "target": target,
        "horizon_min": horizon_min,
        "model_name": best_model.name,
        "model_version": best_model.version,
        "artifact_path": str(artifact_path),
        "calibrated": calibrator is not None,
        "feature_columns": feat,
        "evaluation_status": eval_status,
        "metrics": {
            "validation": {k: trained[k]["val"] for k in trained},
            "selected": best_key,
            "test": test_metrics,
            "test_bootstrap": bootstrap,
            "reliability_curve": reliability,
            "split_sizes": {"train": int(len(y_tr)), "val": int(len(y_va)), "test": int(len(y_te))},
            "split_positives": {
                "train": int((y_tr == 1).sum()),
                "val": int((y_va == 1).sum()),
                "test": int((y_te == 1).sum()),
            },
        },
        "dataset_meta": meta,
    }
    # Activation conditionnelle : actif seulement si le couple est évaluable sur
    # le test (sinon candidat documenté — pas d'activation d'un modèle non évalué).
    registry.register(entry, db=db, set_active=evaluable)

    return {
        "target": target,
        "horizon_min": horizon_min,
        "status": "ok",
        "selected_model": best_model.name,
        "calibrated": calibrator is not None,
        "model_id": model_id,
        "evaluation_status": eval_status,
        "activated": evaluable,
        "test_metrics": test_metrics,
        "test_bootstrap": bootstrap,
        "n_train": int(len(y_tr)),
        "n_val": int(len(y_va)),
        "n_test": int(len(y_te)),
        "split_positives": {
            "train": int((y_tr == 1).sum()),
            "val": int((y_va == 1).sum()),
            "test": int((y_te == 1).sum()),
        },
    }


def train_all(db: Session, **kwargs) -> list[dict]:
    """Entraîne tous les couples (target, horizon) sur un dataset construit une fois."""
    dataset = dataset_builder.build_dataframe(db)
    results = []
    for target in config.TARGETS:
        for horizon in config.HORIZONS_MIN:
            results.append(
                train_target(db, target=target, horizon_min=horizon, dataset=dataset, **kwargs)
            )
    return results


class _Bundle(BaseRiskModel):
    """Empaquète modèle + calibrateur pour une persistance/chargement uniques."""

    MODEL_NAME = "bundle"

    def __init__(self, *, model: BaseRiskModel, calibrator, feature_columns):
        super().__init__(feature_columns)
        self.model = model
        self.calibrator = calibrator
        self.MODEL_NAME = model.name
        self.MODEL_VERSION = model.version

    @property
    def name(self) -> str:
        return self.model.name

    @property
    def version(self) -> str:
        return self.model.version

    def fit(self, X, y):  # pragma: no cover - bundle déjà entraîné
        return self

    def predict_proba(self, X) -> np.ndarray:
        p = self.model.predict_proba(X)
        if self.calibrator is not None:
            p = self.calibrator.transform(p)
        return np.asarray(p, dtype=float)
