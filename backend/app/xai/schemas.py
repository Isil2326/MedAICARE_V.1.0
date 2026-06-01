"""Schémas Pydantic de la Phase 3 (API XAI + sérialisation des artefacts).

XAI ≠ causalité : les champs décrivent la CONTRIBUTION d'une feature au SCORE du
modèle, jamais une cause médicale. Open-loop strict : aucun champ « dose »,
« action » ou « décision ».
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

TargetName = Literal["hypo", "hyper"]
Audience = Literal["patient", "clinician"]
XaiMethod = Literal["auto", "shap", "lime", "native"]

OPEN_LOOP_NOTICE = (
    "Explication indicative (open-loop, données simulées). Elle décrit le "
    "comportement du modèle, PAS une cause médicale. Aucune décision "
    "thérapeutique, aucune dose : validation clinique humaine requise."
)

XAI_LIMITATIONS = (
    "SHAP/LIME/EBM expliquent la pondération du modèle, pas la causalité "
    "physiologique. Résultats obtenus sur données 100 % synthétiques, non "
    "transférables à des patients réels. Importance statistique ≠ preuve clinique."
)

ReliabilityStatus = Literal[
    "reliable_for_model_debug",
    "caution_semantic_limits",
    "not_reliable_for_clinical_interpretation",
]

# Vocabulaire de direction GLOBALE (Phase 3.1) : une moyenne signée n'est pas une
# vérité simple. On qualifie plutôt l'interprétabilité de la direction.
GlobalDirection = Literal[
    "augmente",
    "diminue",
    "mixte",
    "indéterminé",
    "context_dependent",
    "not_globalizable",
    "local_only",
    "aggregated_signed_effect",
]


class FeatureContribution(BaseModel):
    """Contribution signée d'une feature au score du modèle (pas une cause)."""

    feature: str
    value: float | None = Field(default=None, description="Valeur de la feature au point T (NaN→null).")
    contribution: float | None = Field(
        default=None, description="Contribution signée au score (si la méthode la fournit)."
    )
    direction: Literal["augmente", "diminue", "neutre", "indéterminé"] = "indéterminé"
    abs_importance: float | None = Field(
        default=None, description="Magnitude (|contribution| ou importance globale)."
    )


class LocalExplainRequest(BaseModel):
    """Demande d'explication locale d'une prédiction open-loop."""

    model_config = ConfigDict(
        protected_namespaces=(),
        json_schema_extra={
            "example": {
                "patient_id": "00000000-0000-0000-0000-000000000000",
                "target": "hypo",
                "horizon_min": 30,
                "method": "auto",
                "audience": "clinician",
                "persist": False,
            }
        },
    )

    patient_id: uuid.UUID | None = None
    target: TargetName = "hypo"
    horizon_min: int = Field(default=30)
    at: datetime | None = None
    method: str = "auto"  # validé côté handler (400 si invalide) : auto|shap|lime|native
    audience: Audience = "clinician"
    persist: bool = False
    top_k: int = Field(default=6, ge=1, le=18)


class LocalExplanation(BaseModel):
    """Réponse d'explication locale (open-loop strict)."""

    model_config = ConfigDict(protected_namespaces=())

    patient_id: uuid.UUID
    at: datetime
    target: TargetName
    horizon_min: int
    probability: float | None = None
    risk_label: str
    calculable: bool
    reason: str | None = None
    model_name: str
    model_version: str
    calibrated: bool = False
    explains: str = Field(
        default="modèle non calibré",
        description="Ce qui est expliqué : 'modèle non calibré' / 'probabilité calibrée'.",
    )
    xai_method: str
    method_fallback: bool = False
    top_features: list[FeatureContribution] = Field(default_factory=list)
    baseline: float | None = Field(default=None, description="Valeur attendue/baseline du modèle si disponible.")
    explanation_text_patient: str = ""
    explanation_text_clinician: str = ""
    limitations: str = XAI_LIMITATIONS
    open_loop_notice: str = OPEN_LOOP_NOTICE
    synthetic_only: bool = True
    n_cgm_points: int = 0
    cgm_gap: bool = False
    cached: bool = False
    explanation_id: uuid.UUID | None = None
    # --- Phase 3.1 : sécurisation sémantique (jamais masquée) ---------------
    xai_reliability_status: ReliabilityStatus = "reliable_for_model_debug"
    xai_warnings: list[str] = Field(default_factory=list)
    semantic_limitations: list[str] = Field(default_factory=list)
    calibration_notice: str = ""
    synthetic_data_notice: str = ""


class GlobalFeatureImportance(BaseModel):
    feature: str
    mean_abs_importance: float | None = None
    direction: GlobalDirection = "indéterminé"
    # Signe agrégé sous-jacent conservé à titre INFORMATIF (pas une vérité simple).
    aggregated_sign: Literal["augmente", "diminue", "mixte"] | None = None


class GlobalExplanation(BaseModel):
    """Explication globale d'un modèle actif (par couple cible/horizon)."""

    model_config = ConfigDict(protected_namespaces=())

    target: TargetName
    horizon_min: int
    model_id: str
    model_name: str
    model_version: str
    xai_method: str
    method_fallback: bool = False
    calibrated: bool = False
    explains: str = "modèle non calibré"
    top_features: list[GlobalFeatureImportance] = Field(default_factory=list)
    dataset_version: str | None = None
    features_version: str | None = None
    synthetic_only: bool = True
    n_background: int = 0
    generated_at: datetime
    limitations: str = XAI_LIMITATIONS
    # --- Phase 3.1 : sécurisation sémantique (jamais masquée) ---------------
    xai_reliability_status: ReliabilityStatus = "reliable_for_model_debug"
    xai_warnings: list[str] = Field(default_factory=list)
    semantic_limitations: list[str] = Field(default_factory=list)
    calibration_notice: str = ""
    synthetic_data_notice: str = ""
    direction_semantics: str = ""
    # Métriques d'évaluation réelles embarquées (None si non calculées).
    evaluation: dict | None = None
