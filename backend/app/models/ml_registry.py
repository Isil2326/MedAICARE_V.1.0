"""Registre de modèles ML (miroir DB du registre JSON).

Le registre JSON (`artifacts/registry.json`) reste la source canonique côté
fichiers (utilisable hors session DB, ex. CLI). Cette table en est un MIROIR
requêtable/traçable côté base : un modèle « actif » par couple (target, horizon).
`is_synthetic`/open-loop : ces modèles ne produisent que des scores de risque.
"""
from __future__ import annotations

import uuid

from sqlalchemy import JSON, Boolean, Index, Integer, String, text
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
    # Cycle de vie explicite : active / candidate / archived.
    status: Mapped[str] = mapped_column(String(20), default="active", index=True)
    # Statut d'évaluation scientifique (Phase 2.1) : evaluated /
    # insufficient_test_positives / not_evaluable_mono_class_test / candidate_only.
    evaluation_status: Mapped[str | None] = mapped_column(String(40), nullable=True, index=True)
    # Versions de définition (la donnée est TOUJOURS simulée → synthetic_only=True).
    dataset_version: Mapped[str | None] = mapped_column(String(40), nullable=True)
    features_version: Mapped[str | None] = mapped_column(String(40), nullable=True)
    synthetic_only: Mapped[bool] = mapped_column(Boolean, default=True)
    feature_columns: Mapped[list | None] = mapped_column(JSON, nullable=True)
    metrics: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    dataset_meta: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    __table_args__ = (
        # Garantie BASE : un seul modèle ACTIF par couple (target, horizon_min).
        Index(
            "uq_model_registry_active_couple",
            "target",
            "horizon_min",
            unique=True,
            sqlite_where=text("is_active = 1"),
            postgresql_where=text("is_active = true"),
        ),
    )
