"""Seed temporel synthétique v2 (Phase 2.1) — idempotent, is_synthetic=True.

Benchmark synthétique SCÉNARISÉ destiné UNIQUEMENT à rendre les 4 couples
(hypo/hyper × 30/60 min) évaluables sur le jeu de test (positifs ET négatifs
présents dans train/validation/test). CE N'EST PAS une représentation de
patients réels : toutes les lignes portent `is_synthetic=True`.

Cohorte : 10 profils synthétiques sur 14 jours, CGM toutes les 5 minutes, avec
repas / insuline / activité. Les épisodes hypo (<70) et hyper (>180) sont
répartis QUOTIDIENNEMENT pour qu'ils tombent naturellement dans chaque période
temporelle (train = passé, validation = intermédiaire, test = futur) — sans
aucune fuite de label : la nature « scénario » d'un patient n'est JAMAIS exposée
comme feature (cf. anti-fuite, FEATURE_COLUMNS purement physiologiques/temporelles).

Le seed est rejouable : il ne réinsère pas si des CGM existent déjà pour le patient.
"""
from __future__ import annotations

import hashlib
import math
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

# Profils : (email, prénom, nom, type diabète, clé de scénario).
# La clé de scénario pilote la GÉNÉRATION uniquement (jamais une feature).
PROFILES = [
    ("patient.stable@demo.fr", "Sam", "Stable", "T1", "stable"),
    ("patient.hypo@demo.fr", "Hugo", "Hypo", "T1", "hypo_prone"),
    ("patient.hyper@demo.fr", "Hana", "Hyper", "T2", "hyper_prone"),
    ("patient.pphyper@demo.fr", "Paul", "Postprandial", "T2", "post_prandial_hyper"),
    ("patient.nighthypo@demo.fr", "Nadia", "Nocturne", "T1", "nocturnal_hypo"),
    ("patient.variable@demo.fr", "Vera", "Variable", "T1", "high_variability"),
    ("patient.sparse@demo.fr", "Sofia", "Sparse", "T2", "sparse_cgm"),
    ("patient.sensitive@demo.fr", "Ines", "Sensible", "T1", "insulin_sensitive"),
    ("patient.stable2@demo.fr", "Marc", "Equilibre", "T2", "stable"),
    ("patient.mixed@demo.fr", "Leo", "Mixte", "T1", "mixed"),
]

DAYS = 14
STEP_MIN = 5  # cadence CGM réaliste (Dexcom/Libre ~5 min)
GLUCOSE_MIN, GLUCOSE_MAX = 40.0, 360.0


def _seed_for(profile: str) -> int:
    """Graine déterministe par profil (reproductibilité du benchmark).

    Utilise un hash SHA-256 stable (indépendant de PYTHONHASHSEED) pour garantir
    la reproductibilité du benchmark entre processus/interpréteurs.
    """
    digest = hashlib.sha256(profile.encode("utf-8")).hexdigest()
    return (int(digest, 16) % 100000) + 7


def _baseline(profile: str, hour: int) -> tuple[float, float]:
    """(moyenne, amplitude) de base selon le profil et l'heure (post-prandial)."""
    post_meal = hour in (8, 9, 13, 14, 20, 21)
    if profile in ("stable",):
        return (125.0 + (20.0 if post_meal else 0.0), 12.0)
    if profile == "hypo_prone":
        return (105.0 + (20.0 if post_meal else 0.0), 16.0)
    if profile in ("hyper_prone", "post_prandial_hyper"):
        return (165.0 + (40.0 if post_meal else 0.0), 20.0)
    if profile == "nocturnal_hypo":
        return (120.0 + (15.0 if post_meal else 0.0), 14.0)
    if profile == "high_variability":
        return (140.0 + (25.0 if post_meal else 0.0), 30.0)
    if profile == "sparse_cgm":
        return (135.0 + (25.0 if post_meal else 0.0), 18.0)
    if profile == "insulin_sensitive":
        return (130.0 + (10.0 if post_meal else 0.0), 16.0)
    if profile == "mixed":
        return (150.0 + (35.0 if post_meal else 0.0), 24.0)
    return (125.0, 14.0)


