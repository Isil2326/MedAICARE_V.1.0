"""Tests modèles : metadata, création, relations, contraintes."""
from __future__ import annotations

from datetime import datetime, timezone

from app.core.security import hash_password
from app.models import (
    CgmReading,
    Patient,
    Prediction,
    Recommendation,
    Role,
    User,
)
from app.models.clinical import RecommendationStatus


def test_metadata_has_all_tables():
    from app.models import Base

    tables = set(Base.metadata.tables.keys())
    expected = {
        "roles", "users", "patients", "clinician_profiles", "consents",
        "refresh_tokens", "audit_logs", "cgm_readings", "insulin_events",
        "meal_events", "activity_events", "lab_reports", "predictions",
        "recommendations",
    }
    assert expected.issubset(tables)


def test_create_user_with_role(db_session):
    db, _ = db_session
    role = db.query(Role).filter(Role.name == "patient").first()
    user = User(email="a@b.fr", hashed_password=hash_password("x"), role=role)
    db.add(user)
    db.commit()
    assert user.id is not None
    assert user.role_name == "patient"


def test_patient_timeseries_marked_synthetic(db_session):
    db, _ = db_session
    role = db.query(Role).filter(Role.name == "patient").first()
    user = User(email="p@b.fr", hashed_password=hash_password("x"), role=role)
    db.add(user)
    db.flush()
    patient = Patient(user_id=user.id, first_name="A", last_name="B")
    db.add(patient)
    db.flush()
    reading = CgmReading(
        patient_id=patient.id, ts=datetime.now(timezone.utc), glucose_mgdl=110.0
    )
    db.add(reading)
    db.commit()
    assert reading.is_synthetic is True
    assert patient.is_synthetic is True


def test_recommendation_defaults_pending(db_session):
    db, _ = db_session
    role = db.query(Role).filter(Role.name == "patient").first()
    user = User(email="r@b.fr", hashed_password=hash_password("x"), role=role)
    db.add(user)
    db.flush()
    patient = Patient(user_id=user.id, first_name="A", last_name="B")
    db.add(patient)
    db.flush()
    rec = Recommendation(
        patient_id=patient.id, category="education", message="msg prudent"
    )
    db.add(rec)
    db.commit()
    assert rec.status == RecommendationStatus.pending.value
