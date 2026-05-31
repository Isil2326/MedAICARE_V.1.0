"""Service d'ingestion et de lecture des séries temporelles (Phase 1).

Responsabilités : validation métier, ownership patient, déduplication
idempotente, marquage qualité (`quality_flag`), audit des écritures, commit.

OPEN-LOOP / DONNÉES SIMULÉES : toutes les écritures forcent `is_synthetic=True`.
Aucune recommandation ni décision thérapeutique n'est produite ici. Aucune
bascule vers des données réelles n'est possible via cette API.

Déduplication (idempotence) :
- si `external_event_id` fourni → clé `(patient_id, source, external_event_id)` ;
- sinon → clé logique `(patient_id, source, ts, valeur principale)`.
Un doublon ne crée pas de nouvelle ligne : l'enregistrement existant est
renvoyé (`created=False, duplicate=True`) — pas de doublon silencieux.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import ActivityEvent, CgmReading, InsulinEvent, MealEvent, User
from app.repositories import timeseries_repo, user_repo
from app.schemas.timeseries import (
    ActivityEventCreate,
    CgmReadingCreate,
    InsulinEventCreate,
    IngestionResult,
    MealEventCreate,
)
from app.services import audit_service

# Au-delà de cet âge, un ts plausible est tout de même marqué "suspicious".
_SUSPICIOUS_AGE_DAYS = 366


class TimeseriesError(Exception):
    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


# --- Ownership --------------------------------------------------------------
def _require_owned_patient(db: Session, user: User):
    """Résout le patient propriétaire du compte courant ; refuse sinon.

    RBAC explicite (rôle) **et** ownership (dossier rattaché) sont tous deux
    requis : un clinicien/admin ne peut jamais écrire, même si une ligne patient
    venait à être rattachée par erreur (défense en profondeur).
    """
    if user.role_name != "patient":
        raise TimeseriesError(
            "forbidden",
            "Seul un compte patient peut écrire ses propres données temporelles.",
        )
    patient = user_repo.get_patient_by_user(db, user.id)
    if patient is None:
        raise TimeseriesError(
            "forbidden",
            "Seul un compte patient peut écrire ses propres données temporelles.",
        )
    return patient


def resolve_read_scope(db: Session, user: User, patient_id: uuid.UUID | None) -> uuid.UUID:
    """Détermine le patient_id lisible selon le rôle (RBAC + ownership).

    - patient : uniquement son propre dossier (paramètre ignoré/contrôlé) ;
    - clinician/admin : doit cibler un patient_id explicite (lecture autorisée).
    """
    if user.role_name == "patient":
        patient = user_repo.get_patient_by_user(db, user.id)
        if patient is None:
            raise TimeseriesError("forbidden", "Aucun dossier patient associé au compte.")
        if patient_id is not None and patient_id != patient.id:
            raise TimeseriesError(
                "forbidden", "Un patient ne peut lire que son propre dossier."
            )
        return patient.id
    # clinician / admin
    if patient_id is None:
        raise TimeseriesError(
            "bad_request",
            "patient_id requis pour la lecture clinicien/admin.",
        )
    return patient_id


# --- Qualité ----------------------------------------------------------------
def _quality_flag(ts: datetime) -> str:
    """Marquage qualité minimal (open-loop : on marque, on ne corrige pas).

    Les valeurs hors-bornes physiologiques sont déjà rejetées (422) par Pydantic.
    Ici on signale un ts plausible mais anormalement ancien.
    """
    age = datetime.now(timezone.utc) - ts
    if age.days > _SUSPICIOUS_AGE_DAYS:
        return "suspicious_timestamp"
    return "valid"


# --- Ingestion générique ----------------------------------------------------
def _ingest(
    db: Session,
    *,
    kind: str,
    model_cls,
    patient_id: uuid.UUID,
    payload,
    field_map: dict,
    actor_user_id: uuid.UUID,
    batch_id: uuid.UUID | None,
    ip: str | None,
    ua: str | None,
) -> IngestionResult:
    # 1) Déduplication idempotente (pré-vérification)
    existing = _find_existing(db, kind, patient_id, payload, field_map)
    if existing is not None:
        return _duplicate_result(kind, existing)

    # 2) Construction + qualité + is_synthetic forcé
    quality = _quality_flag(payload.ts)
    common = dict(
        patient_id=patient_id,
        ts=payload.ts,
        source=payload.source,
        external_event_id=payload.external_event_id,
        device_id=payload.device_id,
        unit=payload.unit,
        event_metadata=payload.event_metadata,
        quality_flag=quality,
        ingestion_batch_id=batch_id,
        is_synthetic=True,
    )
    specific = {col: getattr(payload, attr) for col, attr in field_map["specific"].items()}
    # Enums -> valeur str
    for k, v in list(specific.items()):
        if hasattr(v, "value"):
            specific[k] = v.value
    obj = model_cls(**common, **specific)
    timeseries_repo.add(db, obj)

    # 3) Audit de l'écriture
    audit_service.record(
        db,
        action=f"timeseries.{kind}.create",
        actor_user_id=actor_user_id,
        resource_type=kind,
        resource_id=str(obj.id),
        event_metadata={"synthetic": True, "quality_flag": quality, "source": payload.source},
        ip_address=ip,
        user_agent=ua,
    )
    try:
        db.commit()
    except IntegrityError:
        # Course concurrente : un autre insert identique a gagné (index unique
        # partiel sur external_event_id). On reste idempotent → renvoyer l'existant.
        db.rollback()
        existing = _find_existing(db, kind, patient_id, payload, field_map)
        if existing is not None:
            return _duplicate_result(kind, existing)
        raise
    return IngestionResult(
        kind=kind, id=obj.id, created=True, duplicate=False,
        quality_flag=quality, ingestion_batch_id=batch_id,
    )


def _find_existing(db: Session, kind: str, patient_id: uuid.UUID, payload, field_map: dict):
    """Recherche un doublon par external_event_id puis par clé logique."""
    if payload.external_event_id:
        found = timeseries_repo.find_by_external_id(
            db, kind, patient_id=patient_id,
            source=payload.source, external_event_id=payload.external_event_id,
        )
        if found is not None:
            return found
    main_value = getattr(payload, field_map["value"])
    return timeseries_repo.find_logical_duplicate(
        db, kind, patient_id=patient_id, source=payload.source,
        ts=payload.ts, value=main_value,
    )


def _duplicate_result(kind: str, existing) -> IngestionResult:
    return IngestionResult(
        kind=kind, id=existing.id, created=False, duplicate=True,
        quality_flag=existing.quality_flag,
        ingestion_batch_id=existing.ingestion_batch_id,
    )


# --- API service par type ---------------------------------------------------
def ingest_cgm(db, user, payload: CgmReadingCreate, *, batch_id=None, ip=None, ua=None):
    patient = _require_owned_patient(db, user)
    return _ingest(
        db, kind="cgm", model_cls=CgmReading, patient_id=patient.id, payload=payload,
        field_map={"value": "glucose_mgdl",
                   "specific": {"glucose_mgdl": "glucose_mgdl", "trend": "trend"}},
        actor_user_id=user.id, batch_id=batch_id, ip=ip, ua=ua,
    )


def ingest_insulin(db, user, payload: InsulinEventCreate, *, batch_id=None, ip=None, ua=None):
    patient = _require_owned_patient(db, user)
    return _ingest(
        db, kind="insulin", model_cls=InsulinEvent, patient_id=patient.id, payload=payload,
        field_map={"value": "units",
                   "specific": {"units": "units", "insulin_type": "insulin_type"}},
        actor_user_id=user.id, batch_id=batch_id, ip=ip, ua=ua,
    )


def ingest_meal(db, user, payload: MealEventCreate, *, batch_id=None, ip=None, ua=None):
    patient = _require_owned_patient(db, user)
    return _ingest(
        db, kind="meal", model_cls=MealEvent, patient_id=patient.id, payload=payload,
        field_map={"value": "carbs_g",
                   "specific": {"carbs_g": "carbs_g", "description": "description"}},
        actor_user_id=user.id, batch_id=batch_id, ip=ip, ua=ua,
    )


def ingest_activity(db, user, payload: ActivityEventCreate, *, batch_id=None, ip=None, ua=None):
    patient = _require_owned_patient(db, user)
    return _ingest(
        db, kind="activity", model_cls=ActivityEvent, patient_id=patient.id, payload=payload,
        field_map={"value": "duration_min",
                   "specific": {"duration_min": "duration_min",
                                "activity_type": "activity_type", "intensity": "intensity"}},
        actor_user_id=user.id, batch_id=batch_id, ip=ip, ua=ua,
    )


# --- Lecture ----------------------------------------------------------------
def list_events(
    db, user, kind: str, *, patient_id=None, start=None, end=None, limit=500, offset=0
):
    scope_pid = resolve_read_scope(db, user, patient_id)
    return timeseries_repo.query_window(
        db, kind, patient_id=scope_pid, start=start, end=end, limit=limit, offset=offset
    )


def consolidated_events(db, user, *, patient_id=None, start=None, end=None, limit=500):
    """Vue consolidée multi-types, normalisée et triée par ts."""
    scope_pid = resolve_read_scope(db, user, patient_id)
    raw = timeseries_repo.query_all_kinds_window(
        db, patient_id=scope_pid, start=start, end=end, limit=limit
    )
    norm = []
    for r in raw["cgm"]:
        norm.append(_norm("cgm", r, r.glucose_mgdl, r.trend))
    for r in raw["insulin"]:
        norm.append(_norm("insulin", r, r.units, r.insulin_type))
    for r in raw["meal"]:
        norm.append(_norm("meal", r, r.carbs_g, r.description))
    for r in raw["activity"]:
        norm.append(_norm("activity", r, r.duration_min, r.activity_type))
    norm.sort(key=lambda e: e["ts"])
    return norm[:limit]


def _norm(kind: str, row, value, label) -> dict:
    return {
        "kind": kind,
        "id": row.id,
        "patient_id": row.patient_id,
        "ts": row.ts,
        "value": value,
        "unit": row.unit,
        "label": label,
        "source": row.source,
        "quality_flag": row.quality_flag,
    }
