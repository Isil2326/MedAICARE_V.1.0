"""Tests authentification : register, login, refresh rotation, logout, révocation."""
from __future__ import annotations

from tests.conftest import register_and_login


def test_register_patient_then_login(client):
    res = client.post("/api/v1/auth/register/patient", json={
        "email": "newpat@test.fr", "password": "Strong123!",
        "first_name": "Jean", "last_name": "Dupont",
    })
    assert res.status_code == 201
    assert res.json()["role"] == "patient"

    login = client.post("/api/v1/auth/login", json={
        "email": "newpat@test.fr", "password": "Strong123!",
    })
    assert login.status_code == 200
    body = login.json()
    assert "access_token" in body and "refresh_token" in body


def test_duplicate_email_rejected(client):
    payload = {
        "email": "dup@test.fr", "password": "Strong123!",
        "first_name": "A", "last_name": "B",
    }
    assert client.post("/api/v1/auth/register/patient", json=payload).status_code == 201
    assert client.post("/api/v1/auth/register/patient", json=payload).status_code == 409


def test_login_wrong_password(client):
    register_and_login(client, role="patient", email="wp@test.fr")
    res = client.post("/api/v1/auth/login", json={
        "email": "wp@test.fr", "password": "WRONGpass1!",
    })
    assert res.status_code == 401


def test_weak_password_rejected(client):
    res = client.post("/api/v1/auth/register/patient", json={
        "email": "weak@test.fr", "password": "123",
        "first_name": "A", "last_name": "B",
    })
    assert res.status_code == 422


def test_refresh_rotation_issues_new_and_revokes_old(client):
    tokens = register_and_login(client, role="patient", email="rot@test.fr")
    old_refresh = tokens["refresh_token"]

    r1 = client.post("/api/v1/auth/refresh", json={"refresh_token": old_refresh})
    assert r1.status_code == 200
    new_refresh = r1.json()["refresh_token"]
    assert new_refresh != old_refresh

    # Réutiliser l'ancien refresh (déjà tourné) doit échouer.
    reuse = client.post("/api/v1/auth/refresh", json={"refresh_token": old_refresh})
    assert reuse.status_code == 401


def test_refresh_reuse_revokes_all_sessions(client):
    tokens = register_and_login(client, role="patient", email="reuse@test.fr")
    old = tokens["refresh_token"]
    r1 = client.post("/api/v1/auth/refresh", json={"refresh_token": old})
    new = r1.json()["refresh_token"]

    # Réutilisation de l'ancien → détection → révocation de toute la famille.
    client.post("/api/v1/auth/refresh", json={"refresh_token": old})
    # Le nouveau token légitime est désormais révoqué lui aussi.
    after = client.post("/api/v1/auth/refresh", json={"refresh_token": new})
    assert after.status_code == 401


def test_logout_revokes_refresh(client):
    tokens = register_and_login(client, role="patient", email="lo@test.fr")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    out = client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": tokens["refresh_token"]},
        headers=headers,
    )
    assert out.status_code == 204
    # Le refresh révoqué ne fonctionne plus.
    after = client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert after.status_code == 401


def test_me_requires_auth(client):
    assert client.get("/api/v1/auth/me").status_code == 401
    tokens = register_and_login(client, role="patient", email="me@test.fr")
    res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert res.status_code == 200
    assert res.json()["email"] == "me@test.fr"
