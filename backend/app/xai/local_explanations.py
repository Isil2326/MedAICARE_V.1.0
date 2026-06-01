"""Explication LOCALE d'une prédiction open-loop (un patient, un instant T).

Sélectionne la méthode (auto/shap/lime/native) selon le modèle actif, calcule les
contributions réelles, traduit pour patient ET clinicien, et compose la réponse.
La PROBABILITÉ provient du même chemin que l'inférence (cohérence stricte). Les
CONTRIBUTIONS expliquent le modèle (non calibré) — c'est explicité dans `explains`.
Aucune dose, aucune décision : open-loop strict.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy.orm import Session

from app.ml import config
from app.xai import ebm_explainer, lime_explainer, shap_explainer, translation, utils


def resolve_method(requested: str, model_name: str) -> tuple[str, bool]:
    """(méthode_effective, note_de_substitution). 'auto' → choix par modèle.

    'native' n'a de sens que pour l'EBM ; demandé ailleurs → repli SHAP documenté.
    """
    if requested == "auto":
        if model_name == "ebm":
            return "native", False
        return "shap", False
    if requested == "native" and model_name != "ebm":
        return "shap", True  # natif indisponible hors EBM
    return requested, False


def _run_explainer(method: str, model, entry, X, db: Session) -> dict:
    if method == "native":
        return ebm_explainer.explain_local(model, entry, X, db)
    if method == "lime":
        return lime_explainer.explain_local(model, entry, X, db)
    return shap_explainer.explain_local(model, entry, X, db)


def explain_local(
    db: Session,
    *,
    patient_id: uuid.UUID,
    target: str,
    horizon_min: int,
    at: datetime | None = None,
    method: str = "auto",
    audience: str = "clinician",
    top_k: int = 6,
    ctx=None,
) -> dict:
    """Calcule l'explication locale. Renvoie un dict conforme à `LocalExplanation`.

    `ctx` (FeatureContext) peut être pré-construit par l'appelant (service/cache)
    pour éviter de recalculer les features deux fois.
    """
    if target not in config.TARGETS:
        raise ValueError(f"Cible inconnue : {target!r}.")
    if horizon_min not in config.HORIZONS_MIN:
        raise ValueError(f"Horizon invalide : {horizon_min!r}.")

    model, entry = utils.load_active_model(target, horizon_min)
    if ctx is None:
        ctx = utils.build_feature_context(db, patient_id=patient_id, at=at)

    base = {
        "patient_id": patient_id,
        "at": ctx.at,
        "target": target,
        "horizon_min": horizon_min,
        "probability": None,
        "risk_label": "non calculable",
        "calculable": False,
        "reason": None,
        "model_name": (entry or {}).get("model_name", "none"),
        "model_version": (entry or {}).get("model_version", "0.0.0"),
        "calibrated": bool((entry or {}).get("calibrated", False)),
        "explains": "modèle non calibré",
        "xai_method": method,
        "method_fallback": False,
        "top_features": [],
        "baseline": None,
        "synthetic_only": True,
        "n_cgm_points": ctx.n_cgm_points,
        "cgm_gap": ctx.cgm_gap,
    }

    if model is None:
        base["reason"] = (
            "Aucun modèle actif pour cette cible/horizon."
            if entry is None else "Artefact du modèle actif introuvable."
        )
        base["explanation_text_clinician"] = translation.build_clinician_text(
            target=target, horizon_min=horizon_min, probability=None, risk_label="non calculable",
            top_features=[], method=method, explains=base["explains"], calculable=False,
            reason=base["reason"], fallback=False,
        )
        base["explanation_text_patient"] = translation.build_patient_text(
            target=target, horizon_min=horizon_min, probability=None, risk_label="non calculable",
            top_features=[], calculable=False, reason=base["reason"],
        )
        return base

    if not ctx.calculable:
        base["reason"] = ctx.reason
        base["explanation_text_clinician"] = translation.build_clinician_text(
            target=target, horizon_min=horizon_min, probability=None, risk_label="non calculable",
            top_features=[], method=method, explains=base["explains"], calculable=False,
            reason=ctx.reason, fallback=False,
        )
        base["explanation_text_patient"] = translation.build_patient_text(
            target=target, horizon_min=horizon_min, probability=None, risk_label="non calculable",
            top_features=[], calculable=False, reason=ctx.reason,
        )
        return base

    prob = float(model.predict_proba(ctx.X)[0])
    eff_method, fallback_note = resolve_method(method, base["model_name"])
    res = _run_explainer(eff_method, model, entry, ctx.X, db)

    contributions = res.get("contributions")
    top = utils.top_k_contributions(list(config.FEATURE_COLUMNS), contributions, ctx.row, k=top_k)
    used_method = res.get("method", eff_method)
    is_fallback = bool(res.get("fallback")) or fallback_note

    base.update({
        "probability": prob,
        "risk_label": utils.risk_label(prob),
        "calculable": True,
        "reason": res.get("reason"),
        "explains": res.get("explains", base["explains"]),
        "xai_method": used_method,
        "method_fallback": is_fallback,
        "top_features": top,
        "baseline": utils._safe_float(res.get("baseline")),
    })
    base["explanation_text_patient"] = translation.build_patient_text(
        target=target, horizon_min=horizon_min, probability=prob,
        risk_label=base["risk_label"], top_features=top, calculable=True, reason=None,
    )
    base["explanation_text_clinician"] = translation.build_clinician_text(
        target=target, horizon_min=horizon_min, probability=prob, risk_label=base["risk_label"],
        top_features=top, method=used_method, explains=base["explains"], calculable=True,
        reason=res.get("reason"), fallback=is_fallback,
    )
    return base
