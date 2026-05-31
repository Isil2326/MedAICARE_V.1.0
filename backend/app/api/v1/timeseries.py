"""Endpoints d'ingestion et de lecture des séries temporelles (Phase 1).

RBAC + ownership :
- POST (écriture) : compte **patient** uniquement, sur son propre dossier ;
- GET (lecture)   : patient = son dossier ; clinicien/admin = patient_id ciblé ;
- non authentifié : 401 (via get_current_user).

Idempotence : 201 si créé, 200 si doublon (enregistrement existant renvoyé).
Toutes les écritures sont auditées et forcées `is_synthetic=True`.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy.orm import Session

from app.api.deps import client_ip, client_ua, get_current_user
from app.core.database import get_db
from app.models import User
from app.schemas.timeseries import (
    ActivityEventCreate,
    ActivityEventPublic,
    CgmReadingCreate,
    CgmReadingPublic,
    IngestionResult,
    InsulinEventCreate,
    InsulinEventPublic,
    MealEventCreate,
    MealEventPublic,
    TimeseriesEventPublic,
    normalize_utc,
)
from app.services import timeseries_service
from app.services.timeseries_service import TimeseriesError

router = APIRouter(prefix="/timeseries", tags=["timeseries"])


def _err(e: TimeseriesError) -> HTTPException:
    code = {
        "forbidden": status.HTTP_403_FORBIDDEN,
        "not_found": status.HTTP_404_NOT_FOUND,
        "bad_request": status.HTTP_400_BAD_REQUEST,
    }.get(e.code, status.HTTP_409_CONFLICT)
    return HTTPException(code, e.message)


def _ingest_status(response: Response, result: IngestionResult) -> IngestionResult:
    response.status_code = (
        status.HTTP_201_CREATED if result.created else status.HTTP_200_OK
    )
    return result


def _parse_window(
    start: str | None, end: str | None
) -> tuple[datetime | None, datetime | None]:
    """Valide la fenêtre temporelle (tz-aware, UTC, start<=end)."""
    try:
        s = normalize_utc(datetime.fromisoformat(start), field="start") if start else None
        e = normalize_utc(datetime.fromisoformat(end), field="end") if end else None
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Fenêtre invalide : {exc}") from exc
    if s and e and s > e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Fenêtre invalide : start <= end requis.")
    return s, e


# === CGM ====================================================================
@router.post("/cgm", response_model=IngestionResult, status_code=status.HTTP_201_CREATED)
def post_cgm(
    payload: CgmReadingCreate,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        result = timeseries_service.ingest_cgm(
            db, user, payload, ip=client_ip(request), ua=client_ua(request)
        )
    except TimeseriesError as e:
        raise _err(e)
    return _ingest_status(response, result)


@router.get("/cgm", response_model=list[CgmReadingPublic])
def get_cgm(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    patient_id: uuid.UUID | None = Query(default=None),
    start: str | None = Query(default=None),
    end: str | None = Query(default=None),
    limit: int = Query(default=500, ge=1, le=5000),
    offset: int = Query(default=0, ge=0),
):
    s, e = _parse_window(start, end)
    try:
        return timeseries_service.list_events(
            db, user, "cgm", patient_id=patient_id, start=s, end=e, limit=limit, offset=offset
        )
    except TimeseriesError as exc:
        raise _err(exc)


# === Insuline ===============================================================
@router.post("/insulin", response_model=IngestionResult, status_code=status.HTTP_201_CREATED)
def post_insulin(
    payload: InsulinEventCreate,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        result = timeseries_service.ingest_insulin(
            db, user, payload, ip=client_ip(request), ua=client_ua(request)
        )
    except TimeseriesError as e:
        raise _err(e)
    return _ingest_status(response, result)


@router.get("/insulin", response_model=list[InsulinEventPublic])
def get_insulin(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    patient_id: uuid.UUID | None = Query(default=None),
    start: str | None = Query(default=None),
    end: str | None = Query(default=None),
    limit: int = Query(default=500, ge=1, le=5000),
    offset: int = Query(default=0, ge=0),
):
    s, e = _parse_window(start, end)
    try:
        return timeseries_service.list_events(
            db, user, "insulin", patient_id=patient_id, start=s, end=e, limit=limit, offset=offset
        )
    except TimeseriesError as exc:
        raise _err(exc)


# === Repas ==================================================================
@router.post("/meals", response_model=IngestionResult, status_code=status.HTTP_201_CREATED)
def post_meal(
    payload: MealEventCreate,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        result = timeseries_service.ingest_meal(
            db, user, payload, ip=client_ip(request), ua=client_ua(request)
        )
    except TimeseriesError as e:
        raise _err(e)
    return _ingest_status(response, result)


@router.get("/meals", response_model=list[MealEventPublic])
def get_meals(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    patient_id: uuid.UUID | None = Query(default=None),
    start: str | None = Query(default=None),
    end: str | None = Query(default=None),
    limit: int = Query(default=500, ge=1, le=5000),
    offset: int = Query(default=0, ge=0),
):
    s, e = _parse_window(start, end)
    try:
        return timeseries_service.list_events(
            db, user, "meal", patient_id=patient_id, start=s, end=e, limit=limit, offset=offset
        )
    except TimeseriesError as exc:
        raise _err(exc)


# === Activité ===============================================================
@router.post("/activity", response_model=IngestionResult, status_code=status.HTTP_201_CREATED)
def post_activity(
    payload: ActivityEventCreate,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        result = timeseries_service.ingest_activity(
            db, user, payload, ip=client_ip(request), ua=client_ua(request)
        )
    except TimeseriesError as e:
        raise _err(e)
    return _ingest_status(response, result)


@router.get("/activity", response_model=list[ActivityEventPublic])
def get_activity(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    patient_id: uuid.UUID | None = Query(default=None),
    start: str | None = Query(default=None),
    end: str | None = Query(default=None),
    limit: int = Query(default=500, ge=1, le=5000),
    offset: int = Query(default=0, ge=0),
):
    s, e = _parse_window(start, end)
    try:
        return timeseries_service.list_events(
            db, user, "activity", patient_id=patient_id, start=s, end=e, limit=limit, offset=offset
        )
    except TimeseriesError as exc:
        raise _err(exc)


# === Vue consolidée =========================================================
@router.get("/events", response_model=list[TimeseriesEventPublic])
def get_events(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    patient_id: uuid.UUID | None = Query(default=None),
    start: str | None = Query(default=None),
    end: str | None = Query(default=None),
    limit: int = Query(default=500, ge=1, le=5000),
):
    s, e = _parse_window(start, end)
    try:
        return timeseries_service.consolidated_events(
            db, user, patient_id=patient_id, start=s, end=e, limit=limit
        )
    except TimeseriesError as exc:
        raise _err(exc)
