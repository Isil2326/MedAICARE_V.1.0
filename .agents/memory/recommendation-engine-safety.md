---
name: Recommendation engine safety (open-loop)
description: Open-loop recommendation safety must cover EVERY persistence path, not just generation.
---

# Recommendation engine — safety on all write paths

**Rule:** the safety layer (`backend/app/recommendations/safety.py` — FORBIDDEN_TERMS + numeric-dose regex) must run on **every** path that writes free-text into a recommendation, not only at generation time. The clinician `modify` path was the gap: it edited the free-text `message` without re-validating, letting prescriptive/dose wording bypass safety after generation.

**Why:** open-loop strict forbids any dose/decision wording reaching a stored/displayed suggestion. Validating only the generation path leaves edit/override paths as a bypass — an architect review flagged this as a critical violation.

**How to apply:** any new endpoint or service that mutates recommendation text (modify, override, bulk-edit, import) must call `safety.check_message(...)` on both the message and any free-text note, reject on violation (HTTP 400), and emit `recommendation.safety_blocked` audit before refusing. Add a regression test that feeds a forbidden term AND a numeric dose to each such path.
