"""Explications XAI persistées (Phase 3) — traçabilité open-loop.

Une ligne = une explication LOCALE calculée pour un patient à un instant T. AUCUNE
dose, AUCUNE décision : uniquement des contributions de features (pondération du
modèle) et des textes pédagogiques. Données 100 % simulées (`is_synthetic=True`).
Table ADDITIVE : n'altère aucun schéma existant.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class XaiExplanation(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "xai_explanations"

    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    target: Mapped[str] = mapped_column(String(20), index=True)
    horizon_min: Mapped[int] = mapped_column(Integer, default=30, index=True)

    probability: Mapped[float | None] = mapped_column(Float, nullable=True)
    risk_label: Mapped[str] = mapped_column(String(20), default="non calculable")
    calculable: Mapped[bool] = mapped_column(Boolean, default=False)

    model_name: Mapped[str] = mapped_column(String(80), default="none")
    model_version: Mapped[str] = mapped_column(String(40), default="0.0.0")
    calibrated: Mapped[bool] = mapped_column(Boolean, default=False)
    # Ce qui est expliqué : 'modèle non calibré' / 'probabilité calibrée'.
    explains: Mapped[str] = mapped_column(String(60), default="modèle non calibré")

    xai_method: Mapped[str] = mapped_column(String(40), default="none")
    method_fallback: Mapped[bool] = mapped_column(Boolean, default=False)

    top_features: Mapped[list | None] = mapped_column(JSON, nullable=True)
    baseline: Mapped[float | None] = mapped_column(Float, nullable=True)
    explanation_text_patient: Mapped[str | None] = mapped_column(Text, nullable=True)
    explanation_text_clinician: Mapped[str | None] = mapped_column(Text, nullable=True)

    # --- Phase 3.1 : sécurisation sémantique (traçabilité des warnings) -------
    xai_reliability_status: Mapped[str] = mapped_column(
        String(48), default="reliable_for_model_debug"
    )
    xai_warnings: Mapped[list | None] = mapped_column(JSON, nullable=True)
    semantic_limitations: Mapped[list | None] = mapped_column(JSON, nullable=True)

    # Toujours vrai dans ce socle : aucune donnée réelle.
    is_synthetic: Mapped[bool] = mapped_column(Boolean, default=True)
