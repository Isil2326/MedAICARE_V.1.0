---
name: Backend test execution (OOM)
description: Why the FastAPI backend test suite must be run in batches, not all at once.
---

# Backend test suite runs in batches, not in one `pytest` invocation

Running the full `backend/` pytest suite in a single process can OOM in the Replit
dev environment because three workflows run concurrently (Backend API, Start
application, mockup-sandbox preview) plus ML/XAI libs (xgboost, shap, interpret)
are memory-heavy.

**Why:** concurrent workflows + heavy ML deps loaded by `test_ml_*`/`test_xai.py`.

**How to apply:** use `cd backend && bash scripts/run_test_batches.sh` (light/core,
then ml, then xai, then recommendations+rbac as separate processes). For a quick
no-server contract check use `APP_ENV=test python scripts/validate_backend.py`.
