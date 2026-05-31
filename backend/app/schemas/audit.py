"""Contrats Pydantic pour le journal d'audit."""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel


class AuditLogPublic(BaseModel):
    id: uuid.UUID
    actor_user_id: uuid.UUID | None = None
    action: str
    resource_type: str | None = None
    resource_id: str | None = None
    event_metadata: dict | None = None
    sequence: int
    prev_hash: str | None = None
    entry_hash: str
    created_at: datetime

    class Config:
        from_attributes = True


class AuditChainVerification(BaseModel):
    valid: bool
    checked: int
    broken_at: int | None = None
