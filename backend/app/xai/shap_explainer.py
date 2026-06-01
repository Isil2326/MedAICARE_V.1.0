"""Explications SHAP — TreeExplainer (XGBoost/RandomForest) et LinearExplainer
(LogReg). SHAP explique le MODÈLE NON CALIBRÉ (espace marge/score), pas la
probabilité calibrée — c'est documenté dans la réponse (`explains`).

Posture honnête : si SHAP échoue ou n'est pas applicable, repli par OCCLUSION
(`utils.occlusion_contributions`) avec `fallback=True` et raison explicite. On
n'invente jamais de contributions.
"""
from __future__ import annotations

import numpy as np
from sqlalchemy.orm import Session

from app.ml import config
from app.ml.models.base import BaseRiskModel
from app.xai import utils

try:
    import shap

    SHAP_AVAILABLE = True
except Exception:  # pragma: no cover - dépend de l'environnement
    shap = None  # type: ignore
    SHAP_AVAILABLE = False


def _occlusion_result(inner: BaseRiskModel, mat: np.ndarray, db: Session, reason: str) -> dict:
    ref = utils.median_reference(db)
    contribs = utils.occlusion_contributions(inner, mat, ref)
    return {
        "method": "occlusion",
        "contributions": contribs,
        "baseline": None,
        "fallback": True,
        "reason": reason,
        "explains": "modèle non calibré (occlusion via predict_proba)",
    }


def _to_pos_class(sv, expected):
    """Normalise la sortie SHAP (liste/3D/2D) vers (contribs_1d, baseline)."""
    arr = sv
    if isinstance(arr, list):
        arr = arr[1] if len(arr) > 1 else arr[0]
    arr = np.asarray(arr, dtype=float)
    if arr.ndim == 3:  # (n, features, classes)
        arr = arr[:, :, -1]
    contribs = arr.reshape(arr.shape[0], -1)[0]
    base = expected
    if isinstance(base, (list, tuple, np.ndarray)):
        base = np.asarray(base, dtype=float).reshape(-1)
        base = float(base[-1]) if base.size else None
    elif base is not None:
        base = float(base)
    return contribs, base


def explain_local(model: BaseRiskModel, entry: dict, X, db: Session) -> dict:
    """Contributions SHAP locales (positif = pousse le score vers la classe 1)."""
    inner = utils.unwrap(model)
    mat = model._as_matrix(X)
    # Modèle mono-classe : score constant, aucune contribution réelle.
    if getattr(inner, "_single_class", None) is not None:
        return {
            "method": "shap", "contributions": np.zeros(mat.shape[1]),
            "baseline": float(inner._single_class), "fallback": False,
            "reason": "Modèle mono-classe : score constant (aucune contribution).",
            "explains": "modèle non calibré",
        }
    if not SHAP_AVAILABLE:
        return _occlusion_result(inner, mat, db, "Paquet `shap` indisponible.")

    name = (entry or {}).get("model_name", inner.MODEL_NAME)
    try:
        if name == "xgboost" and getattr(inner, "model", None) is not None:
            expl = shap.TreeExplainer(inner.model)
            sv = expl.shap_values(mat)
            contribs, base = _to_pos_class(sv, getattr(expl, "expected_value", None))
            return {"method": "shap", "contributions": contribs, "baseline": base,
                    "fallback": False, "reason": None, "explains": "modèle non calibré"}

        if name == "random_forest" and getattr(inner, "pipeline", None) is not None:
            steps = inner.pipeline.named_steps
            mat_t = steps["impute"].transform(mat) if "impute" in steps else mat
            expl = shap.TreeExplainer(steps["clf"])
            sv = expl.shap_values(mat_t)
            contribs, base = _to_pos_class(sv, getattr(expl, "expected_value", None))
            return {"method": "shap", "contributions": contribs, "baseline": base,
                    "fallback": False, "reason": None, "explains": "modèle non calibré"}

        if name == "logreg" and getattr(inner, "pipeline", None) is not None:
            steps = inner.pipeline.named_steps
            bg = utils.background_matrix(db)
            mat_t, bg_t = mat, bg
            for step in ("impute", "scale"):
                if step in steps:
                    mat_t = steps[step].transform(mat_t)
                    if bg_t.shape[0] > 0:
                        bg_t = steps[step].transform(bg_t)
            masker = bg_t if bg_t.shape[0] > 0 else None
            expl = shap.LinearExplainer(steps["clf"], masker)
            sv = expl.shap_values(mat_t)
            contribs, base = _to_pos_class(sv, getattr(expl, "expected_value", None))
            return {"method": "shap", "contributions": contribs, "baseline": base,
                    "fallback": False, "reason": None, "explains": "modèle non calibré"}

        return _occlusion_result(inner, mat, db, f"SHAP non applicable au modèle '{name}'.")
    except Exception as exc:  # pragma: no cover - robustesse environnement
        return _occlusion_result(inner, mat, db, f"Échec SHAP ({type(exc).__name__}): {exc}.")


def global_importance(model: BaseRiskModel, entry: dict, db: Session) -> dict:
    """Importance globale SHAP : |contribution| moyenne sur la matrice de fond."""
    inner = utils.unwrap(model)
    bg = utils.background_matrix(db)
    cols = list(config.FEATURE_COLUMNS)
    if bg.shape[0] == 0 or getattr(inner, "_single_class", None) is not None:
        return {"method": "shap", "importances": None, "fallback": True,
                "reason": "Fond vide ou modèle mono-classe.", "directions": None}
    if not SHAP_AVAILABLE:
        return {"method": "occlusion", "importances": None, "fallback": True,
                "reason": "Paquet `shap` indisponible.", "directions": None}
    name = (entry or {}).get("model_name", inner.MODEL_NAME)
    try:
        if name == "xgboost":
            expl = shap.TreeExplainer(inner.model)
            sv = _normalize_matrix(expl.shap_values(bg))
        elif name == "random_forest":
            steps = inner.pipeline.named_steps
            bg_t = steps["impute"].transform(bg) if "impute" in steps else bg
            expl = shap.TreeExplainer(steps["clf"])
            sv = _normalize_matrix(expl.shap_values(bg_t))
        elif name == "logreg":
            steps = inner.pipeline.named_steps
            bg_t = bg
            for step in ("impute", "scale"):
                if step in steps:
                    bg_t = steps[step].transform(bg_t)
            expl = shap.LinearExplainer(steps["clf"], bg_t)
            sv = _normalize_matrix(expl.shap_values(bg_t))
        else:
            return {"method": "shap", "importances": None, "fallback": True,
                    "reason": f"SHAP non applicable à '{name}'.", "directions": None}
        mean_abs = np.abs(sv).mean(axis=0)
        mean_signed = sv.mean(axis=0)
        return {
            "method": "shap",
            "importances": {cols[i]: float(mean_abs[i]) for i in range(len(cols))},
            "directions": {cols[i]: utils.signed_direction(float(mean_signed[i])) for i in range(len(cols))},
            "fallback": False, "reason": None,
        }
    except Exception as exc:  # pragma: no cover
        return {"method": "shap", "importances": None, "fallback": True,
                "reason": f"Échec SHAP global ({type(exc).__name__}).", "directions": None}


def _normalize_matrix(sv):
    arr = sv
    if isinstance(arr, list):
        arr = arr[1] if len(arr) > 1 else arr[0]
    arr = np.asarray(arr, dtype=float)
    if arr.ndim == 3:
        arr = arr[:, :, -1]
    return arr
