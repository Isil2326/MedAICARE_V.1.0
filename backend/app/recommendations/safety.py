"""Couche de SÉCURITÉ sémantique : bloque toute formulation prescriptive.

Une recommandation qui contient un terme interdit (dose, instruction de
traitement, injonction) est REJETÉE avant persistance : audit
`recommendation.safety_blocked`, jamais affichée. Cette couche est un garde-fou
défensif — les templates sont déjà non prescriptifs par construction.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

from app.recommendations.schemas import GeneratedRecommendation, RecommendationCategory

# Termes interdits (sous-chaînes, comparaison en minuscules). Open-loop strict.
FORBIDDEN_TERMS: tuple[str, ...] = (
    "injectez",
    "injecter",
    "augmentez la dose",
    "augmentez votre dose",
    "diminuez la dose",
    "diminuez votre dose",
    "ajustez la dose",
    "ajustez votre dose",
    "changez la dose",
    "changez votre dose",
    "modifiez votre traitement",
    "modifiez le traitement",
    "modifiez votre basal",
    "modifiez votre bolus",
    "arrêtez le traitement",
    "arrêtez votre traitement",
    "commencez le traitement",
    "prescription",
    "prescrivez",
    "traitement recommandé",
    "vous devez prendre",
    "prenez tel traitement",
    "administrez",
    "bolus de",
    "unités d'insuline",
)

# Motif de DOSE chiffrée (« 4 unités », « 2 UI », « 6 u », « 3 u.i. »).
_DOSE_RE = re.compile(
    r"\b\d+(?:[.,]\d+)?\s*(?:unit[ée]s?|u\.?i\.?|u)\b",
    flags=re.IGNORECASE,
)


@dataclass
class SafetyResult:
    passed: bool
    violations: list[str] = field(default_factory=list)


def find_forbidden_terms(text: str | None) -> list[str]:
    if not text:
        return []
    low = text.lower()
    return [t for t in FORBIDDEN_TERMS if t in low]


def contains_dose(text: str | None) -> bool:
    if not text:
        return False
    return bool(_DOSE_RE.search(text))


def check_message(text: str | None) -> list[str]:
    """Retourne la liste des violations détectées dans un message libre."""
    violations: list[str] = []
    for term in find_forbidden_terms(text):
        violations.append(f"terme_interdit:{term}")
    if contains_dose(text):
        violations.append("dose_chiffrée_detectee")
    return violations


_VALID_CATEGORIES = {c.value for c in RecommendationCategory}


def validate(reco: GeneratedRecommendation) -> SafetyResult:
    """Valide une recommandation candidate AVANT persistance (open-loop strict)."""
    violations: list[str] = []

    for label, msg in (("patient", reco.message_patient), ("clinician", reco.message_clinician)):
        for v in check_message(msg):
            violations.append(f"{label}:{v}")

    if not reco.open_loop_notice:
        violations.append("open_loop_notice_manquante")
    if not reco.is_synthetic:
        violations.append("is_synthetic_false_interdit")
    if not reco.rule_id:
        violations.append("rule_id_manquant")
    if not reco.rationale:
        violations.append("rationale_manquante")
    if reco.category.value not in _VALID_CATEGORIES:
        violations.append("categorie_invalide")

    # XAI non fiable : interdiction de l'utiliser comme justification clinique.
    if reco.xai_reliability_status == "not_reliable_for_clinical_interpretation":
        xai_block = (reco.rationale or {}).get("xai", {})
        if xai_block.get("used_as_clinical_justification") is True:
            violations.append("xai_non_fiable_utilisee_comme_justification")

    return SafetyResult(passed=not violations, violations=violations)
