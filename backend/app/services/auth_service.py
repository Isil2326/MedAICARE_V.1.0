"""Service d'authentification : inscription, login, refresh rotation, logout.

Toute la logique critique est serveur. Le client ne stocke que les tokens
(jamais de hash/salt, jamais de données santé).
"""
from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.core import security
from app.core.config import settings
from app.models import User
from app.repositories import token_repo, user_repo
from app.services import audit_service

PATIENT_ROLE = "patient"
CLINICIAN_ROLE = "clinician"


class AuthError(Exception):
    """Erreur métier d'authentification (mappée en 4xx par l'API)."""

    def __init__(self, message: str, code: str = "auth_error"):
        super().__init__(message)
        self.message = message
        self.code = code


def _issue_token_pair(
    db: Session,
    user: User,
    *,
    rotated_from: str | None = None,
    user_agent: str | None = None,
    ip_address: str | None = None,
) -> dict:
    access = security.create_access_token(subject=str(user.id), role=user.role_name)
    raw_refresh = security.generate_refresh_token()
    token_repo.store_refresh_token(
        db,
        user_id=user.id,
        token_hash=security.hash_refresh_token(raw_refresh),
        expires_at=security.refresh_token_expiry(),
        rotated_from=rotated_from,
        user_agent=user_agent,
        ip_address=ip_address,
    )
    return {
        "access_token": access,
        "refresh_token": raw_refresh,
        "token_type": "bearer",
        "expires_in": settings.access_token_expire_minutes * 60,
    }


def register_patient(db: Session, data, *, ip=None, ua=None) -> User:
    if user_repo.get_user_by_email(db, data.email):
        raise AuthError("Cet e-mail est déjà utilisé.", "email_taken")
    role = user_repo.get_role_by_name(db, PATIENT_ROLE)
    if role is None:
        raise AuthError("Rôle patient absent (seed manquant).", "role_missing")
    user = user_repo.create_user(
        db,
        email=data.email,
        hashed_password=security.hash_password(data.password),
        role=role,
    )
    user_repo.create_patient(
        db,
        user=user,
        first_name=data.first_name,
        last_name=data.last_name,
        birth_date=data.birth_date,
        diabetes_type=data.diabetes_type,
    )
    audit_service.record(
        db,
        action="user.register",
        actor_user_id=user.id,
        resource_type="user",
        resource_id=str(user.id),
        event_metadata={"role": PATIENT_ROLE},
        ip_address=ip,
        user_agent=ua,
    )
    db.commit()
    db.refresh(user)
    return user


def register_clinician(db: Session, data, *, ip=None, ua=None) -> User:
    if user_repo.get_user_by_email(db, data.email):
        raise AuthError("Cet e-mail est déjà utilisé.", "email_taken")
    role = user_repo.get_role_by_name(db, CLINICIAN_ROLE)
    if role is None:
        raise AuthError("Rôle clinicien absent (seed manquant).", "role_missing")
    user = user_repo.create_user(
        db,
        email=data.email,
        hashed_password=security.hash_password(data.password),
        role=role,
    )
    user_repo.create_clinician_profile(
        db,
        user=user,
        first_name=data.first_name,
        last_name=data.last_name,
        specialty=data.specialty,
        license_number=data.license_number,
    )
    audit_service.record(
        db,
        action="user.register",
        actor_user_id=user.id,
        resource_type="user",
        resource_id=str(user.id),
        event_metadata={"role": CLINICIAN_ROLE},
        ip_address=ip,
        user_agent=ua,
    )
    db.commit()
    db.refresh(user)
    return user


