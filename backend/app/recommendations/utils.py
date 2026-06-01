"""Utilitaires purs : extraction de features XAI et construction de la rationale.

La rationale est la TRACE complète d'une recommandation (règle, contexte, scores,
features, mises en garde). Les features XAI ne sont JAMAIS présentées comme une
cause médicale ; si la fiabilité XAI est insuffisante, elles ne servent pas de
justification clinique (`used_as_clinical_justification=False`).
"""
from __future__ import annotations

from app.recommendations.schemas import (
    ActionabilityScores,
    RuleSpec,
    TriggerContext,
)


def principal_features(xai: dict | None, *, k: int = 3) -> list[dict]:
    """Top-k features pondérées par le modèle (contribution au SCORE, pas une cause)."""
    if not xai or not xai.get("calculable"):
        return []
    feats = xai.get("top_features") or []
    out: list[dict] = []
    for f in feats[:k]:
        out.append(
            {
                "feature": f.get("feature"),
                "contribution": f.get("contribution"),
                "direction": f.get("direction"),
            }
        )
    return out


def build_rationale(
    *,
    rule: RuleSpec,
    ctx: TriggerContext,
    xai: dict | None,
    principal: list[dict],
    scores: ActionabilityScores,
    warnings: list[str],
    clinical_justification: bool,
) -> dict:
    """Assemble la trace sérialisable d'une recommandation (audit/affichage)."""
    xai_block = {
        "available": ctx.xai_available,
        "reliability_status": ctx.xai_reliability_status,
        "used_as_clinical_justification": bool(clinical_justification),
        "principal_features": principal,
        "warnings": list((xai or {}).get("xai_warnings") or []) if ctx.xai_available else [],
        "note": (
            "Features = contribution au score du modèle (XAI), jamais une cause "
            "médicale. Non utilisées comme justification clinique si fiabilité "
            "insuffisante."
        ),
    }
    return {
        "rule": rule.summary(),
        "trigger": {
            "target": ctx.target,
            "horizon_min": ctx.horizon_min,
            "probability": ctx.probability,
            "condition": rule.trigger_condition,
        },
        "xai": xai_block,
        "actionability": scores.as_dict(),
        "warnings": warnings,
        "synthetic_data_notice": "Données 100 % synthétiques (is_synthetic=True).",
        "open_loop_notice": rule.open_loop_notice,
    }
