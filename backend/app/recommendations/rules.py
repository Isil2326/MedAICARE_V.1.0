"""Registre de règles expertes VERSIONNÉES (open-loop, non prescriptives).

Chaque règle se déclenche sur la PROBABILITÉ d'un modèle actif (Phase 2.1) pour un
couple cible/horizon. Aucune règle ne produit de dose, d'instruction de traitement
ni de décision : seulement une SUGGESTION pending à valider par un clinicien.

Seuils : choix de prototype synthétique, NON validés cliniquement. Documentés ici
pour traçabilité ; ils ne constituent pas un référentiel médical.
"""
from __future__ import annotations

from app.recommendations.schemas import RecommendationCategory, RuleSpec, TriggerContext

# Seuils de probabilité (benchmark synthétique — non clinique).
HYPO_CRITICAL = 0.70
HYPO_BEHAVIORAL = 0.40
HYPER_CRITICAL = 0.80
HYPER_BEHAVIORAL = 0.50
XAI_RISK_MIN = 0.40  # on ne renvoie en revue XAI que si un risque existe déjà

_NOT_RELIABLE = "not_reliable_for_clinical_interpretation"
_EVIDENCE = "synthetic_benchmark_prototype"

_OPEN_LOOP = (
    "Suggestion open-loop : aucune dose ni décision. Validation clinicien requise."
)


def _hypo_critical(ctx: TriggerContext) -> bool:
    return ctx.target == "hypo" and (ctx.probability or 0.0) >= HYPO_CRITICAL


def _hypo_behavioral(ctx: TriggerContext) -> bool:
    p = ctx.probability or 0.0
    return ctx.target == "hypo" and HYPO_BEHAVIORAL <= p < HYPO_CRITICAL


def _hyper_critical(ctx: TriggerContext) -> bool:
    return ctx.target == "hyper" and (ctx.probability or 0.0) >= HYPER_CRITICAL


def _hyper_behavioral(ctx: TriggerContext) -> bool:
    p = ctx.probability or 0.0
    return ctx.target == "hyper" and HYPER_BEHAVIORAL <= p < HYPER_CRITICAL


def _xai_low_reliability(ctx: TriggerContext) -> bool:
    return (
        ctx.xai_available
        and ctx.xai_reliability_status == _NOT_RELIABLE
        and (ctx.probability or 0.0) >= XAI_RISK_MIN
    )


_RULES: tuple[RuleSpec, ...] = (
    RuleSpec(
        rule_id="HYPO_RISK_CRITICAL",
        rule_version="1.0.0",
        name="Risque indicatif d'hypoglycémie élevé",
        description="Probabilité d'hypoglycémie au-dessus du seuil critique (synthétique).",
        trigger_condition=f"target=hypo AND probability>={HYPO_CRITICAL}",
        target="hypo",
        horizon_min=None,
        probability_threshold=HYPO_CRITICAL,
        required_context=("probability",),
        safety_constraints=("no_dose", "no_treatment_change", "clinician_validation_required"),
        message_template="hypo_alert",
        category=RecommendationCategory.ALERT_CRITICAL,
        priority=1,
        evidence_level=_EVIDENCE,
        open_loop_notice=_OPEN_LOOP,
        predicate=_hypo_critical,
    ),
    RuleSpec(
        rule_id="HYPO_RISK_BEHAVIORAL",
        rule_version="1.0.0",
        name="Risque indicatif d'hypoglycémie modéré",
        description="Probabilité d'hypoglycémie modérée : surveillance comportementale.",
        trigger_condition=f"target=hypo AND {HYPO_BEHAVIORAL}<=probability<{HYPO_CRITICAL}",
        target="hypo",
        horizon_min=None,
        probability_threshold=HYPO_BEHAVIORAL,
        required_context=("probability",),
        safety_constraints=("no_dose", "no_treatment_change", "clinician_validation_required"),
        message_template="hypo_behavioral",
        category=RecommendationCategory.RECOMMENDATION_BEHAVIORAL,
        priority=2,
        evidence_level=_EVIDENCE,
        open_loop_notice=_OPEN_LOOP,
        predicate=_hypo_behavioral,
    ),
    RuleSpec(
        rule_id="HYPER_RISK_CRITICAL",
        rule_version="1.0.0",
        name="Risque indicatif d'hyperglycémie élevé",
        description="Probabilité d'hyperglycémie au-dessus du seuil critique (synthétique).",
        trigger_condition=f"target=hyper AND probability>={HYPER_CRITICAL}",
        target="hyper",
        horizon_min=None,
        probability_threshold=HYPER_CRITICAL,
        required_context=("probability",),
        safety_constraints=("no_dose", "no_treatment_change", "clinician_validation_required"),
        message_template="hyper_alert",
        category=RecommendationCategory.ALERT_CRITICAL,
        priority=1,
        evidence_level=_EVIDENCE,
        open_loop_notice=_OPEN_LOOP,
        predicate=_hyper_critical,
    ),
    RuleSpec(
        rule_id="HYPER_RISK_BEHAVIORAL",
        rule_version="1.0.0",
        name="Risque indicatif d'hyperglycémie modéré",
        description="Probabilité d'hyperglycémie modérée : surveillance comportementale.",
        trigger_condition=f"target=hyper AND {HYPER_BEHAVIORAL}<=probability<{HYPER_CRITICAL}",
        target="hyper",
        horizon_min=None,
        probability_threshold=HYPER_BEHAVIORAL,
        required_context=("probability",),
        safety_constraints=("no_dose", "no_treatment_change", "clinician_validation_required"),
        message_template="hyper_behavioral",
        category=RecommendationCategory.RECOMMENDATION_BEHAVIORAL,
        priority=2,
        evidence_level=_EVIDENCE,
        open_loop_notice=_OPEN_LOOP,
        predicate=_hyper_behavioral,
    ),
    RuleSpec(
        rule_id="XAI_LOW_RELIABILITY",
        rule_version="1.0.0",
        name="Explication peu fiable : renvoi en validation clinique",
        description=(
            "Un risque existe mais l'explication XAI est jugée non fiable pour "
            "interprétation clinique : on renvoie explicitement vers une revue humaine."
        ),
        trigger_condition=(
            f"xai_reliability_status={_NOT_RELIABLE} AND probability>={XAI_RISK_MIN}"
        ),
        target=None,
        horizon_min=None,
        probability_threshold=XAI_RISK_MIN,
        required_context=("probability", "xai_reliability_status"),
        safety_constraints=("no_xai_clinical_justification", "clinician_validation_required"),
        message_template="xai_low_reliability",
        category=RecommendationCategory.CLINICAL_REFERRAL,
        priority=2,
        evidence_level=_EVIDENCE,
        open_loop_notice=_OPEN_LOOP,
        predicate=_xai_low_reliability,
    ),
)


def get_rules() -> tuple[RuleSpec, ...]:
    return _RULES


def get_rule(rule_id: str) -> RuleSpec | None:
    for r in _RULES:
        if r.rule_id == rule_id:
            return r
    return None