def login(db: Session, email: str, password: str, *, ip=None, ua=None) -> dict:
    user = user_repo.get_user_by_email(db, email)
    # Vérifie toujours un hash pour limiter l'oracle de timing.
    if user is None:
        security.verify_password(password, security.hash_password("dummy-decoy"))
        raise AuthError("Identifiants invalides.", "invalid_credentials")
    if not user.is_active:
        raise AuthError("Compte désactivé.", "inactive")
    if not security.verify_password(password, user.hashed_password):
        audit_service.record(
            db,
            action="auth.login_failed",
            actor_user_id=user.id,
            resource_type="user",
            resource_id=str(user.id),
            ip_address=ip,
            user_agent=ua,
        )
        db.commit()
        raise AuthError("Identifiants invalides.", "invalid_credentials")

    tokens = _issue_token_pair(db, user, user_agent=ua, ip_address=ip)
    audit_service.record(
        db,
        action="auth.login",
        actor_user_id=user.id,
        resource_type="user",
        resource_id=str(user.id),
        ip_address=ip,
        user_agent=ua,
    )
    db.commit()
    return tokens


def refresh(db: Session, raw_refresh: str, *, ip=None, ua=None) -> dict:
    token_hash = security.hash_refresh_token(raw_refresh)
    rt = token_repo.get_by_hash(db, token_hash)
    if rt is None:
        raise AuthError("Refresh token inconnu.", "invalid_refresh")

    # Détection de réutilisation : un token déjà révoqué qui resert = compromission.
    if rt.revoked:
        revoked_count = token_repo.revoke_all_for_user(db, rt.user_id)
        audit_service.record(
            db,
            action="auth.refresh_reuse_detected",
            actor_user_id=rt.user_id,
            resource_type="refresh_token",
            resource_id=str(rt.id),
            event_metadata={"sessions_revoked": revoked_count},
            ip_address=ip,
            user_agent=ua,
        )
        db.commit()
        raise AuthError("Refresh token réutilisé — sessions révoquées.", "refresh_reuse")

    if not token_repo.is_usable(rt):
        raise AuthError("Refresh token expiré.", "expired_refresh")

    user = user_repo.get_user_by_id(db, rt.user_id)
    if user is None or not user.is_active:
        raise AuthError("Utilisateur introuvable ou inactif.", "invalid_user")

    # Rotation atomique à usage unique : si ce call ne gagne pas la révocation,
    # un refresh concurrent a déjà tourné ce token → on traite comme une
    # réutilisation (compromission potentielle) et on révoque toute la famille.
    if not token_repo.revoke_if_active(db, rt.id):
        revoked_count = token_repo.revoke_all_for_user(db, rt.user_id)
        audit_service.record(
            db,
            action="auth.refresh_reuse_detected",
            actor_user_id=rt.user_id,
            resource_type="refresh_token",
            resource_id=str(rt.id),
            event_metadata={"sessions_revoked": revoked_count, "reason": "concurrent_rotation"},
            ip_address=ip,
            user_agent=ua,
        )
        db.commit()
        raise AuthError("Refresh token réutilisé — sessions révoquées.", "refresh_reuse")

    tokens = _issue_token_pair(
        db, user, rotated_from=token_hash, user_agent=ua, ip_address=ip
    )
    audit_service.record(
        db,
        action="auth.refresh",
        actor_user_id=user.id,
        resource_type="user",
        resource_id=str(user.id),
        ip_address=ip,
        user_agent=ua,
    )
    db.commit()
    return tokens


def logout(db: Session, raw_refresh: str, *, actor_id: uuid.UUID | None = None, ip=None, ua=None) -> None:
    rt = token_repo.get_by_hash(db, security.hash_refresh_token(raw_refresh))
    # Contrôle de propriété : un utilisateur ne peut révoquer que SES tokens.
    # Empêche la révocation croisée de sessions d'autrui via un token volé/deviné.
    owns_token = rt is not None and (actor_id is None or rt.user_id == actor_id)
    if owns_token and not rt.revoked:
        token_repo.revoke(db, rt)
    audit_service.record(
        db,
        action="auth.logout",
        actor_user_id=actor_id or (rt.user_id if owns_token else None),
        resource_type="refresh_token",
        resource_id=str(rt.id) if owns_token else None,
        ip_address=ip,
        user_agent=ua,
    )
    db.commit()
