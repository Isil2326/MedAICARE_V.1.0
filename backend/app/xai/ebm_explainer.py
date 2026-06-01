"""Explications natives EBM (InterpretML, glassbox). L'EBM est intrinsèquement
interprétable : contributions additives par feature (espace log-odds), sans modèle
de substitution. On expose les contributions des EFFETS PRINCIPAUX alignés sur les
18 features canoniques (les termes d'interaction éventuels sont agrégés à part).

Repli OCCLUSION documenté si l'explication native échoue. Jamais de valeur inventée.
"""
from __future__ import annotations

import numpy as np
from sqlalchemy.orm import Session

from app.ml import config
from app.ml.models.base import BaseRiskModel
from app.xai import utils


def _occlusion_result(inner: BaseRiskModel, mat: np.ndarray, db: Session, reason: str) -> dict:
    ref = utils.median_reference(db)
    contribs = utils.occlusion_contributions(inner, mat, ref)
    return {"method": "occlusion", "contributions": contribs, "baseline": None,
            "fallback": True, "reason": reason,
            "explains": "modèle non calibré (occlusion via predict_proba)"}


def _term_to_feature_index(term_name: str, cols: list[str]) -> int | None:
    """Mappe un nom de terme EBM vers l'index d'une feature canonique (effet principal)."""
    if term_name in cols:
        return cols.index(term_name)
    return None  # terme d'interaction (ex. "a & b") → ignoré ici


def explain_local(model: BaseRiskModel, entry: dict, X, db: Session) -> dict:
    """Contributions locales natives EBM (log-odds additif, classe 1)."""
    inner = utils.unwrap(model)
    mat = model._as_matrix(X)
    ebm = getattr(inner, "model", None)
    cols = list(config.FEATURE_COLUMNS)
    if getattr(inner, "_single_class", None) is not None:
        return {"method": "native", "contributions": np.zeros(len(cols)),
                "baseline": float(inner._single_class), "fallback": False,
                "reason": "Modèle mono-classe : score constant.",
                "explains": "modèle non calibré"}
    if ebm is None:
        return _occlusion_result(inner, mat, db, "EBM non entraîné.")
    try:
        exp = ebm.explain_local(mat)
        data = exp.data(0)
        names = data.get("names", [])
        scores = data.get("scores", [])
        contribs = np.zeros(len(cols), dtype=float)
        for name, score in zip(names, scores):
            idx = _term_to_feature_index(str(name), cols)
            if idx is not None:
                contribs[idx] += float(score)
        base = None
        extra = data.get("extra") or {}
        extra_scores = extra.get("scores") if isinstance(extra, dict) else None
        if extra_scores:
            base = float(np.asarray(extra_scores, dtype=float).reshape(-1)[0])
        elif getattr(ebm, "intercept_", None) is not None:
            ic = np.asarray(ebm.intercept_, dtype=float).reshape(-1)
            base = float(ic[0]) if ic.size else None
        return {"method": "native", "contributions": contribs, "baseline": base,
                "fallback": False, "reason": None, "explains": "modèle non calibré"}
    except Exception as exc:  # pragma: no cover - robustesse
        return _occlusion_result(inner, mat, db, f"Échec EBM natif ({type(exc).__name__}): {exc}.")


def global_importance(model: BaseRiskModel, entry: dict, db: Session) -> dict:
    """Importance globale native EBM (importance par terme, effets principaux)."""
    inner = utils.unwrap(model)
    ebm = getattr(inner, "model", None)
    cols = list(config.FEATURE_COLUMNS)
    if ebm is None or getattr(inner, "_single_class", None) is not None:
        return {"method": "native", "importances": None, "fallback": True,
                "reason": "EBM non entraîné ou mono-classe.", "directions": None}
    try:
        g = ebm.explain_global()
        data = g.data()
        names = data.get("names", [])
        scores = data.get("scores", [])
        importances: dict[str, float] = {}
        for name, score in zip(names, scores):
            idx = _term_to_feature_index(str(name), cols)
            if idx is not None:
                importances[cols[idx]] = float(score)
        return {"method": "native", "importances": importances or None,
                "directions": None, "fallback": False, "reason": None}
    except Exception as exc:  # pragma: no cover
        return {"method": "native", "importances": None, "fallback": True,
                "reason": f"Échec EBM global ({type(exc).__name__}).", "directions": None}
