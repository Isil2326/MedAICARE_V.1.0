---
name: Recommendation engine safety (open-loop)
description: Open-loop recommendation safety must cover EVERY persistence path, not just generation.
---

# Recommendation engine — safety on all write paths

**Rule:** the safety layer (`backend/app/recommendations/safety.py` — FORBIDDEN_TERMS + numeric-dose regex) must run on **every** path that writes free-text into a recommendation, not only at generation time. The clinician `modify` path was the gap: it edited the free-text `message` without re-validating, letting prescriptive/dose wording bypass safety after generation.

**Why:** open-loop strict forbids any dose/decision wording reaching a stored/displayed suggestion. Validating only the generation path leaves edit/override paths as a bypass — an architect review flagged this as a critical violation.

**How to apply:** any new endpoint or service that mutates recommendation text (modify, override, bulk-edit, import) must call `safety.check_message(...)` on both the message and any free-text note, reject on violation (HTTP 400), and emit `recommendation.safety_blocked` audit before refusing. Add a regression test that feeds a forbidden term AND a numeric dose to each such path.

## XAI is display/audit only — never a clinical justification

**Rule:** the recommendation rationale's XAI block must ALWAYS carry `clinical_justification_allowed=false`, even when the XAI is reliable. XAI explains model behavior, never medical causality, and is never a clinical justification. Safety enforces a strict invariant: any present `rationale.xai` block missing the explicit `false` flag (or carrying any legacy "used as justification" flag set true) is blocked.

**Why:** an earlier design let a reliable XAI be marked as a clinical justification, which contradicts the reliability-semantics posture (XAI ≠ decision engine). A supervisor amendment made the lock mandatory before proceeding to later phases.

**How to apply:** never reintroduce a field/flag that conditions "XAI as justification" on reliability. Probabilities driving rules must come only from a synthetic DB prediction (owned by patient, `is_synthetic=True`, else 400) or server-side `ml.predict` — the generate request schema is `extra="forbid"` so client-supplied probability/model/xai metadata is rejected (422). Don't relax `extra="forbid"`.

## FORBIDDEN_TERMS is substring-based — negative disclaimers pass by accident

**Rule:** the safety dose/term filter matches contiguous substrings. The allowed negative disclaimer "Ne modifiez jamais votre traitement sans avis médical" passes specifically because the inserted "jamais" breaks the forbidden contiguous substring "modifiez votre traitement". An instruction "Modifiez votre traitement" is correctly blocked.

**Why:** this is fragile — reword the disclaimer and you can silently trip (or evade) the filter. Keep a regression test asserting the negative disclaimer passes AND the bare instruction is blocked.

**How to apply:** if you change disclaimer wording or FORBIDDEN_TERMS, re-verify both cases; don't assume semantic intent — the filter is purely lexical.
