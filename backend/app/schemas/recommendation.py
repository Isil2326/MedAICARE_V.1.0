"""Contrats Pydantic pour les recommandations open-loop."""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RecommendationPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: uuid.UUID
    patient_id: uuid.UUID
    prediction_id: uuid.UUID | None = None
    status: str
    category: str
    message: str
    rationale: dict | None = None
    priority: int
    # --- Phase 4 : traçabilité du moteur de recommandation -------------------
    target: str | None = None
    horizon_min: int | None = None
    probability: float | None = None
    model_name: str | None = None
    model_version: str | None = None
    rule_id: str | None = None
    rule_version: str | None = None
    trigger_name: str | None = None
    safety_level: str | None = None
    xai_reliability_status: str | None = None
    actionability_score: float | None = None
    is_synthetic: bool = True
    reviewed_by: uuid.UUID | None = None
    reviewed_at: datetime | None = None
    review_note: str | None = None
    created_at: datetime


class ReviewRequest(BaseModel):
    note: str | None = Field(default=None, max_length=1000)

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"note": "Validé : cohérent avec la tendance glycémique et le contexte patient."},
                {"note": "Rejeté : donnée CGM probablement erronée, à recontrôler."},
            ]
        }
    }


class ModifyRequest(BaseModel):
    """Amendement clinicien d'une suggestion pending (reste non prescriptive)."""

    message: str | None = Field(default=None, max_length=2000)
    note: str | None = Field(default=None, max_length=1000)


class GenerateRequest(BaseModel):
    """Demande de génération de suggestions open-loop (clinicien/admin)."""

    model_config = ConfigDict(
        protected_namespaces=(),
        json_schema_extra={
            "example": {
                "patient_id": "00000000-0000-0000-0000-000000000000",
                "target": "hypo",
                "horizon_min": 30,
                "include_xai": True,
            }
        },
    )

    patient_id: uuid.UUID | None = None
    prediction_id: uuid.UUID | None = None
    target: str | None = None  # hypo | hyper ; None = les deux
    horizon_min: int = Field(default=30)
    at: datetime | None = None
    include_xai: bool = True


class GenerateResponse(BaseModel):
    """Réponse de génération : suggestions créées + blocages safety + diagnostic."""

    generated: list[RecommendationPublic] = Field(default_factory=list)
    blocked: list[dict] = Field(default_factory=list)
    calculable: bool = False
    reasons: list[str] = Field(default_factory=list)
    open_loop_notice: str = (
        "Toutes les suggestions naissent 'pending' : validation clinicien obligatoire. "
        "Aucune dose, aucune décision automatique. Données simulées."
    )
