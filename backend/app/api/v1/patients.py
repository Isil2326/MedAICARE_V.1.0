"""Endpoints patients (RBAC + accès audité aux données sensibles)."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import client_ip, client_ua, get_current_user, require_role
from app.core.database import get_db
from app.models import User
from app.repositories import user_repo
from app.schemas.patient import PatientPublic
from app.services import audit_service

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("", response_model=list[PatientPublic])
def list_patients(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("clinician", "admin")),
):
    patients = user_repo.list_patients(db)
    audit_service.record(
        db,
        action="patient.list",
        actor_user_id=user.id,
        resource_type="patient",
        ip_address=client_ip(request),
        user_agent=client_ua(request),
    )
    db.commit()
    return patients


@router.get("/me", response_model=PatientPublic)
def my_record(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("patient")),
):
    patient = user_repo.get_patient_by_user(db, user.id)
    if patient is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Aucun dossier patient.")
    audit_service.record(
        db,
        action="patient.read_self",
        actor_user_id=user.id,
        resource_type="patient",
        resource_id=str(patient.id),
        ip_address=client_ip(request),
        user_agent=client_ua(request),
    )
    db.commit()
    return patient


@router.get("/{patient_id}", response_model=PatientPublic)
def get_patient(
    patient_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    patient = user_repo.get_patient(db, patient_id)
    if patient is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Patient introuvable.")

    # Patient : accès à son seul dossier. Clinicien/admin : tous.
    if user.role_name == "patient" and patient.user_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Accès refusé.")

    audit_service.record(
        db,
        action="patient.read",
        actor_user_id=user.id,
        resource_type="patient",
        resource_id=str(patient.id),
        ip_address=client_ip(request),
        user_agent=client_ua(request),
    )
    db.commit()
    return patient
