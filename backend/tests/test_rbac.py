"""Tests RBAC serveur : séparation patient / clinicien."""
from __future__ import annotations

from tests.conftest import register_and_login


def _auth(tokens):
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def test_patient_cannot_list_patients(client):
    tokens = register_and_login(client, role="patient", email="p1@test.fr")
    res = client.get("/api/v1/patients", headers=_auth(tokens))
    assert res.status_code == 403


def test_clinician_can_list_patients(client):
    register_and_login(client, role="patient", email="p2@test.fr")
    clin = register_and_login(client, role="clinician", email="c1@test.fr")
    res = client.get("/api/v1/patients", headers=_auth(clin))
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_clinician_cannot_access_patient_me(client):
    clin = register_and_login(client, role="clinician", email="c2@test.fr")
    res = client.get("/api/v1/patients/me", headers=_auth(clin))
    assert res.status_code == 403


def test_patient_can_read_own_record(client):
    tokens = register_and_login(client, role="patient", email="p3@test.fr")
    res = client.get("/api/v1/patients/me", headers=_auth(tokens))
    assert res.status_code == 200
    assert res.json()["first_name"] == "Test"


def test_recommendations_require_clinician(client):
    tokens = register_and_login(client, role="patient", email="p4@test.fr")
    res = client.get("/api/v1/recommendations", headers=_auth(tokens))
    assert res.status_code == 403


def test_audit_requires_clinician(client):
    tokens = register_and_login(client, role="patient", email="p5@test.fr")
    res = client.get("/api/v1/audit-logs", headers=_auth(tokens))
    assert res.status_code == 403
