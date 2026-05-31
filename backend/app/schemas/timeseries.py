"""Contrats Pydantic du pipeline temporel (Phase 1 — Data Engineering).

Validation stricte des timestamps :
- timezone-aware OBLIGATOIRE (les timestamps naïfs sont rejetés, décision
  documentée dans docs/migration/PHASE_1_DATA_ENGINEERING.md) ;
- normalisation systématique en UTC avant stockage ;
- rejet des timestamps trop futurs (tolérance d'horloge `FUTURE_TOLERANCE`) ;
- rejet des timestamps absurdement anciens (avant `MIN_TS`) ;
- cohérence `start <= end` pour les fenêtres de requête.

Bornes physiologiques : valeurs impossibles rejetées (422). Les valeurs
plausibles mais cliniquement extrêmes restent acceptées et peuvent être
marquées via `quality_flag` côté service (open-loop, aucune correction auto).
"""
from __future__ import annotations

import enum
import uuid
from datetime import datetime, timedelta, timezone

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

# Tolérance d'horloge pour accepter un ts légèrement futur (skew client/serveur).
FUTURE_TOLERANCE = timedelta(minutes=2)
# Plancher de plausibilité (pas de données médicales avant cette date dans ce socle).
MIN_TS = datetime(2000, 1, 1, tzinfo=timezone.utc)


def normalize_utc(value: datetime, *, field: str = "ts") -> datetime:
    """Exige un datetime tz-aware, le normalise en UTC, rejette naïf/futur/ancien."""
    if not isinstance(value, datetime):
        raise ValueError(f"{field} doit être un datetime ISO 8601.")
    if value.tzinfo is None or value.tzinfo.utcoffset(value) is None:
        raise ValueError(
            f"{field} doit être timezone-aware (ex. '2026-05-31T10:00:00+00:00'). "
            "Les timestamps naïfs sont refusés."
        )
    value = value.astimezone(timezone.utc)
    now = datetime.now(timezone.utc)
    if value > now + FUTURE_TOLERANCE:
        raise ValueError(f"{field} est dans le futur (> tolérance d'horloge).")
    if value < MIN_TS:
        raise ValueError(f"{field} est antérieur à {MIN_TS.date()} (valeur aberrante).")
    return value


# --- Enums contrôlés --------------------------------------------------------
class CgmTrend(str, enum.Enum):
    rising = "rising"
    falling = "falling"
    stable = "stable"
    unknown = "unknown"


class InsulinType(str, enum.Enum):
    bolus = "bolus"
    basal = "basal"
    correction = "correction"
    unknown = "unknown"


class ActivityIntensity(str, enum.Enum):
    low = "low"
    moderate = "moderate"
    high = "high"
    unknown = "unknown"


class QualityFlag(str, enum.Enum):
    valid = "valid"
    out_of_range = "out_of_range"
    duplicate = "duplicate"
    missing_context = "missing_context"
    suspicious_timestamp = "suspicious_timestamp"
    device_error = "device_error"
    unknown = "unknown"


# --- Champs communs d'ingestion ---------------------------------------------
class _IngestBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ts: datetime = Field(description="Horodatage timezone-aware (stocké en UTC).")
    source: str = Field(default="manual", max_length=40)
    external_event_id: str | None = Field(default=None, max_length=120)
    device_id: str | None = Field(default=None, max_length=80)
    unit: str | None = Field(default=None, max_length=20)
    event_metadata: dict | None = None

    @field_validator("ts")
    @classmethod
    def _v_ts(cls, v: datetime) -> datetime:
        return normalize_utc(v, field="ts")


# --- CGM --------------------------------------------------------------------
class CgmReadingCreate(_IngestBase):
    glucose_mgdl: float = Field(ge=30, le=600, description="Glycémie interstitielle (mg/dL).")
    trend: CgmTrend | None = None

    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={
            "examples": [
                {
                    "ts": "2026-05-31T10:00:00+00:00",
                    "glucose_mgdl": 142.0,
                    "trend": "stable",
                    "source": "sim",
                    "device_id": "sim-cgm-001",
                    "external_event_id": "cgm-2026-05-31T10:00",
                    "unit": "mg/dL",
                }
            ]
        },
    )


class CgmReadingPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    ts: datetime
    glucose_mgdl: float
    trend: str | None = None
    source: str
    device_id: str | None = None
    external_event_id: str | None = None
    quality_flag: str
    unit: str | None = None
    is_synthetic: bool


# --- Insuline ---------------------------------------------------------------
class InsulinEventCreate(_IngestBase):
    units: float = Field(gt=0, le=100, description="Unités d'insuline (rejet > 100 = aberrant).")
    insulin_type: InsulinType | None = None

    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={
            "examples": [
                {
                    "ts": "2026-05-31T12:30:00+00:00",
                    "units": 6.0,
                    "insulin_type": "bolus",
                    "source": "sim",
                    "unit": "U",
                }
            ]
        },
    )


class InsulinEventPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    ts: datetime
    units: float
    insulin_type: str | None = None
    source: str
    device_id: str | None = None
    external_event_id: str | None = None
    quality_flag: str
    unit: str | None = None
    is_synthetic: bool


# --- Repas ------------------------------------------------------------------
class MealEventCreate(_IngestBase):
    carbs_g: float = Field(ge=0, le=300, description="Glucides (g), rejet > 300 = aberrant.")
    description: str | None = Field(default=None, max_length=255)

    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={
            "examples": [
                {
                    "ts": "2026-05-31T12:15:00+00:00",
                    "carbs_g": 60.0,
                    "description": "Déjeuner (pâtes + salade)",
                    "source": "manual",
                    "unit": "g",
                }
            ]
        },
    )


class MealEventPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    ts: datetime
    carbs_g: float
    description: str | None = None
    source: str
    device_id: str | None = None
    external_event_id: str | None = None
    quality_flag: str
    unit: str | None = None
    is_synthetic: bool


# --- Activité ---------------------------------------------------------------
class ActivityEventCreate(_IngestBase):
    duration_min: float = Field(gt=0, le=1440, description="Durée (min), rejet > 1440 = aberrant.")
    activity_type: str | None = Field(default=None, max_length=60)
    intensity: ActivityIntensity | None = None

    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={
            "examples": [
                {
                    "ts": "2026-05-31T18:00:00+00:00",
                    "duration_min": 45.0,
                    "activity_type": "marche",
                    "intensity": "moderate",
                    "source": "sim",
                    "unit": "min",
                }
            ]
        },
    )


class ActivityEventPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    ts: datetime
    duration_min: float
    activity_type: str | None = None
    intensity: str | None = None
    source: str
    device_id: str | None = None
    external_event_id: str | None = None
    quality_flag: str
    unit: str | None = None
    is_synthetic: bool


# --- Requête fenêtre temporelle ---------------------------------------------
class TimeseriesQuery(BaseModel):
    model_config = ConfigDict(extra="forbid")

    start: datetime | None = None
    end: datetime | None = None
    limit: int = Field(default=500, ge=1, le=5000)
    offset: int = Field(default=0, ge=0)

    @field_validator("start", "end")
    @classmethod
    def _v_window(cls, v: datetime | None) -> datetime | None:
        if v is None:
            return None
        return normalize_utc(v, field="fenêtre")

    @model_validator(mode="after")
    def _v_order(self) -> "TimeseriesQuery":
        if self.start and self.end and self.start > self.end:
            raise ValueError("Fenêtre invalide : start doit être <= end.")
        return self


# --- Vue consolidée ---------------------------------------------------------
class TimeseriesEventPublic(BaseModel):
    """Événement normalisé pour la vue consolidée `GET /events`."""

    kind: str  # cgm / insulin / meal / activity
    id: uuid.UUID
    patient_id: uuid.UUID
    ts: datetime
    value: float | None = None  # glucose_mgdl / units / carbs_g / duration_min
    unit: str | None = None
    label: str | None = None  # trend / insulin_type / description / activity_type
    source: str
    quality_flag: str


# --- Résultat d'ingestion ---------------------------------------------------
class IngestionResult(BaseModel):
    kind: str
    id: uuid.UUID
    created: bool
    duplicate: bool
    quality_flag: str
    ingestion_batch_id: uuid.UUID | None = None
