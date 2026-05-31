"""Seed temporel synthétique (Phase 1) — idempotent, is_synthetic=True.

Génère 3 profils patients simulés sur plusieurs jours :
- "stable"      : glycémie majoritairement dans la cible ;
- "hypo-prone"  : épisodes hypoglycémiques nocturnes/post-insuline ;
- "hyper-prone" : excursions hyperglycémiques post-prandiales.

Chaque profil possède un compte de connexion démo (mot de passe commun) et des
séries CGM (toutes les 15 min), repas, insuline et activité, avec quelques
épisodes hypo/hyper. AUCUNE donnée réelle. Le seed est rejouable : il ne
réinsère pas si des CGM existent déjà pour le patient.
"""
from __future__ import annotations

import random
from datetime import datetime, timedelta, timezone

from app.models import (
    ActivityEvent,
    CgmReading,
    InsulinEvent,
    MealEvent,
    Patient,
    User,
)
from app.repositories import user_repo

# Profils : (email, prénom, nom, type diabète, clé de comportement).
PROFILES = [
    ("patient.stable@demo.fr", "Sam", "Stable", "T1", "stable"),
    ("patient.hypo@demo.fr", "Hugo", "Hypo", "T1", "hypo"),
    ("patient.hyper@demo.fr", "Hana", "Hyper", "T2", "hyper"),
]

DAYS = 3
STEP_MIN = 15  # cadence CGM


def _baseline(profile: str, hour: int) -> tuple[float, float]:
    """(moyenne, amplitude) de base selon le profil et l'heure (post-prandial)."""
    post_meal = hour in (8, 9, 13, 14, 20, 21)
    if profile == "stable":
        return (130.0 + (25.0 if post_meal else 0.0), 15.0)
    if profile == "hypo":
        # tendance basse, creux nocturnes
        night = hour in range(0, 6)
        return (95.0 - (20.0 if night else 0.0) + (20.0 if post_meal else 0.0), 18.0)
    # hyper
    return (175.0 + (45.0 if post_meal else 0.0), 22.0)


def _trend(delta: float) -> str:
    if delta > 4:
        return "rising"
    if delta < -4:
        return "falling"
    return "stable"


def _seed_one(db, patient: Patient, profile: str) -> None:
    if db.query(CgmReading).filter(CgmReading.patient_id == patient.id).count() > 0:
        return  # idempotent

    rng = random.Random(hash(profile) & 0xFFFF)
    now = datetime.now(timezone.utc).replace(second=0, microsecond=0)
    start = now - timedelta(days=DAYS)
    n_steps = DAYS * 24 * 60 // STEP_MIN

    prev = None
    for i in range(n_steps):
        ts = start + timedelta(minutes=STEP_MIN * i)
        mean, amp = _baseline(profile, ts.hour)
        glucose = mean + amp * rng.uniform(-1, 1)
        # Épisodes marqués selon profil
        if profile == "hypo" and ts.hour == 3 and i % (96) < 4:
            glucose = 58.0 + rng.uniform(-3, 3)  # hypo nocturne
        if profile == "hyper" and ts.hour in (14, 21) and i % 96 < 3:
            glucose = 255.0 + rng.uniform(-10, 20)  # hyper post-prandiale
        glucose = max(40.0, min(360.0, glucose))
        delta = 0.0 if prev is None else glucose - prev
        prev = glucose
        db.add(CgmReading(
            patient_id=patient.id, ts=ts, glucose_mgdl=round(glucose, 1),
            trend=_trend(delta), device_id="sim-cgm", source="sim",
            unit="mg/dL", quality_flag="valid", is_synthetic=True,
        ))

    # Repas / insuline / activité quotidiens
    for d in range(DAYS):
        day0 = start + timedelta(days=d)
        for hh, carbs in ((8, 45), (13, 70), (20, 60)):
            mt = day0.replace(hour=hh, minute=0)
            db.add(MealEvent(
                patient_id=patient.id, ts=mt, carbs_g=float(carbs),
                description="repas simulé", source="sim", unit="g",
                quality_flag="valid", is_synthetic=True,
            ))
            db.add(InsulinEvent(
                patient_id=patient.id, ts=mt + timedelta(minutes=5),
                units=round(carbs / 10.0, 1), insulin_type="bolus",
                source="sim", unit="U", quality_flag="valid", is_synthetic=True,
            ))
        # activité en fin d'après-midi
        at = day0.replace(hour=18, minute=0)
        db.add(ActivityEvent(
            patient_id=patient.id, ts=at, activity_type="marche",
            duration_min=40.0, intensity="moderate", source="sim",
            unit="min", quality_flag="valid", is_synthetic=True,
        ))


def seed_synthetic_timeseries(db, *, demo_password: str, hash_password) -> int:
    """Crée/complète les 3 profils synthétiques. Retourne le nb de patients seedés."""
    from app.models import Role

    role = user_repo.get_role_by_name(db, "patient")
    if role is None:
        role = Role(name="patient", description="Patient diabétique")
        db.add(role)
        db.flush()

    seeded = 0
    for email, first, last, dtype, profile in PROFILES:
        user = user_repo.get_user_by_email(db, email)
        if user is None:
            user = user_repo.create_user(
                db, email=email, hashed_password=hash_password(demo_password), role=role
            )
            db.flush()
        patient = user_repo.get_patient_by_user(db, user.id)
        if patient is None:
            patient = Patient(
                user_id=user.id, first_name=first, last_name=last,
                diabetes_type=dtype, is_synthetic=True,
            )
            db.add(patient)
            db.flush()
        _seed_one(db, patient, profile)
        seeded += 1
    return seeded
