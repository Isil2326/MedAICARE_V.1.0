#!/usr/bin/env bash
# One-shot: train the two hyper couples (hypo couples already trained),
# then regenerate global XAI for all 4 active couples.
# Synthetic-only, open-loop. Regenerable artifacts (gitignored by design).
set -euo pipefail
cd "$(dirname "$0")/.."

echo "[regen_hyper] start $(date +%T)"

echo "[regen_hyper] === train hyper-30 ==="
python -u -m app.ml.train --target hyper --horizon 30

echo "[regen_hyper] === train hyper-60 ==="
python -u -m app.ml.train --target hyper --horizon 60

echo "[regen_hyper] === verify both hyper couples are active before XAI ==="
python -u - <<'PY'
import json, sys
from app.ml import config
reg = json.load(open(config.REGISTRY_PATH if hasattr(config, "REGISTRY_PATH")
                     else "artifacts/registry.json"))
models = reg["models"] if isinstance(reg, dict) else reg
active = {(m["target"], m["horizon_min"]) for m in models}
missing = [c for c in (("hyper", 30), ("hyper", 60)) if c not in active]
if missing:
    print(f"[regen_hyper] MISSING active couples: {missing}", file=sys.stderr)
    sys.exit(1)
print("[regen_hyper] hyper-30 and hyper-60 present in registry")
PY

echo "[regen_hyper] === global XAI (all active couples) ==="
python -u -m app.xai.generate_global

echo "[regen_hyper] DONE $(date +%T)"
