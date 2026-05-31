"""Journal d'audit append-only à chaînage cryptographique.

Chaque entrée contient le hash de l'entrée précédente (`prev_hash`) et son
propre hash (`entry_hash`) calculé sur ses champs immuables. Toute
modification ou suppression d'une entrée casse la chaîne et devient
détectable. Le journal n'expose aucune API de mise à jour/suppression.
"""
from __future__ import annotations

import uuid

from sqlalchemy import JSON, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class AuditLog(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "audit_logs"

    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id"), nullable=True, index=True
    )
    action: Mapped[str] = mapped_column(String(80), index=True)
    resource_type: Mapped[str | None] = mapped_column(String(80), nullable=True)
    resource_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)
    event_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    prev_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    # Unicité au niveau base : empêche une fourche de la chaîne (deux entrées
    # avec le même numéro de séquence ou le même hash sous insertion concurrente).
    entry_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    sequence: Mapped[int] = mapped_column(default=0, unique=True, index=True)
