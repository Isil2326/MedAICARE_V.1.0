"""Scores d'ACTIONNABILITÉ (non cliniques) : priorisent et documentent, ne décident pas.

Heuristiques transparentes de prototype : elles ne valident rien cliniquement et
ne remplacent jamais le jugement humain. Bornées [0, 1]. Documentées pour audit.
"""
from __future__ import annotations

from app.recommendations.schemas import (
    ActionabilityScores,
    RecommendationCategory,
    SafetyLevel,
)


def _clamp(x: float) -> float:
    return round(max(0.0, min(1.0, x)), 3)


def score(
    *,
    category: RecommendationCategory,
    safety_level: SafetyLevel,
    probability: float | None,
    calibrated: bool,
    xai_available: bool,
    xai_reliability_status: str | None,
    safety_passed: bool,
    message_len: int,
) -> ActionabilityScores:
    p = probability if isinstance(probability, (int, float)) else 0.0

    # Clarté : templates contrôlés → message court et lisible.
    clarity = 1.0 if 0 < message_len <= 360 else (0.7 if message_len > 0 else 0.0)

    # Sécurité : 0 si la couche safety a échoué ; review_only légèrement plus prudent.
    if not safety_passed:
        safety = 0.0
    elif safety_level == SafetyLevel.review_only:
        safety = 0.9
    else:
        safety = 1.0

    # Urgence : probabilité, plancher relevé pour les alertes critiques.
    urgency = p
    if category == RecommendationCategory.ALERT_CRITICAL:
        urgency = max(urgency, 0.8)
    urgency = _clamp(urgency)

    # Explicabilité : dépend de la disponibilité ET de la fiabilité XAI.
    if not xai_available:
        explainability = 0.2
    elif xai_reliability_status == "reliable_for_model_debug":
        explainability = 0.9
    elif xai_reliability_status == "caution_semantic_limits":
        explainability = 0.6
    elif xai_reliability_status == "not_reliable_for_clinical_interpretation":
        explainability = 0.3
    else:
        explainability = 0.5

    # Confiance : distance à 0.5 (séparabilité) + bonus calibration.
    confidence = _clamp(abs(p - 0.5) * 2 * 0.7 + (0.3 if calibrated else 0.0))

    overall = _clamp(
        0.30 * safety
        + 0.20 * urgency
        + 0.20 * explainability
        + 0.20 * confidence
        + 0.10 * clarity
    )

    return ActionabilityScores(
        clarity_score=_clamp(clarity),
        safety_score=_clamp(safety),
        urgency_score=urgency,
        explainability_score=_clamp(explainability),
        confidence_score=confidence,
        overall_actionability_score=overall,
    )
