"""Outils communs XAI : chargement modèle actif, construction du vecteur de
features au point T (anti-leakage strict, identique à l'inférence), échantillon de
fond (background) pour SHAP/LIME, et helpers de mise en forme.

AUCUNE causalité n'est inférée ici : on prépare uniquement les entrées numériques.
"""
from __future__ import annotations

import math
import uuid
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

from app.ml import config, features_adapter, registry
from app.ml.models.base import BaseRiskModel

# Cache mémoire des artefacts chargés (clé = artifact_path).
_MODEL_CACHE: dict[str, BaseRiskModel] = {}
# Cache de la matrice de fond (background) construite depuis le dataset synthétique.
_BACKGROUND_CACHE: dict[str, np.ndarray] = {}


def clear_caches() -> None:
    _MODEL_CACHE.clear()
    _BACKGROUND_CACHE.clear()


def unwrap(model: BaseRiskModel) -> BaseRiskModel:
    """Déballe le `_Bundle` (modèle + calibrateur) vers le wrapper réel.

    SHAP/LIME/occlusion expliquent le modèle NON calibré (le wrapper interne), pas
    la probabilité calibrée renvoyée par `bundle.predict_proba`. Le `_Bundle` se
    reconnaît à son attribut `calibrator`.
    """
    if hasattr(model, "calibrator"):
        return getattr(model, "model", model)
    return model


def is_calibrated(model: BaseRiskModel) -> bool:
    """Vrai si un calibrateur est empaqueté (la proba affichée est alors calibrée)."""
    return getattr(model, "calibrator", None) is not None


def load_active_model(target: str, horizon_min: int) -> tuple[BaseRiskModel | None, dict | None]:
    """Charge le modèle ACTIF (registre JSON) pour (target, horizon). (None, entry|None)."""
    entry = registry.get_active(target, horizon_min)
    if entry is None:
        return None, None
    path = entry.get("artifact_path")
    if not path or not Path(path).exists():
        return None, entry
    if path not in _MODEL_CACHE:
        _MODEL_CACHE[path] = BaseRiskModel.load(path)
    return _MODEL_CACHE[path], entry


class FeatureContext:
    """Vecteur de features d'un patient au point T (open-loop, anti-leakage)."""

    def __init__(
        self,
        *,
        at: datetime,
        X: pd.DataFrame | None,
        row: dict,
        n_cgm_points: int,
        cgm_gap: bool,
        reason: str | None,
    ):
        self.at = at
        self.X = X
        self.row = row
        self.n_cgm_points = n_cgm_points
        self.cgm_gap = cgm_gap
        self.reason = reason

    @property
    def calculable(self) -> bool:
        return self.X is not None


def build_feature_context(
    db: Session, *, patient_id: uuid.UUID, at: datetime | None
) -> FeatureContext:
    """Construit le vecteur de features au point T, EXACTEMENT comme l'inférence.

    Anti-leakage : seuls les points `ts <= T` sont utilisés. Si aucun CGM avant T,
    `calculable=False` avec une raison — on n'invente rien.
    """
    at = features_adapter._as_utc(at) if at is not None else datetime.now(timezone.utc)
    series = features_adapter.load_series(db, patient_id)
    cgm_past = [p for p in series["cgm"] if p.ts <= at]
    meals_past = [p for p in series["meal"] if p.ts <= at]
    insulin_past = [p for p in series["insulin"] if p.ts <= at]

    if not cgm_past:
        return FeatureContext(
            at=at, X=None, row={}, n_cgm_points=0, cgm_gap=False,
            reason="Données CGM insuffisantes avant T pour calculer les features.",
        )

    from app.services.feature_engineering import compute_features

    feats = compute_features(
        at=at, cgm=cgm_past, meals=meals_past, insulin=insulin_past,
        window_short=config.WINDOW_SHORT_MIN, window_long=config.WINDOW_LONG_MIN,
    )
    row = features_adapter._serialize_features(feats)
    X = pd.DataFrame([row], columns=list(config.FEATURE_COLUMNS))
    cgm_gap = bool(row.get("cgm_gap_60"))
    return FeatureContext(
        at=at, X=X, row=row, n_cgm_points=len(cgm_past), cgm_gap=cgm_gap, reason=None,
    )


