---
name: ML Phase 2 (modeling) decisions & constraints
description: Durable rules for the backend ML risk-prediction layer (open-loop, anti-leakage, synthetic-only)
---

# ML Phase 2 — risk-prediction layer (`backend/app/ml/`)

Non-negotiable invariants any future ML change must preserve (thesis SaMD prototype, honest posture):

- **Open-loop strict.** Endpoint/inference return PROBABILITY + risk label only. Never add a
  dose/action/decision field anywhere in the ML path or schemas.
  **Why:** safety boundary of the recadrage; closing the loop would make it an uncertified
  decision-making medical device.

- **Synthetic-only at the source.** ML reads MUST filter `is_synthetic=True`. Enforced in the ML
  layer (`features_adapter.load_series` drops non-synthetic rows; `dataset_builder.list_patient_ids`
  filters CGM by `is_synthetic`), NOT in the shared `timeseries_repo` (used by general endpoints).
  **Why:** "données simulées uniquement"; a non-synthetic row must never enter training/inference.
  **How to apply:** if you add a new ML read path, re-apply the synthetic filter there too.

- **Anti-leakage.** Features use only `ts <= T`; labels look forward only `(T, T+h]` (point AT T
  excluded), `None` when no future observable; split is TEMPORAL (train<val<test), model selection on
  validation, single final evaluation on test. Unit test asserts a far-future point changes no
  feature of an existing row.

- **No invented metrics.** Single-class test segment → AUROC/AUPRC return `None` + a note
  ("non calculable"). This is intended behaviour on the small synthetic dataset, NOT a bug to "fix"
  by fabricating a value.

- **Timestamp tz handling.** SQLite returns naive datetimes, PG returns tz-aware. Normalize to
  tz-aware UTC at the ML boundary: `features_adapter._as_utc` is applied to loaded points AND to the
  request `at` in `inference_service.predict`. A naive `at` compared to tz-aware points raises
  TypeError otherwise.
  **Why:** tests run on SQLite, prod on PG; comparisons must work on both.

- **Environment.** EBM (interpret) works; **Optuna has no Linux wheel** → `tuning.py` falls back to a
  fixed grid (documented). Root `pyproject.toml` requires-python pinned `>=3.11,<3.13`.

- **Artifacts.** `backend/artifacts/` (models/*.joblib, registry.json, datasets, metrics) is
  **gitignored** and regenerable via CLI (`app.ml.build_dataset` / `train` / `evaluate`). Registry
  JSON is canonical; DB table `model_registry` (migration additive) mirrors it. One active model per
  `(target, horizon)`.

- **Ops gotcha.** The `Backend API` workflow has no `--reload`; after editing routers/endpoints you
  must restart it or live calls 404 against stale code.

- **Split must be timestamp-boundary-aware (multi-patient leakage).** With several patients sharing
  identical `at` values, an index-fraction split can put the SAME timestamp in two splits (e.g.
  val.max == test.min). `temporal_split` advances each cut to a timestamp boundary
  (`_advance_to_boundary`) so a given instant belongs entirely to one split, and
  `assert_no_timestamp_overlap` enforces zero overlap. **Why:** "aucun timestamp ne fuit" must hold
  across patients, not just within one series. Don't revert to a raw `iloc` fraction cut.

- **Registry single-active is a DB guarantee, not just app logic.** Partial unique index
  `uq_model_registry_active_couple` on `(target,horizon_min)` where `is_active` enforces one active
  model per couple. On register, archive others (`is_active=False`, `status='archived'`) + `flush()`
  BEFORE inserting the new active row, or the partial-unique index trips on a transient double-active.
  Lifecycle cols: `status` (active/candidate/archived), `dataset_version`/`features_version`,
  `synthetic_only` (always True). Backfill migration must set `status='archived'` where not active
  (server_default 'active' would wrongly label old inactive rows).

Reproduce: `alembic upgrade head` → `python -m app.seed` → `python -m app.ml.train` →
`python -m pytest -q` (Phase1 + Phase2 must stay green).
Docs: `docs/migration/PHASE_2_MODELISATION_ML.md` + `RAPPORT_PHASE_2.md`.
