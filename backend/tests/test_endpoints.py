"""Tests endpoints critiques : health, racine, workflow open-loop."""
from __future__ import annotations

import uuid

from app.models import Patient, Prediction, Recommendation
from app.models.clinical import RecommendationStatus
from tests.conftest import register_and_login


def _auth(tokens):
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_root_has_disclaimer(client):
    res = client.get("/")
    assert res.status_code == 200
    assert "non certifié" in res.json()["disclaimer"]


def _make_pending_reco(TestingSessionLocal) -> str:
    db = TestingSessionLocal()
    try:
        patient = db.query(Patient).first()
        pred = Prediction(
            patient_id=patient.id, ts=__import__("datetime").datetime.now(
                __import__("datetime").timezone.utc
            ),
            predicted_event="hypo", probability=0.6,
        )
        db.add(pred)
        db.flush()
        rec = Recommendation(
            patient_id=patient.id, prediction_id=pred.id,
            category="monitoring", message="message prudent", priority=1,
        )
        db.add(rec)
        db.commit()
        return str(rec.id)
    finally:
        db.close()


def test_open_loop_approve_flow(client, db_session):
    _, TestingSessionLocal = db_session
    register_and_login(client, role="patient", email="ol@test.fr")
    clin = register_and_login(client, role="clinician", email="olc@test.fr")
    rec_id = _make_pending_reco(TestingSessionLocal)

    # Liste des pending visible par le clinicien
    pending = client.get("/api/v1/recommendations?status=pending", headers=_auth(clin))
    assert pending.status_code == 200
    assert any(r["id"] == rec_id for r in pending.json())

    # Approbation
    appr = client.post(
        f"/api/v1/recommendations/{rec_id}/approve",
        json={"note": "Validé après revue"}, headers=_auth(clin),
    )
    assert appr.status_code == 200
    assert appr.json()["status"] == RecommendationStatus.approved.value

    # Double arbitrage interdit (déjà arbitrée)
    again = client.post(
        f"/api/v1/recommendations/{rec_id}/approve",
        json={}, headers=_auth(clin),
    )
    assert again.status_code == 409


def test_approve_unknown_reco_404(client):
    clin = register_and_login(client, role="clinician", email="nf@test.fr")
    res = client.post(
        f"/api/v1/recommendations/{uuid.uuid4()}/approve",
        json={}, headers=_auth(clin),
    )
    assert res.status_code == 404


def test_audit_verify_endpoint(client):
    clin = register_and_login(client, role="clinician", email="av@test.fr")
    res = client.get("/api/v1/audit-logs/verify", headers=_auth(clin))
    assert res.status_code == 200
    assert res.json()["valid"] is True
