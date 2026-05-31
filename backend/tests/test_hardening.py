"""Tests Phase 0.1 — durcissement : /ready, rate limiting login/refresh."""
from __future__ import annotations

from tests.conftest import register_and_login


def test_ready_ok(client):
    res = client.get("/ready")
    assert res.status_code == 200
    assert res.json()["status"] == "ready"


def test_health_ok(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_login_rate_limited(client):
    # Limite par défaut : 5 tentatives / 60 s. La 6e doit renvoyer 429.
    statuses = []
    for _ in range(7):
        r = client.post(
            "/api/v1/auth/login",
            json={"email": "ghost@test.fr", "password": "WhateverPass1!"},
        )
        statuses.append(r.status_code)
    assert statuses[0] != 429  # premières tentatives non bloquées
    assert statuses[-1] == 429  # excès bloqué
    assert 429 in statuses
    # En-tête Retry-After présent sur la réponse 429.
    blocked = client.post(
        "/api/v1/auth/login",
        json={"email": "ghost@test.fr", "password": "WhateverPass1!"},
    )
    assert blocked.status_code == 429
    assert "retry-after" in {k.lower() for k in blocked.headers}


def test_refresh_rate_limited(client):
    # Limite par défaut : 10 tentatives / 60 s. La 11e doit renvoyer 429.
    statuses = []
    for _ in range(12):
        r = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "jeton-bidon"},
        )
        statuses.append(r.status_code)
    assert statuses[0] != 429
    assert statuses[-1] == 429


def test_normal_login_not_blocked(client):
    # Un usage normal (quelques connexions valides) ne doit jamais être bloqué.
    register_and_login(client, role="patient", email="normal@test.fr")
    for _ in range(3):
        r = client.post(
            "/api/v1/auth/login",
            json={"email": "normal@test.fr", "password": "Strong1234!@"},
        )
        assert r.status_code == 200
