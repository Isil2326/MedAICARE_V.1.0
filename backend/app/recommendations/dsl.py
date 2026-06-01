"""Mini-DSL d'évaluation des règles (transparent et traçable).

Pas de logique cachée : une règle déclenche si son prédicat est vrai sur le
contexte. Aucune décision n'est prise ici — on ne fait que SÉLECTIONNER des
règles candidates. La XAI n'est jamais la condition principale : les règles de
risque se déclenchent sur la PROBABILITÉ du modèle, la fiabilité XAI ne fait
qu'ajouter une mise en garde / un renvoi clinique.
"""
from __future__ import annotations

from app.recommendations.schemas import RuleSpec, TriggerContext


def build_context(
    *,
    target: str | None,
    horizon_min: int | None,
    probability: float | None,
    calculable: bool,
    xai: dict | None = None,
) -> TriggerContext:
    """Construit le contexte d'évaluation à partir d'une prédiction + XAI optionnelle."""
    xai_available = bool(xai and xai.get("calculable"))
    xai_status = xai.get("xai_reliability_status") if xai_available else None
    return TriggerContext(
        target=target,
        horizon_min=horizon_min,
        probability=probability,
        calculable=calculable,
        xai_available=xai_available,
        xai_reliability_status=xai_status,
    )


def matches(rule: RuleSpec, ctx: TriggerContext) -> bool:
    """Une règle ne peut se déclencher que sur une prédiction CALCULABLE."""
    if not ctx.calculable or ctx.probability is None:
        return False
    if rule.target is not None and rule.target != ctx.target:
        return False
    if rule.horizon_min is not None and rule.horizon_min != ctx.horizon_min:
        return False
    try:
        return bool(rule.predicate(ctx))
    except Exception:
        # Robustesse : une règle qui lève n'invente jamais de déclenchement.
        return False


def evaluate_rules(ctx: TriggerContext, rules: tuple[RuleSpec, ...]) -> list[RuleSpec]:
    """Retourne les règles déclenchées, triées par priorité croissante (1=haute)."""
    fired = [r for r in rules if matches(r, ctx)]
    return sorted(fired, key=lambda r: r.priority)
