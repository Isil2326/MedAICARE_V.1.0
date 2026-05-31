"""Registre de modèles ML (miroir DB du registre JSON).

Le registre JSON (`artifacts/registry.json`) reste la source canonique côté
fichiers (utilisable hors session DB, ex. CLI). Cette table en est un MIROIR
requêtable/traçable côté base : un modèle « actif » par couple (target, horizon).
`is_synthetic`/open-loop : ces modèles ne produisent que des scores de risque.
"""
from __future__ import annotations

import uuid

from sqlalchemy import JSON, Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class ModelRegistryEntry(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "model_registry"

    model_id: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    target: Mapped[str] = mapped_column(String(20), index=True)
    horizon_min: Mapped[int] = mapped_column(Integer, index=True)
    model_name: Mapped[str] = mapped_column(String(80))
    model_version: Mapped[str] = mapped_column(String(40))
    artifact_path: Mapped[str] = mapped_column(String(255))
    calibrated: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    feature_columns: Mapped[list | None] = mapped_column(JSON, nullable=True)
    metrics: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    dataset_meta: Mapped[dict | None] = mapped_column(JSON, nullable=True)
