"""Accès données utilisateurs/rôles/profils."""
from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import ClinicianProfile, Patient, Role, User


def get_role_by_name(db: Session, name: str) -> Role | None:
    return db.scalar(select(Role).where(Role.name == name))


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email.lower()))


def get_user_by_id(db: Session, user_id: uuid.UUID) -> User | None:
    return db.get(User, user_id)


def create_user(db: Session, *, email: str, hashed_password: str, role: Role) -> User:
    user = User(email=email.lower(), hashed_password=hashed_password, role=role)
    db.add(user)
    db.flush()
    return user


def create_patient(db: Session, *, user: User, **kwargs) -> Patient:
    patient = Patient(user_id=user.id, **kwargs)
    db.add(patient)
    db.flush()
    return patient


def create_clinician_profile(db: Session, *, user: User, **kwargs) -> ClinicianProfile:
    profile = ClinicianProfile(user_id=user.id, **kwargs)
    db.add(profile)
    db.flush()
    return profile


def get_patient_by_user(db: Session, user_id: uuid.UUID) -> Patient | None:
    return db.scalar(select(Patient).where(Patient.user_id == user_id))


def list_patients(db: Session) -> list[Patient]:
    return list(db.scalars(select(Patient).order_by(Patient.last_name)))


def get_patient(db: Session, patient_id: uuid.UUID) -> Patient | None:
    return db.get(Patient, patient_id)
