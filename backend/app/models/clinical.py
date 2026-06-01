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
    modified = "modified"


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
    category: Mapped[str] = mapped_column(String(60))  # ALERT_CRITICAL / RECOMMENDATION_BEHAVIORAL / ...
    message: Mapped[str] = mapped_column(Text)  # formulation prudente, non prescriptive
    rationale: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    priority: Mapped[int] = mapped_column(default=3)  # 1=haute ... 5=basse

    # --- Phase 4 : traçabilité du moteur de recommandation open-loop -----------
    # Colonnes additives nullables (compat lignes Phase 2). Toute la richesse
    # détaillée (features principales, contexte, scores, warnings XAI) reste dans
    # `rationale` (JSON) ; on n'expose en colonnes que les champs interrogeables.
    target: Mapped[str | None] = mapped_column(String(10), nullable=True)  # hypo / hyper
    horizon_min: Mapped[int | None] = mapped_column(nullable=True)
    probability: Mapped[float | None] = mapped_column(Float, nullable=True)
    model_name: Mapped[str | None] = mapped_column(String(80), nullable=True)
    model_version: Mapped[str | None] = mapped_column(String(40), nullable=True)
    rule_id: Mapped[str | None] = mapped_column(String(60), nullable=True, index=True)
    rule_version: Mapped[str | None] = mapped_column(String(20), nullable=True)
    trigger_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    safety_level: Mapped[str | None] = mapped_column(String(20), nullable=True)
    xai_reliability_status: Mapped[str | None] = mapped_column(String(48), nullable=True)
    actionability_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_synthetic: Mapped[bool] = mapped_column(default=True)

    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id"), nullable=True, index=True
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    review_note: Mapped[str | None] = mapped_column(Text, nullable=True)
