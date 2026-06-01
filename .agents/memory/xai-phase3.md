---
name: XAI Phase 3 decisions
description: Durable, non-obvious decisions/constraints for the MediAI Care backend XAI (explainability) layer
---

# XAI Phase 3 — explicabilité open-loop

**Scope boundary (non-negotiable):** the XAI layer only *explains* ML predictions. It must never
emit a dose, decision, or recommendation — that is Phase 4, which must NOT be started without
explicit supervisor validation of the Phase 3 report. Data is synthetic-only.

**XAI ≠ causality.** Patient/clinician text must never say "la cause est"; use "le modèle a
pondéré…". Enforce via a forbidden-term list asserted by tests; keep text template-based, not free-gen.

**The calibration-honesty rule (easy to get wrong).** Active models are *calibrated*, but
SHAP/LIME/EBM-native explain the *uncalibrated base estimator*, while the displayed probability is
the *calibrated* one. Surface this as two explicit fields ("is it calibrated" + "what does the
attribution explain = uncalibrated model"). Every explainer path (incl. LIME and the occlusion
fallback) must label its target consistently as the uncalibrated model — do not let one path claim
it explains the calibrated probability.
**Why:** silently attributing the explanation to the calibrated proba is a scientific
misrepresentation the supervisor explicitly forbids.

**Honest fallback, never fabricate.** If an explainer fails, fall back to a model-agnostic method
with an explicit fallback flag + reason. Never invent contributions to fill a top-k list.

**400 vs 422 for enum-like inputs.** The spec requires HTTP 400 for an invalid `method`. A Pydantic
`Literal` field returns 422, not 400. So accept such fields as plain `str` and validate in the
handler to return 400. Reuse this pattern whenever a spec mandates 400 for a bad enum value.

**Cache correctness > cache cleverness.** The cache key must include a *real* hash of the feature
vector at T (content-addressed), not a placeholder — otherwise stale explanations are served within
TTL when underlying data changes. And `persist=True` must still write a record even on a cache hit
(traceability), so persistence logic cannot sit only on the cache-miss branch.
**Why:** both were real review findings; either bug silently breaks auditability/freshness.

**Test setup gotcha.** XAI tests train models in-memory on SQLite (restricted model set for speed,
artifacts redirected to a temp dir). The synthetic series must cross both hypo/hyper thresholds so
both classes exist. Clear *both* the ML inference cache and the XAI cache between train and assert.
Caching only meaningfully engages when an explicit `at` is supplied (a "now" explanation varies).
