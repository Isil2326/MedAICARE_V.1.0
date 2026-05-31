"""Modèles de risque (open-loop) — sortie = probabilité, jamais une décision.

Registre des fabriques de modèles disponibles dans cet environnement. EBM n'est
exposé que si `interpret` est installé (sinon ignoré proprement, pas de faux).
"""
from __future__ import annotations

from app.ml.models.base import BaseRiskModel
from app.ml.models.rules_baseline import ExpertRulesModel
from app.ml.models.sklearn_models import LogRegModel, RandomForestModel
from app.ml.models.xgb_model import XGBoostModel
from app.ml.models.ebm_model import EBM_AVAILABLE, ExplainableBoostingModel

# Fabriques par clé d'algorithme. EBM ajouté conditionnellement.
MODEL_FACTORIES: dict[str, type[BaseRiskModel]] = {
    "expert_rules": ExpertRulesModel,
    "logreg": LogRegModel,
    "random_forest": RandomForestModel,
    "xgboost": XGBoostModel,
}
if EBM_AVAILABLE:
    MODEL_FACTORIES["ebm"] = ExplainableBoostingModel

__all__ = [
    "BaseRiskModel",
    "ExpertRulesModel",
    "LogRegModel",
    "RandomForestModel",
    "XGBoostModel",
    "ExplainableBoostingModel",
    "EBM_AVAILABLE",
    "MODEL_FACTORIES",
]
