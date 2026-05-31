"""Bilans biologiques importés (QR / saisie).

`verified` distingue de façon fiable un bilan dont la signature a été
vérifiée côté serveur d'un bilan non vérifié. Tant que la vérification
cryptographique n'est pas implémentée (phase ultérieure), `verified` reste
False par défaut — aucune confusion vérifié/non vérifié.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class LabReport(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "lab_reports"

    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    source: Mapped[str | None] = mapped_column(String(80), nullable=True)  # qr / manual
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    signature: Mapped[str | None] = mapped_column(String(512), nullable=True)
    payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    is_synthetic: Mapped[bool] = mapped_column(default=True)
