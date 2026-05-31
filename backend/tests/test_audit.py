"""Tests journal d'audit : chaînage, append-only, détection d'altération."""
from __future__ import annotations

from app.models import AuditLog
from app.services import audit_service
from tests.conftest import register_and_login


def test_chain_grows_and_links(db_session):
    db, _ = db_session
    e1 = audit_service.record(db, action="test.one")
    e2 = audit_service.record(db, action="test.two")
    db.commit()
    assert e1.sequence == 1
    assert e2.sequence == 2
    assert e2.prev_hash == e1.entry_hash


def test_verify_chain_valid(db_session):
    db, _ = db_session
    for i in range(5):
        audit_service.record(db, action=f"evt.{i}")
    db.commit()
    result = audit_service.verify_chain(db)
    assert result["valid"] is True
    assert result["checked"] == 5


def test_tampering_breaks_chain(db_session):
    db, _ = db_session
    for i in range(3):
        audit_service.record(db, action=f"evt.{i}")
    db.commit()

    # Altération directe d'une entrée existante (simulateur d'attaque).
    entry = db.query(AuditLog).filter(AuditLog.sequence == 2).first()
    entry.action = "tampered"
    db.commit()

    result = audit_service.verify_chain(db)
    assert result["valid"] is False
    assert result["broken_at"] == 2


def test_login_creates_audit_entry(client, db_session):
    db, _ = db_session
    register_and_login(client, role="patient", email="aud@test.fr")
    actions = [a.action for a in db.query(AuditLog).all()]
    assert "auth.login" in actions
    assert "user.register" in actions
