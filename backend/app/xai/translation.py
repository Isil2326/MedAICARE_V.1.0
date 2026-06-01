"""Traduction des contributions XAI en texte — DEUX audiences distinctes :

- patient : langage simple, factuel, rassurant, JAMAIS prescriptif ;
- clinicien : technique, nomme la méthode et l'espace expliqué (log-odds / proba).

Garde-fous open-loop : aucune formulation prescriptive ni causale n'est générée.
Le texte décrit ce que « le modèle a pondéré », jamais « la cause est » ni une dose.
Une liste de termes interdits (`FORBIDDEN_TERMS`) est testée explicitement.
"""
from __future__ import annotations

from app.xai.schemas import OPEN_LOOP_NOTICE

# Termes JAMAIS produits par la traduction (causalité / prescription / dose).
FORBIDDEN_TERMS = (
    "la cause est",
    "causé par",
    "à cause de",
    "vous devez",
    "il faut injecter",
    "injectez",
    "augmentez votre dose",
    "réduisez votre dose",
    "traitement recommandé",
    "nous recommandons",
    "prescription",
    "posologie",
    "unités d'insuline",
    "administrer",
)

# Libellés lisibles des 18 features (descriptifs, neutres, sans causalité).
FEATURE_LABELS: dict[str, str] = {
    "cgm_mean_30": "glycémie moyenne (30 min)",
    "cgm_mean_60": "glycémie moyenne (60 min)",
    "cgm_std_30": "variabilité de la glycémie (30 min)",
    "cgm_slope_30": "tendance de la glycémie (30 min)",
    "cgm_dg_dt": "vitesse de variation de la glycémie",
    "cgm_delta_15": "variation de glycémie sur 15 min",
    "cgm_delta_30": "variation de glycémie sur 30 min",
    "cgm_delta_60": "variation de glycémie sur 60 min",
    "tir_60": "temps dans la cible (60 min)",
    "minutes_since_meal": "temps écoulé depuis le dernier repas",
    "minutes_since_insulin": "temps écoulé depuis la dernière insuline",
    "post_prandial": "période après repas",
    "post_insulin": "période après insuline",
    "hour_of_day": "heure de la journée",
    "day_of_week": "jour de la semaine",
    "is_night": "période nocturne",
    "cgm_count_60": "nombre de mesures CGM (60 min)",
    "cgm_gap_60": "présence d'un trou de mesure CGM (60 min)",
}

_TARGET_LABEL = {"hypo": "hypoglycémie", "hyper": "hyperglycémie"}


def feature_label(feature: str) -> str:
    return FEATURE_LABELS.get(feature, feature)


def _dir_word(direction: str, audience: str) -> str:
    if audience == "patient":
        return {"augmente": "pèse vers", "diminue": "pèse contre", "neutre": "influence peu"}.get(
            direction, "influence"
        )
    return {"augmente": "augmente le score", "diminue": "diminue le score", "neutre": "effet ~neutre"}.get(
        direction, "contribution indéterminée"
    )


def build_patient_text(
    *, target: str, horizon_min: int, probability: float | None, risk_label: str,
    top_features: list[dict], calculable: bool, reason: str | None,
) -> str:
    tlabel = _TARGET_LABEL.get(target, target)
    if not calculable:
        return (
            f"Estimation indisponible pour le risque de {tlabel} à {horizon_min} min : "
            f"{reason or 'données insuffisantes'}. "
            "Cet outil est informatif et ne remplace pas votre soignant."
        )
    pct = f"{round(probability * 100)} %" if probability is not None else "non chiffrable"
    lead = (
        f"Estimation indicative du risque de {tlabel} dans les {horizon_min} prochaines minutes : "
        f"niveau {risk_label} ({pct})."
    )
    drivers = [f for f in top_features if f.get("direction") in ("augmente", "diminue")][:3]
    if drivers:
        parts = []
        for f in drivers:
            parts.append(f"{feature_label(f['feature'])} ({_dir_word(f['direction'], 'patient')} ce risque)")
        body = " Éléments que le modèle a le plus pris en compte : " + " ; ".join(parts) + "."
    else:
        body = " Le modèle n'a pas dégagé de facteur dominant pour ce point."
    tail = (
        " Ces éléments décrivent ce que le modèle a observé, pas une cause médicale. "
        "Parlez-en à votre soignant ; cet outil ne propose aucun traitement."
    )
    return lead + body + tail


def build_clinician_text(
    *, target: str, horizon_min: int, probability: float | None, risk_label: str,
    top_features: list[dict], method: str, explains: str, calculable: bool,
    reason: str | None, fallback: bool,
) -> str:
    tlabel = _TARGET_LABEL.get(target, target)
    if not calculable:
        return (
            f"Risque {tlabel} {horizon_min} min : non calculable ({reason or 'features indisponibles'}). "
            "Aucune extrapolation."
        )
    pct = f"{probability:.3f}" if probability is not None else "n/a"
    method_note = f"méthode={method}" + (" (repli documenté)" if fallback else "")
    lead = (
        f"Risque {tlabel} {horizon_min} min : p={pct} (niveau {risk_label}). "
        f"Attribution locale [{method_note}, cible expliquée : {explains}]."
    )
    rows = []
    for f in top_features[:6]:
        contrib = f.get("contribution")
        val = f.get("value")
        cstr = f"{contrib:+.4f}" if contrib is not None else "n/a"
        vstr = f"{val:.3f}" if isinstance(val, (int, float)) else "n/a"
        rows.append(f"{f['feature']}={vstr} → {cstr} ({_dir_word(f.get('direction',''), 'clinician')})")
    body = " Contributions : " + " | ".join(rows) + "." if rows else " Aucune contribution exploitable."
    tail = (
        " Importance statistique de pondération du modèle (≠ causalité physiologique). "
        "Données synthétiques. Open-loop : aucune dose, aucune décision automatique."
    )
    return lead + body + tail


def open_loop_notice() -> str:
    return OPEN_LOOP_NOTICE
