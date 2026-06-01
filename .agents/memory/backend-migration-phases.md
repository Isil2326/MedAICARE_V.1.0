---
name: Backend migration phases
description: MediAI Care option-2 backend migration order, hard constraints, and phase-gating rule.
---

# MediAI Care backend migration (option 2)

Master's thesis SaMD prototype (diabetes), French, honest critical posture. Migration follows `PROMPT_RECADRE_MIGRATION` **option 2**: build security + real DB foundation first, then later the mobile and ML/XAI layers.

## Non-negotiable constraints (apply to every phase)
- **Simulated data only** — every event `is_synthetic=True`. No silent switch to real data sources.
- **Open-loop strict** — system never auto-produces a recommendation or therapeutic action.
- **No real ML/XAI** until explicitly phased — feature engineering prep only (pure functions).
- **No Expo mobile** until explicitly phased.
- **RBAC + ownership + audit + strict Pydantic** mandatory on all routes.
- **Additive non-destructive migrations only** (ADD COLUMN / CREATE INDEX), rejouable.
- **Non certifié** (MDR, IEC 62304, ISO 13485, HDS, GDPR opérationnel) — keep this disclaimer.

## Phase-gating rule
**Why:** the user explicitly validates each phase report before the next begins.
**How to apply:** never start phase N+1 until the user validates the phase N report. Each phase delivers a structured report under `docs/migration/` (`RAPPORT_PHASE_*.md` or `PHASE_*` / `AMENDEMENT_*`). Phase 0 + 0.1 + 1 + 2 + 2.1 + 3 + 3.1 + 4 (open-loop recommendation engine) delivered; phases through 3.1 validated. Phase 4 awaiting validation; Phase 5 NOT started.

## Layout
- Backend lives in `backend/` (FastAPI, port 8000, workflow "Backend API"), separate from the React app in `MedAICare_V.3_10Patients/` (port 5000).
- Reports/specs in `docs/migration/`.
