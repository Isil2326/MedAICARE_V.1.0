"""Schémas Pydantic de la Phase 2 (API ML + sérialisation d'artefacts).

OPEN-LOOP : `PredictResponse` ne renvoie qu'une PROBABILITÉ de risque et un
avertissement explicite. Aucun champ « action », « dose » ou « décision ».
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

TargetName = Literal["hypo", "hyper"]

OPEN_LOOP_NOTICE = (
    "Score de risque indicatif (open-loop, données simulées). "
    "Aucune décision thérapeutique automatique : validation clinique humaine requise."
)


class PredictRequest(BaseModel):
    """Demande d'inférence open-loop.

    `patient_id` : optionnel pour un compte patient (son propre dossier) ;
    requis pour clinicien/admin. `at` : instant d'évaluation T (défaut = maintenant).
    `persist` : si vrai, écrit la prédiction dans `predictions` (is_synthetic=True).
    """

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "patient_id": "00000000-0000-0000-0000-000000000000",
            "target": "hypo",
            "horizon_min": 30,
            "persist": False,
        }
    })

    patient_id: uuid.UUID | None = None
    at: datetime | None = None
    target: TargetName = "hypo"
    horizon_min: int = Field(default=30)
    persist: bool = False


class PredictResponse(BaseModel):
    """Réponse d'inférence : PROBABILITÉ uniquement (open-loop strict)."""

    patient_id: uuid.UUID
    at: datetime
    target: TargetName
    horizon_min: int
    probability: float | None = Field(
        default=None,
        description="Probabilité [0,1] de l'événement, ou null si non calculable "
        "(données insuffisantes / pas de modèle actif).",
    )
    risk_label: str = Field(description="Libellé indicatif: faible/modéré/élevé/non calculable.")
    calculable: bool
    reason: str | None = Field(default=None, description="Raison si non calculable.")
    model_name: str
    model_version: str
    calibrated: bool = False
    is_synthetic: bool = True
    persisted: bool = False
    prediction_id: uuid.UUID | None = None
    n_cgm_points: int = 0
    open_loop_notice: str = OPEN_LOOP_NOTICE


class MetricsReport(BaseModel):
    """Métriques d'évaluation sérialisables. Les champs non calculables sont None."""

    model_config = ConfigDict(extra="allow")

    target: str
    horizon_min: int
    n: int
    positives: int
    negatives: int
    auroc: float | None = None
    auprc: float | None = None
    precision: float | None = None
    recall: float | None = None
    f1: float | None = None
    specificity: float | None = None
    sensitivity: float | None = None
    brier: float | None = None
    ece: float | None = None
    notes: list[str] = Field(default_factory=list)


class RegistryEntry(BaseModel):
    """Entrée de registre de modèle (sérialisée en JSON + table DB)."""

    model_config = ConfigDict(protected_namespaces=())

    model_id: str
    target: str
    horizon_min: int
    model_name: str
    model_version: str
    artifact_path: str
    calibrated: bool
    feature_columns: list[str]
    metrics: dict
    dataset_meta: dict
    is_active: bool = True
    created_at: datetime
