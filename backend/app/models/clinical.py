"""Prédictions ML et recommandations open-loop.

OPEN-LOOP STRICT : une recommandation naît au statut `pending` et ne devient
`approved` que par décision explicite d'un clinicien. Aucune action
thérapeutique automatique. `reviewed_by` / `reviewed_at` tracent l'arbitrage.
Les prédictions de ce socle sont des placeholders (`model_name='placeholder'`)
en attendant le vrai modèle ML (phase ultérieure).
"""
from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class RecommendationStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class Prediction(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "predictions"

    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    horizon_min: Mapped[int] = mapped_column(default=30)
    predicted_event: Mapped[str] = mapped_column(String(40))  # hypo / hyper / stable
    probability: Mapped[float] = mapped_column(Float)
    model_name: Mapped[str] = mapped_column(String(80), default="placeholder")
    model_version: Mapped[str] = mapped_column(String(40), default="0.0.0")
    is_synthetic: Mapped[bool] = mapped_column(default=True)

    recommendations: Mapped[list["Recommendation"]] = relationship(
        back_populates="prediction"
    )


class Recommendation(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "recommendations"

    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    prediction_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("predictions.id"), nullable=True, index=True
    )
    prediction: Mapped["Prediction | None"] = relationship(
        back_populates="recommendations"
    )

    status: Mapped[str] = mapped_column(
        String(20), default=RecommendationStatus.pending.value, index=True
    )
    category: Mapped[str] = mapped_column(String(60))  # education / monitoring / contact_care
    message: Mapped[str] = mapped_column(Text)  # formulation prudente, non prescriptive
    rationale: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    priority: Mapped[int] = mapped_column(default=3)  # 1=haute ... 5=basse

    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id"), nullable=True, index=True
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    review_note: Mapped[str | None] = mapped_column(Text, nullable=True)
