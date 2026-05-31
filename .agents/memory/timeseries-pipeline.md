---
name: Timeseries pipeline decisions
description: Phase 1 data-engineering decisions — TimescaleDB fallback, idempotent dedup, timestamp rule, anti-leakage.
---

# Phase 1 timeseries pipeline (backend/)

4 event tables: cgm_readings, insulin_events, meal_events, activity_events. Shared pipeline mixin adds source/external_event_id/device_id/quality_flag/ingestion_batch_id/unit/event_metadata.

## TimescaleDB → standard-PG fallback
**Why:** hypertables require a composite PK including the time column `(id, ts)` = destructive PK change (forbidden), and conflict with `predictions` FKs into the event tables. Extension is available (2.13.0) but not installed.
**How to apply:** keep standard PG + `(patient_id, ts)` indexes (`ix_<kind>_patient_ts`). If volume later forces partitioning, do it via a dedicated migration creating a new partitioned table + backfill — never mutate existing PKs/FKs.

## Idempotent dedup
- Unique partial index `(patient_id, source, external_event_id)` WHERE external_event_id NOT NULL (portable: `postgresql_where` + `sqlite_where`).
- Service-level logical dedup `(patient_id, source, ts, main_value)` for events without external_event_id.
- POST returns **201** when created, **200** when duplicate (same id, no new row).
**Why concurrency matters:** check-then-insert races; the commit is wrapped in `try/except IntegrityError` → rollback → re-find → return existing as duplicate. Stays idempotent under concurrent ingestion.

## Timestamp rule (normalize_utc in schemas/timeseries.py)
tz-aware REQUIRED (naive rejected 422), normalized to UTC, reject future > 2 min tolerance, reject before 2000. Same validator used for query windows (start<=end, else 400). `_parse_window` wraps ValueError → 400 (not 500).

## Anti-temporal-leakage (services/feature_engineering.py)
Pure functions only, NO ML. Guarantee: a point with `ts > at` never affects a feature computed at T. `compute_features(at, …)` raises if any series contains a future point; window helpers only read `ts <= at`. Regression test: adding a strictly-future point changes no feature at T.

## Write RBAC = role AND ownership
Write path requires `user.role_name == "patient"` AND an attached patient row (defense in depth — a clinician/admin can never write even if a patient row were mis-attached). Clinician/admin read-only with explicit patient_id (400 without, 403 cross-patient).
