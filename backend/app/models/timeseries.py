"""Séries temporelles IoMT (CGM, insuline, repas, activité).

Conçues TimescaleDB-ready : sur PostgreSQL+TimescaleDB ces tables peuvent
devenir des hypertables (partitionnement sur `ts`). En l'absence de
l'extension — ou, comme ici, parce que la conversion exigerait une clé
primaire composite `(id, ts)` (changement destructif interdit en Phase 1) —
elles fonctionnent comme tables PostgreSQL natives avec des index temporels
`(patient_id, ts)`. Voir `docs/migration/PHASE_1_DATA_ENGINEERING.md`.

Toutes les données de ce socle sont marquées `is_synthetic=True` (aucune
donnée réelle). Champs pipeline ajoutés en Phase 1 :
- `source`             : origine logique (manual / sim / device / import…).
- `external_event_id`  : identifiant fourni par la source pour l'idempotence.
- `device_id`          : appareil émetteur (CGM, pompe, montre…).
- `quality_flag`       : marqueur qualité (valid / suspicious_timestamp / …).
- `ingestion_batch_id` : corrélation d'un lot d'ingestion.
- `unit`               : unité de la valeur principale (mg/dL, U, g, min…).
- `event_metadata`     : contexte libre JSON (non structurant).

Déduplication : index unique partiel `(patient_id, source, external_event_id)`
quand `external_event_id` est fourni ; sinon déduplication applicative par clé
logique (voir `timeseries_service`).
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    JSON,
    DateTime,
    Float,
    ForeignKey,
    Index,
    String,
    Uuid,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class _TimeseriesPipelineMixin:
    """Champs communs du pipeline temporel (Phase 1)."""

    source: Mapped[str] = mapped_column(String(40), default="manual", index=True)
    external_event_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    device_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    quality_flag: Mapped[str] = mapped_column(String(30), default="valid", index=True)
    ingestion_batch_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True)
    unit: Mapped[str | None] = mapped_column(String(20), nullable=True)
    event_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)


def _dedup_index(name: str, table: str) -> Index:
    """Index unique partiel d'idempotence par `external_event_id`.

    Portable : `external_event_id IS NOT NULL` côté PostgreSQL et SQLite.
    """
    return Index(
        name,
        "patient_id",
        "source",
        "external_event_id",
        unique=True,
        postgresql_where=text("external_event_id IS NOT NULL"),
        sqlite_where=text("external_event_id IS NOT NULL"),
    )


class CgmReading(_TimeseriesPipelineMixin, UUIDMixin, TimestampMixin, Base):
    __tablename__ = "cgm_readings"

    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    glucose_mgdl: Mapped[float] = mapped_column(Float)
    trend: Mapped[str | None] = mapped_column(String(20), nullable=True)
    is_synthetic: Mapped[bool] = mapped_column(default=True)

    __table_args__ = (
        Index("ix_cgm_patient_ts", "patient_id", "ts"),
        _dedup_index("uq_cgm_external_event", "cgm_readings"),
    )


class InsulinEvent(_TimeseriesPipelineMixin, UUIDMixin, TimestampMixin, Base):
    __tablename__ = "insulin_events"

    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    units: Mapped[float] = mapped_column(Float)
    insulin_type: Mapped[str | None] = mapped_column(String(40), nullable=True)  # bolus/basal
    is_synthetic: Mapped[bool] = mapped_column(default=True)

    __table_args__ = (
        Index("ix_insulin_patient_ts", "patient_id", "ts"),
        _dedup_index("uq_insulin_external_event", "insulin_events"),
    )


class MealEvent(_TimeseriesPipelineMixin, UUIDMixin, TimestampMixin, Base):
    __tablename__ = "meal_events"

    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    carbs_g: Mapped[float] = mapped_column(Float)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_synthetic: Mapped[bool] = mapped_column(default=True)

    __table_args__ = (
        Index("ix_meal_patient_ts", "patient_id", "ts"),
        _dedup_index("uq_meal_external_event", "meal_events"),
    )


class ActivityEvent(_TimeseriesPipelineMixin, UUIDMixin, TimestampMixin, Base):
    __tablename__ = "activity_events"

    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    activity_type: Mapped[str | None] = mapped_column(String(60), nullable=True)
    duration_min: Mapped[float] = mapped_column(Float)
    intensity: Mapped[str | None] = mapped_column(String(20), nullable=True)
    is_synthetic: Mapped[bool] = mapped_column(default=True)

    __table_args__ = (
        Index("ix_activity_patient_ts", "patient_id", "ts"),
        _dedup_index("uq_activity_external_event", "activity_events"),
    )
