#!/usr/bin/env bash
# MediAI Care — exécution de la suite de tests PAR LOTS.
# Contrainte mémoire : plusieurs workflows tournent en parallèle dans l'environnement
# de dev → exécuter tout d'un bloc peut provoquer un OOM. On découpe en lots.
# Usage : cd backend && bash scripts/run_test_batches.sh
set -euo pipefail
cd "$(dirname "$0")/.."
export APP_ENV=test

PYTEST="python -m pytest -p no:warnings -q"
fail=0

run_batch() {
  echo "=== Lot : $1 ==="
  # shellcheck disable=SC2086
  if ! $PYTEST $2; then fail=1; fi
}

run_batch "core/auth/timeseries/e2e/phase5" \
  "tests/test_auth.py tests/test_models.py tests/test_endpoints.py tests/test_features.py \
   tests/test_timeseries.py tests/test_timeseries_schemas.py tests/test_hardening.py \
   tests/test_audit.py tests/test_antileakage.py tests/test_e2e_workflows.py tests/test_phase5.py"

run_batch "ml" "tests/test_ml_unit.py tests/test_ml_pipeline.py"
run_batch "xai" "tests/test_xai.py"
run_batch "recommendations/rbac" "tests/test_recommendations_engine.py tests/test_rbac.py"

if [ "$fail" -ne 0 ]; then
  echo "ECHEC : au moins un lot a échoué." >&2
  exit 1
fi
echo "OK : tous les lots sont verts."
