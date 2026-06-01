"""Tests E2E Phase 5 — parcours bout-en-bout réalistes (open-loop, synthétique).

Ces tests valident les *contrats d'enchaînement* entre endpoints (et non les
algorithmes ML/XAI, couverts ailleurs). Aucun artefact ML entraîné n'est requis :
sans modèle actif, l'inférence renvoie `calculable=False` (réponse 200 valide).

Posture vérifiée : open-loop strict, RBAC + ownership, validation clinicien,
données 100 % synthétiques.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from tests.conftest import register_and_login


def _auth(tokens):
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def _ts(minutes_ago=10):
    return (
        datetime.now(timezone.utc).replace(microsecond=0)
        - timedelta(minutes=minutes_ago)
    ).isoformat()


# --- Parcours patient -------------------------------------------------------
def test_e2e_patient_journey(client):
    """register → login → me → ingestion CGM → lecture → predict → mine (vide)."""
    tokens = register_and_login(client, role="patient", email="e2e_pat@test.fr")
    assert "access_token" in tokens and "refresh_token" in tokens
    h = _auth(tokens)

    me = client.get("/api/v1/auth/me", headers=h)
    assert me.status_code == 200
    assert me.json()["role"] == "patient"

    # Ingestion d'une lecture CGM synthétique.
    ing = client.post(
        "/api/v1/timeseries/cgm",
        json={"ts": _ts(), "glucose_mgdl": 138, "trend": "stable", "source": "sim"},
        headers=h,
    )
    assert ing.status_code == 201, ing.text

    rows = client.get("/api/v1/timeseries/cgm", headers=h)
    assert rows.status_code == 200
    assert rows.json()[0]["is_synthetic"] is True

    # Inférence open-loop sur son propre dossier (probabilité uniquement).
    pred = client.post(
        "/api/v1/ml/predict",
        json={"target": "hypo", "horizon_min": 30},
        headers=h,
    )
    assert pred.status_code == 200, pred.text
    body = pred.json()
    assert body["is_synthetic"] is True
    assert "open_loop_notice" in body
    # Open-loop : jamais de champ décision/dose/action dans la réponse.
    for forbidden in ("dose", "decision", "action", "recommendation"):
        assert forbidden not in body

    # Le patient ne voit que SES recommandations approuvées (aucune ici).
    mine = client.get("/api/v1/recommendations/mine", headers=h)
    assert mine.status_code == 200
    assert mine.json() == []


# --- Parcours clinicien -----------------------------------------------------
def test_e2e_clinician_journey(client):
    """clinicien : login → liste patients → lecture dossier → liste reco."""
    # Un patient existe (avec un dossier) pour être listé.
    register_and_login(client, role="patient", email="e2e_pat2@test.fr")
    clin = register_and_login(client, role="clinician", email="e2e_clin@test.fr")
    h = _auth(clin)

    patients = client.get("/api/v1/patients", headers=h)
    assert patients.status_code == 200
    assert len(patients.json()) >= 1
    pid = patients.json()[0]["id"]

    one = client.get(f"/api/v1/patients/{pid}", headers=h)
    assert one.status_code == 200

    # La liste de recommandations est réservée clinicien/admin (RBAC) → 200.
    recos = client.get("/api/v1/recommendations", headers=h)
    assert recos.status_code == 200
    assert isinstance(recos.json(), list)

    # Lecture de l'audit chaîné + vérification d'intégrité.
    verify = client.get("/api/v1/audit-logs/verify", headers=h)
    assert verify.status_code == 200
    assert verify.json()["valid"] is True


# --- Parcours sécurité ------------------------------------------------------
def test_e2e_security_journey(client):
    """Auth obligatoire, RBAC rôle, ownership patient↔patient."""
    # 1) Sans token → 401.
    assert client.get("/api/v1/auth/me").status_code == 401
    assert client.post("/api/v1/ml/predict", json={"target": "hypo", "horizon_min": 30}).status_code == 401

    # 2) Patient n'accède pas aux endpoints clinicien (403).
    pat_a = register_and_login(client, role="patient", email="sec_a@test.fr")
    ha = _auth(pat_a)
    assert client.get("/api/v1/patients", headers=ha).status_code == 403
    assert client.get("/api/v1/recommendations", headers=ha).status_code == 403
    assert client.get("/api/v1/xai/global?target=hypo&horizon_min=30", headers=ha).status_code == 403

    # 3) Ownership : un patient ne lit pas le dossier d'un autre patient.
    pat_b = register_and_login(client, role="patient", email="sec_b@test.fr")
    hb = _auth(pat_b)
    client.post("/api/v1/timeseries/cgm",
                json={"ts": _ts(), "glucose_mgdl": 120}, headers=hb)
    pid_b = client.get("/api/v1/timeseries/cgm", headers=hb).json()[0]["patient_id"]
    cross = client.get(f"/api/v1/patients/{pid_b}", headers=ha)
    assert cross.status_code == 403

    # 4) Le refresh renvoie une nouvelle paire (rotation).
    refreshed = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": pat_a["refresh_token"]},
    )
    assert refreshed.status_code == 200
    assert refreshed.json()["access_token"] != pat_a["access_token"]
