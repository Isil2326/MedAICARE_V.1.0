"""Templates de messages CONTRÔLÉS (patient / clinicien), strictement non prescriptifs.

Aucun template ne contient de dose, de verbe d'instruction thérapeutique
(« injectez », « augmentez la dose »…) ni de décision. Tous rappellent : données
simulées, caractère indicatif, validation clinicien requise. La couche `safety`
vérifie en plus l'absence de termes interdits avant toute persistance.
"""
from __future__ import annotations

_SIM = "sur données simulées"
_CONTACT = (
    "En cas de symptômes, de doute ou de persistance, contactez un professionnel "
    "de santé. Ne modifiez jamais votre traitement sans avis médical."
)


def _h(horizon_min: int | None) -> str:
    return f"~{horizon_min} minutes" if horizon_min else "les prochaines minutes"


def render_patient(template_key: str, **ctx) -> str:
    """Message patient : prudent, non causal, non prescriptif."""
    h = _h(ctx.get("horizon_min"))
    if template_key == "hypo_alert":
        return (
            f"Un risque indicatif d'hypoglycémie a été détecté pour {h} {_SIM}. "
            "Restez attentif à votre état et à votre glycémie selon les consignes "
            f"habituelles de votre professionnel de santé. {_CONTACT}"
        )
    if template_key == "hypo_behavioral":
        return (
            f"Une tendance vers une glycémie basse est possible pour {h} {_SIM}. "
            "Vous pouvez surveiller l'évolution selon vos habitudes de suivi. "
            f"{_CONTACT}"
        )
    if template_key == "hyper_alert":
        return (
            f"Un risque indicatif d'hyperglycémie a été détecté pour {h} {_SIM}. "
            "Surveillez l'évolution selon les consignes de votre professionnel de "
            f"santé. {_CONTACT}"
        )
    if template_key == "hyper_behavioral":
        return (
            f"Une tendance vers une glycémie élevée est possible pour {h} {_SIM}. "
            "Vous pouvez surveiller l'évolution selon vos habitudes de suivi. "
            f"{_CONTACT}"
        )
    if template_key == "xai_low_reliability":
        return (
            "L'explication automatique de ce signal est jugée peu fiable pour une "
            "interprétation clinique. Une validation par un professionnel de santé "
            f"est recommandée avant toute interprétation. {_CONTACT}"
        )
    return (
        f"Signal indicatif {_SIM}, à interpréter avec un professionnel de santé. "
        f"{_CONTACT}"
    )


def render_clinician(template_key: str, **ctx) -> str:
    """Message clinicien : technique, traçable, sans dose ni instruction."""
    target = ctx.get("target") or "?"
    horizon = ctx.get("horizon_min")
    p = ctx.get("probability")
    p_txt = f"{p:.2f}" if isinstance(p, (int, float)) else "n/c"
    model = ctx.get("model_name") or "n/c"
    calib = "calibré" if ctx.get("calibrated") else "non calibré"
    xai = ctx.get("xai_reliability_status") or "indisponible"
    rule_id = ctx.get("rule_id") or "?"
    rule_version = ctx.get("rule_version") or "?"
    category = ctx.get("category") or "?"

    base = (
        f"[{category}] cible={target} · horizon={horizon} min · probabilité={p_txt} · "
        f"modèle={model} ({calib}) · fiabilité XAI={xai}. "
        f"Règle déclenchée : {rule_id} v{rule_version}. "
        "Action attendue : validation, modification ou rejet par un clinicien. "
        "Aucune dose, aucune instruction thérapeutique (open-loop, données simulées)."
    )
    if template_key == "xai_low_reliability":
        base += (
            " L'explication XAI est affichée uniquement comme support de "
            "compréhension du modèle (jamais une justification clinique) ; "
            "fiabilité insuffisante : revue humaine requise."
        )
    return base
