---
name: Backend test & migration quirks
description: How the backend test DB differs from prod, and portable-index gotchas.
---

# Backend test / migration quirks

- **Tests use SQLite in-memory via `Base.metadata.create_all`, NOT alembic.** So new model columns auto-appear in tests even without a migration — tests will pass while a missing/incorrect migration would break real PostgreSQL. Always also run `alembic upgrade head` + `python -m scripts.smoke_postgres` against PG, which is the only check that validates the migration itself.
- **conftest** spins one shared in-memory engine per test via StaticPool; the `client` fixture and the `db_session` fixture share the same DB, so you can POST via the TestClient and then assert rows directly with the `db_session` query (e.g. AuditLog).
- **Partial unique indexes must declare both dialects** to be portable: `postgresql_where=...` AND `sqlite_where=...` on the same `Index`.
- **URL query params with timestamps:** pass `params={...}` to TestClient.get, never f-string the isoformat into the URL — the `+` in `+00:00` decodes to a space and breaks parsing.
- **Commands:** init `cd backend && alembic upgrade head && python -m app.seed`; tests `cd backend && python -m pytest -q`; smoke `python -m scripts.smoke_postgres`. Demo password `DemoMediAI2026!`. Restart "Backend API" workflow after changes.
