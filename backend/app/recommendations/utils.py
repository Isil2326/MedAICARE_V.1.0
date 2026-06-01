"""Utilitaires purs : extraction de features XAI et construction de la rationale.

La rationale est la TRACE complète d'une recommandation (règle, contexte, scores,
features, mises en garde). Verrou Phase 4.1 : les features XAI sont un support
d'AFFICHAGE et d'AUDIT du modèle — JAMAIS une cause médicale, JAMAIS une
justification clinique, même lorsque la fiabilité est jugée bonne
(`clinical_justification_allowed` est toujours `False`).
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
) -> dict:
    """Assemble la trace sérialisable d'une recommandation (audit/affichage).

    Verrou Phase 4.1 : `clinical_justification_allowed` est TOUJOURS `False`. La XAI
    est attachée comme explication du modèle (affichage/audit), jamais comme
    justification clinique — quelle que soit `reliability_status`.
    """
    xai_block = {
        "included": ctx.xai_available,
        "usage": (
            "model_explanation_display_only" if ctx.xai_available else "not_available"
        ),
        "clinical_justification_allowed": False,
        "reliability_status": ctx.xai_reliability_status,
        "principal_features": principal,
        "warnings": list((xai or {}).get("xai_warnings") or []) if ctx.xai_available else [],
        "limitations": [
            "XAI describes model behavior, not medical causality.",
            "XAI must not be used as a treatment justification.",
        ],
        "note": (
            "Features = contribution au score du modèle (XAI), jamais une cause "
            "médicale. Support d'affichage et d'audit uniquement, jamais une "
            "justification clinique (même si la fiabilité est jugée bonne)."
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