def background_matrix(db: Session, *, max_rows: int = 200) -> np.ndarray:
    """Matrice de fond (features) échantillonnée sur le dataset synthétique.

    Sert de référence à SHAP (LinearExplainer) et LIME (stats des features). NaN
    imputés par la médiane colonne (cohérent avec les pipelines sklearn). Mise en
    cache process-local. Déterministe (graine fixe).
    """
    key = f"bg_{max_rows}"
    if key in _BACKGROUND_CACHE:
        return _BACKGROUND_CACHE[key]

    from app.ml import dataset_builder

    df = dataset_builder.build_dataframe(db)
    cols = list(config.FEATURE_COLUMNS)
    if df.empty:
        mat = np.zeros((0, len(cols)), dtype=float)
        _BACKGROUND_CACHE[key] = mat
        return mat
    feats = df[cols].to_numpy(dtype=float)
    # Imputation médiane par colonne (NaN possibles aux bords de série).
    col_median = np.nanmedian(feats, axis=0)
    col_median = np.where(np.isnan(col_median), 0.0, col_median)
    inds = np.where(np.isnan(feats))
    feats[inds] = np.take(col_median, inds[1])
    if feats.shape[0] > max_rows:
        rng = np.random.default_rng(config.RANDOM_SEED)
        sel = rng.choice(feats.shape[0], size=max_rows, replace=False)
        feats = feats[sel]
    _BACKGROUND_CACHE[key] = feats
    return feats


def median_reference(db: Session) -> np.ndarray:
    """Vecteur de référence (médiane par feature) du dataset synthétique."""
    bg = background_matrix(db)
    cols = len(config.FEATURE_COLUMNS)
    if bg.shape[0] == 0:
        return np.zeros(cols, dtype=float)
    return np.nanmedian(bg, axis=0)


def risk_label(prob: float | None) -> str:
    if prob is None:
        return "non calculable"
    if prob < 0.2:
        return "faible"
    if prob < 0.5:
        return "modéré"
    return "élevé"


def _safe_float(v) -> float | None:
    if v is None:
        return None
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    return None if math.isnan(f) else f


def signed_direction(contribution: float | None) -> str:
    if contribution is None:
        return "indéterminé"
    if contribution > 1e-9:
        return "augmente"
    if contribution < -1e-9:
        return "diminue"
    return "neutre"


def top_k_contributions(
    feature_names: list[str],
    contributions: np.ndarray | None,
    values_row: dict,
    *,
    k: int,
) -> list[dict]:
    """Trie les features par |contribution| décroissante et renvoie le top-k.

    `contributions` peut être None (méthode sans contribution signée) → on renvoie
    quand même les features avec valeur, contribution null.
    """
    out: list[dict] = []
    if contributions is None:
        for name in feature_names[:k]:
            out.append({
                "feature": name,
                "value": _safe_float(values_row.get(name)),
                "contribution": None,
                "direction": "indéterminé",
                "abs_importance": None,
            })
        return out

    order = np.argsort(-np.abs(contributions))
    for idx in order[:k]:
        c = float(contributions[idx])
        name = feature_names[idx]
        out.append({
            "feature": name,
            "value": _safe_float(values_row.get(name)),
            "contribution": c,
            "direction": signed_direction(c),
            "abs_importance": abs(c),
        })
    return out


def occlusion_contributions(
    model: BaseRiskModel, x_matrix: np.ndarray, reference: np.ndarray
) -> np.ndarray:
    """Contributions locales par occlusion (model-agnostique, via predict_proba).

    Pour chaque feature i : contribution_i = p(x) - p(x | feature_i := reference_i).
    Positif ⇒ la valeur réelle de la feature pousse le score VERS le haut par rapport
    à la référence (médiane synthétique). C'est une mesure de SENSIBILITÉ du modèle,
    PAS une cause. Robuste : sert de repli documenté quand SHAP/LIME échouent.
    """
    x = np.asarray(x_matrix, dtype=float).reshape(1, -1)
    ref = np.asarray(reference, dtype=float).reshape(-1)
    p_full = float(np.asarray(model.predict_proba(x)).reshape(-1)[0])
    n = x.shape[1]
    contribs = np.zeros(n, dtype=float)
    for i in range(n):
        if np.isnan(x[0, i]) and np.isnan(ref[i]):
            continue
        perturbed = x.copy()
        perturbed[0, i] = ref[i]
        p_i = float(np.asarray(model.predict_proba(perturbed)).reshape(-1)[0])
        contribs[i] = p_full - p_i
    return contribs


def proba_2col(model: BaseRiskModel):
    """Adapte `predict_proba` (P1 1-D) en sortie 2 colonnes [P0, P1] pour LIME."""

    def _fn(arr: np.ndarray) -> np.ndarray:
        p1 = np.asarray(model.predict_proba(arr), dtype=float).reshape(-1)
        p1 = np.clip(p1, 0.0, 1.0)
        return np.column_stack([1.0 - p1, p1])

    return _fn
