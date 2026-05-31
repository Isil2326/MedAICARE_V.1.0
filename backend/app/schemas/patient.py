"""Contrats Pydantic pour les patients."""
from __future__ import annotations

import uuid
from datetime import date

from pydantic import BaseModel


class PatientPublic(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name: str
    birth_date: date | None = None
    diabetes_type: str | None = None
    is_synthetic: bool

    class Config:
        from_attributes = True
