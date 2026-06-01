---
name: XAI reliability semantics (Phase 3.1)
description: Durable rules for the XAI semantic-reliability layer in the MediAI Care backend — how reliability status is derived and the invariants that must never regress.
---

# XAI semantic-reliability layer (backend/app/xai)

The reliability layer **qualifies** each XAI explanation; it never *corrects* a metric.

## Invariants (do not regress)
- **Never fabricate a metric.** A metric that cannot be computed stays `None`/`null` — it must
  not escalate the reliability status and must not be replaced by a plausible-looking number.
- **Reliability is computed BEFORE caching.** Cache hits must carry the same warnings; if you
  add a new signal, compute it before `cache.set`, never after.
- **Escalation is monotone:** `reliable_for_model_debug < caution_semantic_limits <
  not_reliable_for_clinical_interpretation`. A signal can only raise the status, never lower it.
  A `None` signal does not escalate.
- **physio_congruence == 0.0 → `not_reliable_for_clinical_interpretation`.** The hypo-30 EBM
  couple has physio 0.000 in the synthetic benchmark; this value is **kept as-is** and the EBM
  native explanation is **not silently swapped** for another method.
- **Global direction is never presented as a simple "augmente/diminue" truth.** EBM →
  `not_globalizable`; SHAP → `aggregated_signed_effect` (raw sign kept separately in
  `aggregated_sign`).
- **Open-loop guardrail:** no dose/decision/recommendation field may ever appear in XAI
  schemas. The standing rule for any future consumer (Phase 4): *XAI is display/support only,
  not a decision engine* — and a `not_reliable_for_clinical_interpretation` explanation must be
  refused as clinical-interpretation support.

**Why:** supervisor amendment (Phase 3.1) required exposing semantic limits honestly before any
recommendation engine; the whole point is transparency, so masking a warning or inventing a
metric defeats it.

**How to apply:** when touching `reliability.py`, `global_explanations.py`, or `service.py`,
re-check these invariants. Regenerate global artifacts (`python -m app.xai.generate_global`)
after any model/metric change so local reliability consumes up-to-date `evaluation` signals;
the artifacts are gitignored and regenerable.
