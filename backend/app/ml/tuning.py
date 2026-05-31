"""Réglage d'hyperparamètres XGBoost — Optuna OPTIONNEL, fallback config fixe.

Optuna n'est pas installable dans cet environnement (résolution de dépendances).
Conformément à la spec Phase 2, on fournit la STRUCTURE de tuning et un FALLBACK
déterministe à configuration fixe, et on DOCUMENTE la limite (pas de faux tuning).
Si Optuna devient disponible, `tune_xgboost` lance une vraie étude.
"""
from __future__ import annotations

import numpy as np

from app.ml import config

try:
    import optuna

    HAS_OPTUNA = True
except Exception:  # pragma: no cover - dépend de l'environnement
    optuna = None  # type: ignore
    HAS_OPTUNA = False

# Configuration fixe « raisonnable » utilisée quand Optuna est indisponible.
FIXED_XGB_PARAMS: dict = {
    "n_estimators": 300,
    "max_depth": 4,
    "learning_rate": 0.05,
    "subsample": 0.9,
    "colsample_bytree": 0.9,
    "reg_lambda": 1.0,
}


def _cv_auc(X, y, params, *, n_splits: int = 3) -> float:
    """AUROC moyenne en validation croisée temporelle simple (sans fuite)."""
    from sklearn.metrics import roc_auc_score
    from xgboost import XGBClassifier

    X = np.asarray(X, dtype=float)
    y = np.asarray(y, dtype=int)
    n = len(y)
    fold = n // (n_splits + 1)
    if fold < 5:
        return float("nan")
    scores = []
    for k in range(1, n_splits + 1):
        tr_end = fold * k
        va_end = fold * (k + 1)
        Xtr, ytr = X[:tr_end], y[:tr_end]
        Xva, yva = X[tr_end:va_end], y[tr_end:va_end]
        if len(np.unique(ytr)) < 2 or len(np.unique(yva)) < 2:
            continue
        clf = XGBClassifier(
            objective="binary:logistic", eval_metric="logloss",
            tree_method="hist", random_state=config.RANDOM_SEED, **params,
        )
        clf.fit(Xtr, ytr)
        scores.append(roc_auc_score(yva, clf.predict_proba(Xva)[:, 1]))
    return float(np.mean(scores)) if scores else float("nan")


def tune_xgboost(X, y, *, n_trials: int = 30) -> dict:
    """Retourne les meilleurs hyperparamètres.

    - Optuna disponible : vraie recherche bayésienne maximisant l'AUROC CV.
    - Sinon : `FIXED_XGB_PARAMS` (fallback documenté, déterministe).
    """
    if not HAS_OPTUNA:
        return dict(FIXED_XGB_PARAMS)

    def objective(trial):  # pragma: no cover - exécuté seulement si optuna présent
        params = {
            "n_estimators": trial.suggest_int("n_estimators", 100, 500, step=50),
            "max_depth": trial.suggest_int("max_depth", 2, 6),
            "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.2, log=True),
            "subsample": trial.suggest_float("subsample", 0.6, 1.0),
            "colsample_bytree": trial.suggest_float("colsample_bytree", 0.6, 1.0),
            "reg_lambda": trial.suggest_float("reg_lambda", 0.1, 5.0, log=True),
        }
        score = _cv_auc(X, y, params)
        return -1.0 if np.isnan(score) else score

    study = optuna.create_study(direction="maximize")  # pragma: no cover
    study.optimize(objective, n_trials=n_trials)  # pragma: no cover
    return study.best_params  # pragma: no cover
