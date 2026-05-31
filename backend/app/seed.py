"""Seed idempotent : rôles, comptes démo, données simulées (is_synthetic=True).

À lancer après `alembic upgrade head` :
    python -m app.seed

Aucune donnée réelle. Toutes les séries sont synthétiques.
"""
from __future__ import annotations

import random
from datetime import datetime, timedelta, timezone

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models import (
    CgmReading,
    ClinicianProfile,
    Patient,
    Prediction,
    Recommendation,
    Role,
    User,
)
from app.models.clinical import RecommendationStatus
from app.repositories import user_repo
from app.services import audit_service

ROLES = [
    ("patient", "Patient diabétique (accès à son seul dossier)"),
    ("clinician", "Clinicien (triage, validation open-loop, audit)"),
    ("admin", "Administrateur technique"),
]

DEMO_PASSWORD = "DemoMediAI2026!"


def seed_roles(db) -> dict[str, Role]:
    out = {}
    for name, desc in ROLES:
        role = user_repo.get_role_by_name(db, name)
        if role is None:
            role = Role(name=name, description=desc)
            db.add(role)
            db.flush()
        out[name] = role
    return out


def seed_users(db, roles) -> dict[str, User]:
    created = {}

    # Clinicien démo
    clin = user_repo.get_user_by_email(db, "clinicien@demo.fr")
    if clin is None:
        clin = user_repo.create_user(
            db, email="clinicien@demo.fr",
            hashed_password=hash_password(DEMO_PASSWORD), role=roles["clinician"],
        )
        db.add(ClinicianProfile(
            user_id=clin.id, first_name="Camille", last_name="Durand",
            specialty="Endocrinologie", license_number="DEMO-CLN-001",
        ))
        db.flush()
    created["clinician"] = clin

    # Patient démo
    pat_user = user_repo.get_user_by_email(db, "patient@demo.fr")
    if pat_user is None:
        pat_user = user_repo.create_user(
            db, email="patient@demo.fr",
            hashed_password=hash_password(DEMO_PASSWORD), role=roles["patient"],
        )
        patient = Patient(
            user_id=pat_user.id, first_name="Alex", last_name="Martin",
            diabetes_type="T1", is_synthetic=True,
        )
        db.add(patient)
        db.flush()
    created["patient"] = pat_user
    return created


def seed_timeseries_and_reco(db, patient_user: User) -> None:
    patient = user_repo.get_patient_by_user(db, patient_user.id)
    if patient is None:
        return
    # Évite les doublons si déjà seedé
    existing = db.query(CgmReading).filter(CgmReading.patient_id == patient.id).count()
    if existing > 0:
        return

    rng = random.Random(42)
    now = datetime.now(timezone.utc)
    # 24h de CGM simulé toutes les 15 min
    for i in range(96):
        ts = now - timedelta(minutes=15 * (96 - i))
        glucose = 120 + 40 * rng.uniform(-1, 1)
        db.add(CgmReading(
            patient_id=patient.id, ts=ts, glucose_mgdl=round(glucose, 1),
            trend=rng.choice(["flat", "up", "down"]), device_id="sim-cgm-001",
            is_synthetic=True,
        ))

    # Une prédiction placeholder + une recommandation open-loop pending
    pred = Prediction(
        patient_id=patient.id, ts=now, horizon_min=30,
        predicted_event="hypo", probability=0.62,
        model_name="placeholder", model_version="0.0.0", is_synthetic=True,
    )
    db.add(pred)
    db.flush()
    db.add(Recommendation(
        patient_id=patient.id, prediction_id=pred.id,
        status=RecommendationStatus.pending.value,
        category="monitoring",
        message=(
            "Votre situation peut nécessiter une attention particulière dans la "
            "prochaine heure. Cette suggestion est informative et doit être "
            "confirmée par un professionnel. Ne modifiez jamais votre traitement "
            "sans avis médical."
        ),
        rationale={"note": "placeholder XAI — modèle réel en phase ultérieure"},
        priority=2,
    ))


def main() -> None:
    db = SessionLocal()
    try:
        roles = seed_roles(db)
        users = seed_users(db, roles)
        seed_timeseries_and_reco(db, users["patient"])
        # Phase 1 — profils temporels synthétiques (stable / hypo / hyper)
        from app.seed_timeseries import seed_synthetic_timeseries

        n_profiles = seed_synthetic_timeseries(
            db, demo_password=DEMO_PASSWORD, hash_password=hash_password
        )
        audit_service.record(
            db, action="system.seed",
            event_metadata={
                "synthetic": True, "demo_accounts": 2,
                "timeseries_profiles": n_profiles,
            },
        )
        db.commit()
        print("Seed terminé.")
        print(f"  Patient   : patient@demo.fr / {DEMO_PASSWORD}")
        print(f"  Clinicien : clinicien@demo.fr / {DEMO_PASSWORD}")
        print(f"  Profils temporels synthétiques : {n_profiles} "
              "(patient.stable@ / patient.hypo@ / patient.hyper@demo.fr)")
    finally:
        db.close()


if __name__ == "__main__":
    main()
