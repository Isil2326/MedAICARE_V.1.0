---
name: PostgreSQL schema introspection gotchas
description: Pitfalls when verifying a SQLAlchemy-migrated schema against real PostgreSQL via the Inspector.
---

# PostgreSQL schema introspection (SQLAlchemy Inspector)

When writing schema-verification / smoke-test code against real PostgreSQL:

- A column declared `mapped_column(..., unique=True, index=True)` is realized in
  PostgreSQL as a **unique index** (e.g. `ix_<table>_<col>` with `unique=True`),
  **not** as a named unique *constraint*. So `inspector.get_unique_constraints(table)`
  may return `[]` even though uniqueness is enforced. Detect it via
  `inspector.get_indexes(table)` and filter on `idx["unique"]`.
  **Why:** a smoke check that only looks at `get_unique_constraints` silently
  reports "missing" for unique columns. Check both indexes and constraints.

- `inspector.get_unique_constraints(table)` returns a **list of dicts**. Dicts are
  unhashable, so `set(inspector.get_unique_constraints(table))` raises `TypeError`.
  This bug stays latent if PG returns `[]` (the common case for column-level
  `unique=True`) and only blows up when real constraints exist. Extract
  `tuple(u["column_names"])` instead of building a set of the raw dicts.

**How to apply:** in any future schema/migration smoke test (Phase 1+ timeseries
tables add more indexes), verify uniqueness/indexes through `get_indexes` first,
and only tuple-ize `column_names` from `get_unique_constraints`.
