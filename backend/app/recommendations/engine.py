"""Moteur PUR de génération de recommandations (sans DB, sans I/O).

Entrées : une prédiction (dict normalisé) + une explication XAI optionnelle (dict).
Sortie : une liste de `GeneratedRecommendation` candidates (statut conceptuel
`generated`), prêtes à passer la couche `safety` puis à être persistées `pending`.

Garanties open-loop (verrou Phase 4.1) :
- la XAI n'est JAMAIS la condition principale : les règles de risque se déclenchent
  sur la probabilité du modèle ;
- la XAI est un support d'AFFICHAGE et d'AUDIT du modèle, JAMAIS une justification
  clinique — quelle que soit sa fiabilité (`clinical_justification_allowed=False`) ;
- une XAI `not_reliable_for_clinical_interpretation` ne fait qu'ajouter un avertissement
  et un renvoi en revue humaine (garde-fou de prudence), jamais une décision ;
- aucune dose, décision ni action : seulement des suggestions à valider.
"""
from __future__ import annotations

from app.recommendations import dsl, evaluation, rules, templates, utils
from app.recommendations.schemas import (
    GeneratedRecommendation,
    OPEN_LOOP_NOTICE,
    RecommendationCategory,
    SafetyLevel,
)

_NOT_RELIABLE = "not_reliable_for_clinical_interpretation"

# Mappage catégorie -> niveau de sécurité (priorisation, non clinique).
_SAFETY_BY_CATEGORY = {
    RecommendationCategory.ALERT_CRITICAL: SafetyLevel.urgent,
    RecommendationCategory.RECOMMENDATION_BEHAVIORAL: SafetyLevel.monitoring,
    RecommendationCategory.CLINICAL_REFERRAL: SafetyLevel.review_only,
    RecommendationCategory.THERAPY_SUGGESTION_REVIEW_ONLY: SafetyLevel.review_only,
}


def generate_candidates(
    *, prediction: dict, xai: dict | None = None
) -> list[GeneratedRecommendation]:
    """Évalue les règles et construit les recommandations candidates."""
    target = prediction.get("target")
    horizon_min = prediction.get("horizon_min")
    probability = prediction.get("probability")
    calculable = bool(prediction.get("calculable"))
    model_name = prediction.get("model_name")
    model_version = prediction.get("model_version")
    calibrated = bool(prediction.get("calibrated"))
    patient_id = prediction.get("patient_id")
    prediction_id = prediction.get("prediction_id")

    ctx = dsl.build_context(
        target=target,
        horizon_min=horizon_min,
        probability=probability,
        calculable=calculable,
        xai=xai,
    )
    if not ctx.calculable or ctx.probability is None:
        return []

    fired = dsl.evaluate_rules(ctx, rules.get_rules())
    xai_not_reliable = ctx.xai_reliability_status == _NOT_RELIABLE

    out: list[GeneratedRecommendation] = []
    for rule in fired:
        # Verrou Phase 4.1 : la XAI est un support d'affichage/audit du modèle,
        # jamais une justification clinique — quelle que soit sa fiabilité.
        principal = utils.principal_features(xai) if ctx.xai_available else []

        warnings: list[str] = []
        if not ctx.xai_available:
            warnings.append(
                "XAI indisponible : suggestion émise sans support explicatif."
            )
        elif xai_not_reliable:
            warnings.append(
                "XAI affichée comme explication du modèle uniquement (jamais une "
                "justification clinique) ; fiabilité insuffisante → revue humaine."
            )

        safety_level = _SAFETY_BY_CATEGORY.get(rule.category, SafetyLevel.monitoring)

        msg_patient = templates.render_patient(
            rule.message_template, horizon_min=horizon_min
        )
        msg_clinician = templates.render_clinician(
            rule.message_template,
            target=target,
            horizon_min=horizon_min,
            probability=probability,
            model_name=model_name,
            calibrated=calibrated,
            xai_reliability_status=ctx.xai_reliability_status,
            rule_id=rule.rule_id,
            rule_version=rule.rule_version,
            category=rule.category.value,
        )

        scores = evaluation.score(
            category=rule.category,
            safety_level=safety_level,
            probability=probability,
            calibrated=calibrated,
            xai_available=ctx.xai_available,
            xai_reliability_status=ctx.xai_reliability_status,
            safety_passed=True,
            message_len=len(msg_patient),
        )

        rationale = utils.build_rationale(
            rule=rule,
            ctx=ctx,
            xai=xai,
            principal=principal,
            scores=scores,
            warnings=warnings,
        )

        out.append(
            GeneratedRecommendation(
                patient_id=patient_id,
                prediction_id=prediction_id,
                category=rule.category,
                message_patient=msg_patient,
                message_clinician=msg_clinician,
                rationale=rationale,
                priority=rule.priority,
                target=target,
                horizon_min=horizon_min,
                probability=probability,
                model_name=model_name,
                model_version=model_version,
                rule_id=rule.rule_id,
                rule_version=rule.rule_version,
                trigger_name=rule.trigger_condition,
                safety_level=safety_level,
                xai_reliability_status=ctx.xai_reliability_status,
                actionability=scores,
                open_loop_notice=OPEN_LOOP_NOTICE,
                is_synthetic=True,
            )
        )
    return out