def _episode_offset(profile: str, ts: datetime, rng: random.Random) -> float:
    """Décalage glycémique additionnel d'un épisode programmé (mg/dL).

    Les épisodes sont QUOTIDIENS pour la plupart des profils → ils tombent dans
    train, validation ET test. Renvoie un delta (négatif = hypo, positif = hyper).
    """
    h, m = ts.hour, ts.minute
    delta = 0.0
    # --- Hypoglycémies programmées -----------------------------------------
    if profile == "nocturnal_hypo" and 2 <= h < 4:
        delta -= 75.0  # creux nocturne profond chaque nuit
    if profile == "hypo_prone" and (h == 3 or (h == 10 and m < 30)):
        delta -= 65.0  # hypo nocturne + dip matinal post-insuline
    if profile == "insulin_sensitive" and h in (9, 14, 21) and m < 40:
        delta -= 70.0  # chute marquée ~1 h après bolus
    if profile == "high_variability" and h == 4:
        delta -= 70.0
    if profile == "mixed" and h == 5 and ts.day % 2 == 0:
        delta -= 65.0  # hypo un jour sur deux
    # --- Hyperglycémies programmées ----------------------------------------
    if profile == "hyper_prone" and h in (9, 14, 21):
        delta += 70.0  # excursions post-prandiales chaque jour
    if profile == "post_prandial_hyper" and h in (13, 14):
        delta += 90.0  # forte hyper post-déjeuner
    if profile == "high_variability" and h == 14:
        delta += 80.0
    if profile == "mixed" and h in (14, 21):
        delta += 75.0
    if profile == "sparse_cgm" and h in (9, 20) and m < 20:
        delta += 60.0
    return delta


def _trend(delta: float) -> str:
    if delta > 4:
        return "rising"
    if delta < -4:
        return "falling"
    return "stable"


def _is_dropped(profile: str, i: int, rng: random.Random) -> bool:
    """Trous CGM : seul le profil `sparse_cgm` a des lacunes (~35 % de points)."""
    if profile != "sparse_cgm":
        return False
    return rng.random() < 0.35


def _seed_one(db, patient: Patient, profile: str) -> None:
    if db.query(CgmReading).filter(CgmReading.patient_id == patient.id).count() > 0:
        return  # idempotent

    rng = random.Random(_seed_for(profile))
    now = datetime.now(timezone.utc).replace(second=0, microsecond=0)
    # Aligne la fin sur un multiple de STEP_MIN pour des timestamps réguliers.
    now = now.replace(minute=(now.minute // STEP_MIN) * STEP_MIN)
    start = now - timedelta(days=DAYS)
    n_steps = DAYS * 24 * 60 // STEP_MIN

    prev = None
    for i in range(n_steps):
        ts = start + timedelta(minutes=STEP_MIN * i)
        if _is_dropped(profile, i, rng):
            continue  # lacune CGM (profil sparse)
        mean, amp = _baseline(profile, ts.hour)
        # Composante lente (cyclique) + bruit + épisode programmé.
        slow = amp * math.sin(2 * math.pi * i / (12 * 6))  # ~ cycle 6 h
        noise = amp * 0.4 * rng.uniform(-1, 1)
        glucose = mean + slow + noise + _episode_offset(profile, ts, rng)
        glucose = max(GLUCOSE_MIN, min(GLUCOSE_MAX, glucose))
        delta = 0.0 if prev is None else glucose - prev
        prev = glucose
        db.add(CgmReading(
            patient_id=patient.id, ts=ts, glucose_mgdl=round(glucose, 1),
            trend=_trend(delta), device_id="sim-cgm", source="sim",
            unit="mg/dL", quality_flag="valid", is_synthetic=True,
        ))

    # Repas / insuline / activité quotidiens (contexte des features).
    for d in range(DAYS):
        day0 = start + timedelta(days=d)
        for hh, carbs in ((8, 45), (13, 70), (20, 60)):
            mt = day0.replace(hour=hh, minute=0)
            db.add(MealEvent(
                patient_id=patient.id, ts=mt, carbs_g=float(carbs),
                description="repas simulé", source="sim", unit="g",
                quality_flag="valid", is_synthetic=True,
            ))
            # Patient insulino-sensible : bolus plus élevé (chutes marquées).
            ratio = 7.0 if profile == "insulin_sensitive" else 10.0
            db.add(InsulinEvent(
                patient_id=patient.id, ts=mt + timedelta(minutes=5),
                units=round(carbs / ratio, 1), insulin_type="bolus",
                source="sim", unit="U", quality_flag="valid", is_synthetic=True,
            ))
        at = day0.replace(hour=18, minute=0)
        db.add(ActivityEvent(
            patient_id=patient.id, ts=at, activity_type="marche",
            duration_min=40.0, intensity="moderate", source="sim",
            unit="min", quality_flag="valid", is_synthetic=True,
        ))


def seed_synthetic_timeseries(db, *, demo_password: str, hash_password) -> int:
    """Crée/complète les profils synthétiques v2. Retourne le nb de patients seedés."""
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
