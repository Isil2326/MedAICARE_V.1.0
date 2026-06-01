"""Explications LIME (tabulaire local). LIME ajuste un modèle linéaire local autour
de l'instance par perturbation. Configuration documentée : graine fixe, nombre de
perturbations contrôlé. LIME explique la PROBABILITÉ du modèle (predict_proba),
modèle non calibré.

Limites de stabilité : LIME est stochastique par nature ; la graine fixe rend le
résultat reproductible mais sensible au nombre de perturbations. Repli OCCLUSION
documenté si LIME échoue. On n'invente jamais de contributions.
"""
from __future__ import annotations

import numpy as np
from sqlalchemy.orm import Session

from app.ml import config
from app.ml.models.base import BaseRiskModel
from app.xai import utils

try:
    from lime.lime_tabular import LimeTabularExplainer

    LIME_AVAILABLE = True
except Exception:  # pragma: no cover - dépend de l'environnement
    LimeTabularExplainer = None  # type: ignore
    LIME_AVAILABLE = False

# Nombre de perturbations LIME (compromis latence/stabilité, documenté).
LIME_NUM_SAMPLES = 1000


def _occlusion_result(inner: BaseRiskModel, mat: np.ndarray, db: Session, reason: str) -> dict:
    ref = utils.median_reference(db)
    contribs = utils.occlusion_contributions(inner, mat, ref)
    return {
        "method": "occlusion", "contributions": contribs, "baseline": None,
        "fallback": True, "reason": reason,
        "explains": "modèle non calibré (occlusion via predict_proba)",
        "fidelity_r2": None,
    }


def explain_local(model: BaseRiskModel, entry: dict, X, db: Session) -> dict:
    """Contributions LIME locales (poids du modèle linéaire local, classe 1)."""
    inner = utils.unwrap(model)
    mat = model._as_matrix(X)
    if getattr(inner, "_single_class", None) is not None:
        return {"method": "lime", "contributions": np.zeros(mat.shape[1]),
                "baseline": float(inner._single_class), "fallback": False,
                "reason": "Modèle mono-classe : score constant.",
                "explains": "modèle non calibré", "fidelity_r2": None}
    if not LIME_AVAILABLE:
        return _occlusion_result(inner, mat, db, "Paquet `lime` indisponible.")

    bg = utils.background_matrix(db)
    if bg.shape[0] < 5:
        return _occlusion_result(inner, mat, db, "Fond insuffisant pour LIME (<5 lignes).")

    cols = list(config.FEATURE_COLUMNS)
    # LIME n'accepte pas les NaN : imputer l'instance par la médiane du fond.
    ref = utils.median_reference(db)
    inst = np.asarray(mat, dtype=float).reshape(-1).copy()
    nan_mask = np.isnan(inst)
    inst[nan_mask] = ref[nan_mask]
    try:
        explainer = LimeTabularExplainer(
            training_data=bg,
            feature_names=cols,
            class_names=["non", "oui"],
            mode="classification",
            discretize_continuous=True,
            random_state=config.RANDOM_SEED,
        )
        exp = explainer.explain_instance(
            data_row=inst,
            predict_fn=utils.proba_2col(inner),
            num_features=len(cols),
            num_samples=LIME_NUM_SAMPLES,
            labels=(1,),
        )
        contribs = np.zeros(len(cols), dtype=float)
        for idx, weight in exp.as_map().get(1, []):
            contribs[int(idx)] = float(weight)
        fidelity = float(getattr(exp, "score", None)) if getattr(exp, "score", None) is not None else None
        base = None
        local_pred = getattr(exp, "local_pred", None)
        if local_pred is not None:
            arr = np.asarray(local_pred, dtype=float).reshape(-1)
            if arr.size:
                base = float(arr[0]) - float(contribs.sum())
        return {"method": "lime", "contributions": contribs, "baseline": base,
                "fallback": False, "reason": None,
                "explains": "modèle non calibré (predict_proba)",
                "fidelity_r2": fidelity}
    except Exception as exc:  # pragma: no cover - robustesse
        return _occlusion_result(inner, mat, db, f"Échec LIME ({type(exc).__name__}): {exc}.")
