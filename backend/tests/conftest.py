"""Fixtures de test : base SQLite isolée + client FastAPI + seed minimal.

Les tests n'utilisent jamais la base PostgreSQL de dev : chaque test tourne
sur une base SQLite jetable, garantissant isolation et reproductibilité.
"""
from __future__ import annotations

import os

os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-not-for-production")
os.environ["DATABASE_URL"] = "sqlite://"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import get_db
from app.main import app
from app.models import Base, Role

TEST_ROLES = [
    ("patient", "Patient"),
    ("clinician", "Clinicien"),
    ("admin", "Admin"),
]


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=engine
    )
    db = TestingSessionLocal()
    for name, desc in TEST_ROLES:
        db.add(Role(name=name, description=desc))
    db.commit()
    try:
        yield db, TestingSessionLocal
    finally:
        db.close()
        Base.metadata.drop_all(engine)


@pytest.fixture(autouse=True)
def _reset_rate_limiter():
    """Réinitialise le limiteur en mémoire entre les tests (isolation)."""
    from app.core.rate_limit import limiter

    limiter.reset()
    yield
    limiter.reset()


@pytest.fixture()
def client(db_session):
    _, TestingSessionLocal = db_session

    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def register_and_login(client, *, role="patient", email=None, password="Strong1234!@"):
    email = email or f"{role}@test.fr"
    payload = {
        "email": email,
        "password": password,
        "first_name": "Test",
        "last_name": "User",
    }
    if role == "clinician":
        payload["specialty"] = "Endocrino"
        client.post("/api/v1/auth/register/clinician", json=payload)
    else:
        client.post("/api/v1/auth/register/patient", json=payload)
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    return res.json()
