"""Tests d'intégration du pipeline temporel : ingestion, RBAC, dedup, fenêtre."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.models import AuditLog
from tests.conftest import register_and_login


def _auth(tokens):
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def _ts(minutes_ago=10):
    return (
        datetime.now(timezone.utc).replace(microsecond=0)
        - timedelta(minutes=minutes_ago)
    ).isoformat()


# --- Ingestion + is_synthetic ----------------------------------------------
def test_patient_can_ingest_cgm(client):
    pat = register_and_login(client, role="patient", email="ts1@test.fr")
    res = client.post(
        "/api/v1/timeseries/cgm",
        json={"ts": _ts(), "glucose_mgdl": 142, "trend": "stable", "source": "sim"},
        headers=_auth(pat),
    )
    assert res.status_code == 201, res.text
    body = res.json()
    assert body["created"] is True and body["duplicate"] is False
    assert body["quality_flag"] == "valid"

    got = client.get("/api/v1/timeseries/cgm", headers=_auth(pat))
    assert got.status_code == 200
    rows = got.json()
    assert len(rows) == 1
    assert rows[0]["is_synthetic"] is True
    assert rows[0]["glucose_mgdl"] == 142


def test_ingest_all_kinds(client):
    pat = register_and_login(client, role="patient", email="ts2@test.fr")
    h = _auth(pat)
    assert client.post("/api/v1/timeseries/insulin",
                       json={"ts": _ts(), "units": 6, "insulin_type": "bolus"},
                       headers=h).status_code == 201
    assert client.post("/api/v1/timeseries/meals",
                       json={"ts": _ts(), "carbs_g": 60, "description": "lunch"},
                       headers=h).status_code == 201
    assert client.post("/api/v1/timeseries/activity",
                       json={"ts": _ts(), "duration_min": 30, "intensity": "moderate"},
                       headers=h).status_code == 201
    events = client.get("/api/v1/timeseries/events", headers=h).json()
    kinds = {e["kind"] for e in events}
    assert {"insulin", "meal", "activity"} <= kinds


# --- RBAC / ownership -------------------------------------------------------
def test_unauthenticated_rejected(client):
    res = client.post("/api/v1/timeseries/cgm",
                      json={"ts": _ts(), "glucose_mgdl": 120})
    assert res.status_code == 401


def test_clinician_cannot_write(client):
    clin = register_and_login(client, role="clinician", email="tsclin@test.fr")
    res = client.post("/api/v1/timeseries/cgm",
                      json={"ts": _ts(), "glucose_mgdl": 120}, headers=_auth(clin))
    assert res.status_code == 403


def test_clinician_can_read_with_patient_id_only(client):
    pat = register_and_login(client, role="patient", email="tsown@test.fr")
    client.post("/api/v1/timeseries/cgm",
                json={"ts": _ts(), "glucose_mgdl": 120}, headers=_auth(pat))
    pid = client.get("/api/v1/timeseries/cgm", headers=_auth(pat)).json()[0]["patient_id"]

    clin = register_and_login(client, role="clinician", email="tsread@test.fr")
    # sans patient_id -> 400
    assert client.get("/api/v1/timeseries/cgm", headers=_auth(clin)).status_code == 400
    # avec patient_id -> 200
    ok = client.get(f"/api/v1/timeseries/cgm?patient_id={pid}", headers=_auth(clin))
    assert ok.status_code == 200 and len(ok.json()) == 1


def test_patient_cannot_read_other_patient(client):
    pat_a = register_and_login(client, role="patient", email="tsa@test.fr")
    client.post("/api/v1/timeseries/cgm",
                json={"ts": _ts(), "glucose_mgdl": 120}, headers=_auth(pat_a))
    pid_a = client.get("/api/v1/timeseries/cgm", headers=_auth(pat_a)).json()[0]["patient_id"]

    pat_b = register_and_login(client, role="patient", email="tsb@test.fr")
    res = client.get(f"/api/v1/timeseries/cgm?patient_id={pid_a}", headers=_auth(pat_b))
    assert res.status_code == 403


# --- Audit ------------------------------------------------------------------
def test_write_creates_audit_log(client, db_session):
    db, _ = db_session
    pat = register_and_login(client, role="patient", email="tsaudit@test.fr")
    client.post("/api/v1/timeseries/cgm",
                json={"ts": _ts(), "glucose_mgdl": 120}, headers=_auth(pat))
    entries = [a for a in db.query(AuditLog).all()
               if a.action == "timeseries.cgm.create"]
    assert len(entries) == 1
    assert entries[0].resource_type == "cgm"


# --- Bornes physiologiques (422) -------------------------------------------
def test_out_of_range_rejected(client):
    pat = register_and_login(client, role="patient", email="tsbounds@test.fr")
    h = _auth(pat)
    assert client.post("/api/v1/timeseries/cgm",
                       json={"ts": _ts(), "glucose_mgdl": 5}, headers=h).status_code == 422
    assert client.post("/api/v1/timeseries/insulin",
                       json={"ts": _ts(), "units": 999}, headers=h).status_code == 422


# --- Timestamps -------------------------------------------------------------
def test_naive_and_future_ts_rejected(client):
    pat = register_and_login(client, role="patient", email="tsts@test.fr")
    h = _auth(pat)
    # naïf
    assert client.post("/api/v1/timeseries/cgm",
                       json={"ts": "2026-05-31T08:00:00", "glucose_mgdl": 120},
                       headers=h).status_code == 422
    # futur
    future = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    assert client.post("/api/v1/timeseries/cgm",
                       json={"ts": future, "glucose_mgdl": 120},
                       headers=h).status_code == 422


# --- Déduplication / idempotence -------------------------------------------
def test_dedup_by_external_event_id(client):
    pat = register_and_login(client, role="patient", email="tsdedup1@test.fr")
    h = _auth(pat)
    payload = {"ts": _ts(), "glucose_mgdl": 130, "source": "sim",
               "external_event_id": "ext-123"}
    r1 = client.post("/api/v1/timeseries/cgm", json=payload, headers=h)
    r2 = client.post("/api/v1/timeseries/cgm", json=payload, headers=h)
    assert r1.status_code == 201 and r1.json()["created"] is True
    assert r2.status_code == 200 and r2.json()["duplicate"] is True
    assert r1.json()["id"] == r2.json()["id"]
    assert len(client.get("/api/v1/timeseries/cgm", headers=h).json()) == 1


def test_dedup_by_logical_key(client):
    pat = register_and_login(client, role="patient", email="tsdedup2@test.fr")
    h = _auth(pat)
    ts = _ts()
    payload = {"ts": ts, "glucose_mgdl": 155, "source": "sim"}  # pas d'external id
    r1 = client.post("/api/v1/timeseries/cgm", json=payload, headers=h)
    r2 = client.post("/api/v1/timeseries/cgm", json=payload, headers=h)
    assert r1.json()["created"] is True
    assert r2.json()["duplicate"] is True
    assert len(client.get("/api/v1/timeseries/cgm", headers=h).json()) == 1


# --- Fenêtre temporelle -----------------------------------------------------
def test_time_window_filter(client):
    pat = register_and_login(client, role="patient", email="tswin@test.fr")
    h = _auth(pat)
    for m in (120, 60, 10):
        client.post("/api/v1/timeseries/cgm",
                    json={"ts": _ts(m), "glucose_mgdl": 100 + m, "source": "sim"}, headers=h)
    # fenêtre des 90 dernières minutes -> 2 points (60, 10)
    start = (datetime.now(timezone.utc) - timedelta(minutes=90)).isoformat()
    rows = client.get("/api/v1/timeseries/cgm", params={"start": start},
                      headers=h).json()
    assert len(rows) == 2


def test_invalid_window_rejected(client):
    pat = register_and_login(client, role="patient", email="tswin2@test.fr")
    h = _auth(pat)
    now = datetime.now(timezone.utc)
    res = client.get("/api/v1/timeseries/cgm",
                     params={"start": now.isoformat(),
                             "end": (now - timedelta(hours=1)).isoformat()},
                     headers=h)
    assert res.status_code == 400
