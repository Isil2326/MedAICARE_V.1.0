"""Séries temporelles IoMT (CGM, insuline, repas, activité).

Conçues TimescaleDB-ready : sur PostgreSQL+TimescaleDB ces tables peuvent
devenir des hypertables (partitionnement sur `ts`). En l'absence de
l'extension, elles fonctionnent comme tables PostgreSQL natives. Toutes les
données de ce socle sont marquées `is_synthetic=True` (aucune donnée réelle).
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class CgmReading(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "cgm_readings"

    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    glucose_mgdl: Mapped[float] = mapped_column(Float)
    trend: Mapped[str | None] = mapped_column(String(20), nullable=True)
    device_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    is_synthetic: Mapped[bool] = mapped_column(default=True)

    __table_args__ = (Index("ix_cgm_patient_ts", "patient_id", "ts"),)


class InsulinEvent(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "insulin_events"

    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    units: Mapped[float] = mapped_column(Float)
    insulin_type: Mapped[str | None] = mapped_column(String(40), nullable=True)  # bolus/basal
    is_synthetic: Mapped[bool] = mapped_column(default=True)

    __table_args__ = (Index("ix_insulin_patient_ts", "patient_id", "ts"),)


class MealEvent(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "meal_events"

    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    carbs_g: Mapped[float] = mapped_column(Float)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_synthetic: Mapped[bool] = mapped_column(default=True)

    __table_args__ = (Index("ix_meal_patient_ts", "patient_id", "ts"),)


class ActivityEvent(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "activity_events"

    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    activity_type: Mapped[str | None] = mapped_column(String(60), nullable=True)
    duration_min: Mapped[float] = mapped_column(Float)
    intensity: Mapped[str | None] = mapped_column(String(20), nullable=True)
    is_synthetic: Mapped[bool] = mapped_column(default=True)

    __table_args__ = (Index("ix_activity_patient_ts", "patient_id", "ts"),)
