"""CLI de démonstration : génère des suggestions open-loop sur le moteur PUR.

N'écrit RIEN en base : illustre, à partir de prédictions synthétiques fabriquées,
ce que le moteur produirait (catégorie, messages non prescriptifs, scores, trace).
Sert de documentation exécutable / de contrôle de cohérence — données simulées,
open-loop strict, aucune dose.

Usage : python -m app.recommendations.generate_demo
"""
from __future__ import annotations

import json

from app.recommendations import engine, safety

# Scénarios synthétiques (probabilités fabriquées : démonstration, non cliniques).
_SCENARIOS: tuple[dict, ...] = (
    {
        "label": "Hypo 30 min — risque élevé, XAI fiable",
        "prediction": {
            "target": "hypo", "horizon_min": 30, "probability": 0.82,
            "calculable": True, "model_name": "ebm_hypo_30", "model_version": "1.1.0",
            "calibrated": True,
        },
        "xai": {
            "calculable": True,
            "xai_reliability_status": "reliable_for_model_debug",
            "top_features": [
                {"feature": "cgm_slope_30", "contribution": -0.41, "direction": "augmente"},
                {"feature": "cgm_mean_60", "contribution": -0.22, "direction": "augmente"},
            ],
            "xai_warnings": [],
        },
    },
    {
        "label": "Hyper 60 min — risque modéré, XAI absente",
        "prediction": {
            "target": "hyper", "horizon_min": 60, "probability": 0.58,
            "calculable": True, "model_name": "xgb_hyper_60", "model_version": "1.1.0",
            "calibrated": False,
        },
        "xai": None,
    },
    {
        "label": "Hypo 60 min — risque, XAI NON fiable (renvoi clinique)",
        "prediction": {
            "target": "hypo", "horizon_min": 60, "probability": 0.66,
            "calculable": True, "model_name": "rf_hypo_60", "model_version": "1.1.0",
            "calibrated": False,
        },
        "xai": {
            "calculable": True,
            "xai_reliability_status": "not_reliable_for_clinical_interpretation",
            "top_features": [
                {"feature": "cgm_std_30", "contribution": 0.12, "direction": "indéterminé"},
            ],
            "xai_warnings": ["Congruence physiologique nulle."],
        },
    },
)


def main() -> None:
    print("=== Démonstration moteur de recommandation OPEN-LOOP (données simulées) ===\n")
    for sc in _SCENARIOS:
        print(f"--- {sc['label']} ---")
        cands = engine.generate_candidates(prediction=sc["prediction"], xai=sc["xai"])
        if not cands:
            print("  (aucune règle déclenchée)\n")
            continue
        for c in cands:
            res = safety.validate(c)
            status = "OK" if res.passed else f"BLOQUÉ {res.violations}"
            print(f"  [{c.category.value}] règle={c.rule_id} v{c.rule_version} · safety={status}")
            print(f"    patient   : {c.message_patient}")
            print(f"    clinicien : {c.message_clinician}")
            print(f"    scores    : {json.dumps(c.actionability.as_dict(), ensure_ascii=False)}")
        print()
    print("Rappel : suggestions 'pending' fictives — validation clinicien obligatoire, "
          "aucune dose, non certifié, données 100 % synthétiques.")


if __name__ == "__main__":
    main()
