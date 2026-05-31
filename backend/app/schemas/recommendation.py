"""Contrats Pydantic pour les recommandations open-loop."""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class RecommendationPublic(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    prediction_id: uuid.UUID | None = None
    status: str
    category: str
    message: str
    rationale: dict | None = None
    priority: int
    reviewed_by: uuid.UUID | None = None
    reviewed_at: datetime | None = None
    review_note: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


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
