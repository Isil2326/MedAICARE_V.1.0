"""Sécurisation sémantique des explications XAI (Phase 3.1) — module PUR.

Objectif : qualifier la FIABILITÉ sémantique d'une explication afin qu'elle reste
une aide de COMPRÉHENSION DU MODÈLE, jamais une justification thérapeutique. Ce
module n'invente aucune métrique : il consomme des signaux déjà calculés ailleurs
(congruence physiologique heuristique, stabilité, repli de méthode, etc.) et en
dérive un statut + des avertissements EXPLICITES. Les warnings ne sont JAMAIS
masqués. Aucune décision, aucune dose, aucune recommandation : open-loop strict.

XAI is display/support only, not a decision engine.
"""
from __future__ import annotations

from typing import Literal

ReliabilityStatus = Literal[
    "reliable_for_model_debug",
    "caution_semantic_limits",
    "not_reliable_for_clinical_interpretation",
]

# Ordre d'escalade (croissant en sévérité) : on ne « rétrograde » jamais.
_ORDER: dict[str, int] = {
    "reliable_for_model_debug": 0,
    "caution_semantic_limits": 1,
    "not_reliable_for_clinical_interpretation": 2,
}

# Seuils minimaux proposés par l'amendement Phase 3.1.
PHYSIO_CONGRUENCE_MIN = 0.5  # < 0.5 → prudence sémantique
STABILITY_MIN = 0.5  # LIME peu stable → avertissement

# Notices systématiques (réutilisées dans les réponses locale ET globale).
CALIBRATION_NOTICE = (
    "L'attribution explique le modèle NON calibré (predict_proba interne), alors "
    "que la probabilité affichée est la probabilité CALIBRÉE du bundle. Les "
    "contributions ne portent donc pas sur la probabilité affichée."
)
SYNTHETIC_DATA_NOTICE = (
    "Explication calculée sur données 100 % synthétiques (is_synthetic=True). "
    "Aucune validité clinique ; résultats non transférables à des patients réels."
)
DIRECTION_SEMANTICS = (
    "Une direction globale n'est PAS une relation médicale monotone. SHAP : "
    "contribution moyenne signée au score du modèle (aggregated_signed_effect). "
    "EBM : effet dépendant de la valeur, non globalisable — interpréter localement."
)
DECISION_GUARDRAIL = (
    "XAI is display/support only, not a decision engine. Une explication ne décide "
    "pas, ne détermine aucune recommandation, ne justifie aucune dose ; elle peut "
    "seulement accompagner une prédiction open-loop pour affichage ou audit."
)

# Limites sémantiques toujours rappelées (non masquables).
BASE_SEMANTIC_LIMITATIONS: tuple[str, ...] = (
    "XAI décrit le comportement du modèle, pas une cause médicale.",
    "Ne pas utiliser pour ajuster un traitement.",
    DECISION_GUARDRAIL,
)

# Directions globales considérées « non interprétables comme vérité simple ».
NON_GLOBALIZABLE_DIRECTIONS = {
    "indéterminé",
    "not_globalizable",
    "context_dependent",
    "local_only",
    "aggregated_signed_effect",
}


def _escalate(current: str, target: str) -> str:
    return current if _ORDER[current] >= _ORDER[target] else target


def assess(
    *,
    synthetic_only: bool = True,
    explains: str | None = "modèle non calibré",
    method_fallback: bool = False,
    xai_method: str | None = None,
    has_indeterminate_direction: bool = False,
    physio_congruence: float | None = None,
    stability: float | None = None,
    scenario_incoherent: bool = False,
    extra_limitations: tuple[str, ...] | list[str] = (),
) -> dict:
    """Qualifie la fiabilité sémantique d'une explication (locale ou globale).

    Renvoie ``{xai_reliability_status, xai_warnings, semantic_limitations}``.
    Tout signal de doute REMONTE un warning explicite (jamais masqué) et, le cas
    échéant, escalade le statut. Aucune métrique n'est fabriquée : un signal absent
    (``None``) n'escalade pas.
    """
    warnings: list[str] = []
    status: str = "reliable_for_model_debug"

    # Données synthétiques → avertissement systématique (jamais masqué).
    if synthetic_only:
        warnings.append(SYNTHETIC_DATA_NOTICE)

    # Attribution sur modèle non calibré vs probabilité calibrée → systématique.
    if explains and "non calibré" in explains:
        warnings.append(CALIBRATION_NOTICE)

    # Repli de méthode (occlusion) → l'explication est approximative.
    if method_fallback:
        warnings.append(
            "Méthode de repli (occlusion) utilisée : attribution approximative, "
            "à réserver à l'analyse technique du modèle."
        )
        status = _escalate(status, "caution_semantic_limits")

    # Direction globale non interprétable comme relation causale.
    if has_indeterminate_direction:
        warnings.append(
            "La direction globale de certaines variables n'est pas interprétable "
            "comme une relation causale (non globalisable / effet agrégé signé)."
        )
        status = _escalate(status, "caution_semantic_limits")

    # LIME peu stable → attribution instable.
    if xai_method == "lime" and stability is not None and stability < STABILITY_MIN:
        warnings.append(
            f"Méthode LIME à faible stabilité (top-k Jaccard={stability:.3f} "
            f"< {STABILITY_MIN}) : attribution instable, interpréter avec prudence."
        )
        status = _escalate(status, "caution_semantic_limits")

    # Congruence physiologique heuristique faible (cas hypo 30 = 0.000 inclus).
    if physio_congruence is not None and physio_congruence < PHYSIO_CONGRUENCE_MIN:
        warnings.append(
            f"La congruence physiologique heuristique est faible "
            f"(={physio_congruence:.3f} < {PHYSIO_CONGRUENCE_MIN}) ; cette "
            "explication doit être utilisée uniquement pour analyse technique du "
            "modèle, pas pour interprétation clinique."
        )
        status = _escalate(status, "caution_semantic_limits")
        if physio_congruence == 0.0:
            status = _escalate(status, "not_reliable_for_clinical_interpretation")

    # Scénario canonique manifestement incohérent (contrôle de cohérence).
    if scenario_incoherent:
        warnings.append(
            "Sur un scénario synthétique canonique, l'explication n'a dégagé aucun "
            "facteur physiologiquement plausible : cohérence sémantique douteuse."
        )
        status = _escalate(status, "caution_semantic_limits")

    semantic_limitations = list(BASE_SEMANTIC_LIMITATIONS) + list(extra_limitations)
    return {
        "xai_reliability_status": status,
        "xai_warnings": warnings,
        "semantic_limitations": semantic_limitations,
    }
