---
name: Backend foundation
description: Architecture & conventions of the FastAPI/Postgres backend socle (migration option 2)
---

The backend socle lives under `backend/` and is independent from the legacy React app
(`MedAICare_V.3_10Patients/`). Two workflows coexist: the React app on port 5000 (webview) and
the FastAPI backend on port 8000 (console). They must stay on separate ports.

**Why:** migration option 2 = build security + real DB foundation before mobile/ML.

**Durable conventions (non-obvious):**
- SQLAlchemy models use **portable types** (Uuid, JSON, DateTime tz) so the SAME models run on
  PostgreSQL (dev/prod) and SQLite (tests). Tests use a throwaway SQLite DB, never the dev Postgres.
- With `from __future__ import annotations`, FK columns MUST be typed `Mapped[uuid.UUID]`
  (or `Mapped[uuid.UUID | None]`) AND `import uuid` must be in the module — a bare `Mapped`
  raises MappedAnnotationError at mapper config time.
- State-transition flows (refresh rotation, recommendation arbitration) MUST be done as a single
  atomic guarded `UPDATE ... WHERE <still-in-expected-state>` + rowcount check, NOT read-then-write.
  Read-then-write races let two concurrent calls both pass the precondition. Reuse/double-action
  is then inferred from rowcount==0.
- Refresh tokens: opaque random value, only SHA-256 hash stored; reuse of a rotated token revokes
  the whole session family + audit entry. Logout must verify token ownership (actor == token.user)
  to prevent cross-user revocation.
- Audit log is append-only **chained** (SHA-256 over immutable fields + prev_hash). `sequence` and
  `entry_hash` carry DB uniqueness to prevent chain forks under concurrency. `/verify` recomputes.
  This is **detectability, not immutability** — full write access could recompute the chain. Don't
  oversell it as tamper-proof.
- Open-loop strict: a Recommendation is born `pending`; only a clinician moves it to
  approved/rejected; no automatic transitions; double-arbitration returns 409.
- All patient data is synthetic (`is_synthetic=True`); ML predictions are placeholders.

**Apply when:** extending the backend, adding models, or wiring mobile/ML phases later.
First init: `alembic upgrade head` then run the seed module; tests via pytest. Demo accounts are
created by the seed (see backend/README.md), not stored here.
