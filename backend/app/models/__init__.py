"""Modèles ORM. L'import ici garantit que tout le metadata est enregistré
(pour Alembic autogenerate et la création de schéma)."""
from app.models.base import Base
from app.models.user import Role, User
from app.models.profile import Patient, ClinicianProfile
from app.models.consent import Consent
from app.models.token import RefreshToken
from app.models.audit import AuditLog
from app.models.timeseries import (
    CgmReading,
    InsulinEvent,
    MealEvent,
    ActivityEvent,
)
from app.models.lab import LabReport
from app.models.clinical import Prediction, Recommendation
from app.models.ml_registry import ModelRegistryEntry

__all__ = [
    "Base",
    "Role",
    "User",
    "Patient",
    "ClinicianProfile",
    "Consent",
    "RefreshToken",
    "AuditLog",
    "CgmReading",
    "InsulinEvent",
    "MealEvent",
    "ActivityEvent",
    "LabReport",
    "Prediction",
    "Recommendation",
    "ModelRegistryEntry",
]
