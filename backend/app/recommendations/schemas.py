"""Schémas de domaine du moteur de recommandation (purs, sans DB).

Aucun champ « dose », « action exécutée » ou « décision automatique » : open-loop
strict. Les catégories autorisées restent non prescriptives.
"""
from __future__ import annotations

import enum
import uuid
from collections.abc import Callable
from dataclasses import dataclass, field


class RecommendationCategory(str, enum.Enum):
    """Catégories autorisées — toutes NON prescriptives."""

    ALERT_CRITICAL = "ALERT_CRITICAL"
    RECOMMENDATION_BEHAVIORAL = "RECOMMENDATION_BEHAVIORAL"
    CLINICAL_REFERRAL = "CLINICAL_REFERRAL"
    # Ne contient JAMAIS de dose ni d'instruction de changement de traitement :
    # signifie uniquement « élément à revoir avec un clinicien ».
    THERAPY_SUGGESTION_REVIEW_ONLY = "THERAPY_SUGGESTION_REVIEW_ONLY"


class SafetyLevel(str, enum.Enum):
    info = "info"
    monitoring = "monitoring"
    urgent = "urgent"
    review_only = "review_only"


# Notice attachée à CHAQUE recommandation générée (jamais masquée).
OPEN_LOOP_NOTICE = (
    "Suggestion indicative open-loop sur données simulées : aucune dose, aucune "
    "décision ni action thérapeutique automatique. Validation ou rejet par un "
    "clinicien obligatoire avant tout usage."
)


@dataclass(frozen=True)
class TriggerContext:
    """Contexte d'évaluation des règles (issu d'une prédiction + XAI optionnelle)."""

    target: str | None
    horizon_min: int | None
    probability: float | None
    calculable: bool
    xai_available: bool = False
    xai_reliability_status: str | None = None


@dataclass(frozen=True)
class RuleSpec:
    """Règle experte versionnée et traçable (déclenche une SUGGESTION pending)."""

    rule_id: str
    rule_version: str
    name: str
    description: str
    trigger_condition: str  # lisible humainement (trace)
    target: str | None  # None = toute cible
    horizon_min: int | None  # None = tout horizon
    probability_threshold: float | None
    required_context: tuple[str, ...]
    safety_constraints: tuple[str, ...]
    message_template: str  # clé de template contrôlé
    category: RecommendationCategory
    priority: int  # 1=haute ... 5=basse
    evidence_level: str
    open_loop_notice: str
    predicate: Callable[[TriggerContext], bool]

    def summary(self) -> dict:
        """Vue sérialisable (sans le prédicat) pour la trace/rationale."""
        return {
            "rule_id": self.rule_id,
            "rule_version": self.rule_version,
            "name": self.name,
            "trigger_condition": self.trigger_condition,
            "target": self.target,
            "horizon_min": self.horizon_min,
            "probability_threshold": self.probability_threshold,
            "required_context": list(self.required_context),
            "safety_constraints": list(self.safety_constraints),
            "category": self.category.value,
            "priority": self.priority,
            "evidence_level": self.evidence_level,
        }


@dataclass(frozen=True)
class ActionabilityScores:
    """Scores d'actionnabilité NON cliniques : priorisent/documentent, ne décident pas."""

    clarity_score: float
    safety_score: float
    urgency_score: float
    explainability_score: float
    confidence_score: float
    overall_actionability_score: float

    def as_dict(self) -> dict:
        return {
            "clarity_score": self.clarity_score,
            "safety_score": self.safety_score,
            "urgency_score": self.urgency_score,
            "explainability_score": self.explainability_score,
            "confidence_score": self.confidence_score,
            "overall_actionability_score": self.overall_actionability_score,
            "note": "Scores non cliniques : priorisation/documentation, jamais une décision.",
        }


@dataclass
class GeneratedRecommendation:
    """Recommandation candidate produite par le moteur (avant persistance)."""

    patient_id: uuid.UUID | None
    prediction_id: uuid.UUID | None
    category: RecommendationCategory
    message_patient: str
    message_clinician: str
    rationale: dict
    priority: int
    target: str | None
    horizon_min: int | None
    probability: float | None
    model_name: str | None
    model_version: str | None
    rule_id: str
    rule_version: str
    trigger_name: str
    safety_level: SafetyLevel
    xai_reliability_status: str | None
    actionability: ActionabilityScores
    open_loop_notice: str = OPEN_LOOP_NOTICE
    is_synthetic: bool = True
    safety_passed: bool = True
    safety_violations: list[str] = field(default_factory=list)
