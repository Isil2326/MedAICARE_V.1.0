"""Endpoints d'authentification."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import client_ip, client_ua, get_current_user
from app.core.database import get_db
from app.models import User
from app.schemas.auth import (
    ClinicianRegister,
    LoginRequest,
    LogoutRequest,
    PatientRegister,
    RefreshRequest,
    TokenPair,
    UserPublic,
)
from app.services import auth_service
from app.services.auth_service import AuthError

router = APIRouter(prefix="/auth", tags=["auth"])


def _to_public(user: User) -> UserPublic:
    return UserPublic(
        id=user.id, email=user.email, role=user.role_name, is_active=user.is_active
    )


@router.post("/register/patient", response_model=UserPublic, status_code=201)
def register_patient(data: PatientRegister, request: Request, db: Session = Depends(get_db)):
    try:
        user = auth_service.register_patient(
            db, data, ip=client_ip(request), ua=client_ua(request)
        )
    except AuthError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, e.message)
    return _to_public(user)


@router.post("/register/clinician", response_model=UserPublic, status_code=201)
def register_clinician(data: ClinicianRegister, request: Request, db: Session = Depends(get_db)):
    try:
        user = auth_service.register_clinician(
            db, data, ip=client_ip(request), ua=client_ua(request)
        )
    except AuthError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, e.message)
    return _to_public(user)


@router.post("/login", response_model=TokenPair)
def login(data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    try:
        return auth_service.login(
            db, data.email, data.password, ip=client_ip(request), ua=client_ua(request)
        )
    except AuthError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, e.message)


@router.post("/refresh", response_model=TokenPair)
def refresh(data: RefreshRequest, request: Request, db: Session = Depends(get_db)):
    try:
        return auth_service.refresh(
            db, data.refresh_token, ip=client_ip(request), ua=client_ua(request)
        )
    except AuthError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, e.message)


@router.post("/logout", status_code=204)
def logout(
    data: LogoutRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    auth_service.logout(
        db, data.refresh_token, actor_id=user.id,
        ip=client_ip(request), ua=client_ua(request),
    )
    return None


@router.get("/me", response_model=UserPublic)
def me(user: User = Depends(get_current_user)):
    return _to_public(user)
