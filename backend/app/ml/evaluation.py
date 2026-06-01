"""Évaluation honnête — AUCUNE métrique inventée.

Toute métrique non calculable (ex. AUROC quand une seule classe est présente
dans le jeu de test) renvoie `None` et une note explicative, jamais une valeur
factice. Les métriques à seuil sont rapportées au seuil de décision donné
(0.5 par défaut) qui est explicitement documenté dans la sortie.
"""
from __future__ import annotations

import numpy as np
from sklearn.metrics import (
    average_precision_score,
    brier_score_loss,
    confusion_matrix,
    roc_auc_score,
)

from app.ml import config


def expected_calibration_error(y_true, y_prob, *, n_bins: int = 10) -> float | None:
    """ECE par binning d'équal-largeur sur [0,1]. None si vide."""
    y_true = np.asarray(y_true, dtype=float)
    y_prob = np.asarray(y_prob, dtype=float)
    if y_true.size == 0:
        return None
    bins = np.linspace(0.0, 1.0, n_bins + 1)
    idx = np.digitize(y_prob, bins[1:-1], right=False)
    ece = 0.0
    n = y_true.size
    for b in range(n_bins):
        mask = idx == b
        if not mask.any():
            continue
        conf = y_prob[mask].mean()
        acc = y_true[mask].mean()
        ece += (mask.sum() / n) * abs(acc - conf)
    return float(ece)


def evaluate(
    y_true,
    y_prob,
    *,
    target: str,
    horizon_min: int,
    threshold: float = 0.5,
) -> dict:
    """Calcule le rapport de métriques pour un vecteur de probabilités.

    Renvoie un dict sérialisable. Les champs non calculables valent None et la
    raison est ajoutée à `notes`.
    """
    y_true = np.asarray(y_true, dtype=int)
    y_prob = np.asarray(y_prob, dtype=float)
    n = int(y_true.size)
    pos = int((y_true == 1).sum())
    neg = int((y_true == 0).sum())
    notes: list[str] = [f"seuil de décision = {threshold}"]

    report: dict = {
        "target": target,
        "horizon_min": horizon_min,
        "n": n,
        "positives": pos,
        "negatives": neg,
        "auroc": None,
        "auprc": None,
        "precision": None,
        "recall": None,
        "f1": None,
        "specificity": None,
        "sensitivity": None,
        "brier": None,
        "ece": None,
        "notes": notes,
    }

    if n == 0:
        notes.append("jeu vide : aucune métrique calculable.")
        return report

    # Métriques de ranking : nécessitent les deux classes.
    if pos > 0 and neg > 0:
        report["auroc"] = float(roc_auc_score(y_true, y_prob))
        report["auprc"] = float(average_precision_score(y_true, y_prob))
    else:
        notes.append(
            "AUROC/AUPRC non calculables : une seule classe présente dans le jeu de test."
        )

    # Brier + ECE : calculables tant qu'il y a des points.
    report["brier"] = float(brier_score_loss(y_true, y_prob))
    report["ece"] = expected_calibration_error(y_true, y_prob)

    # Métriques à seuil.
    y_pred = (y_prob >= threshold).astype(int)
    cm = confusion_matrix(y_true, y_pred, labels=[0, 1])
    tn, fp, fn, tp = int(cm[0, 0]), int(cm[0, 1]), int(cm[1, 0]), int(cm[1, 1])
    report["confusion"] = {"tn": tn, "fp": fp, "fn": fn, "tp": tp}

    if tp + fp > 0:
        report["precision"] = tp / (tp + fp)
    else:
        notes.append("précision non calculable : aucun positif prédit au seuil.")
    if tp + fn > 0:
        report["recall"] = tp / (tp + fn)
        report["sensitivity"] = report["recall"]
    else:
        notes.append("rappel/sensibilité non calculables : aucun positif réel.")
    if tn + fp > 0:
        report["specificity"] = tn / (tn + fp)
    else:
        notes.append("spécificité non calculable : aucun négatif réel.")
    p, r = report["precision"], report["recall"]
    if p is not None and r is not None and (p + r) > 0:
        report["f1"] = 2 * p * r / (p + r)

    return report


def evaluation_status(test_metrics: dict, *, min_positives: int = config.MIN_TEST_POSITIVES) -> str:
    """Statut d'évaluation scientifique d'un couple à partir des métriques de TEST.

    - `not_evaluable_mono_class_test` : 0 positif OU 0 négatif (AUROC/AUPRC null) ;
    - `insufficient_test_positives`   : évaluable mais < `min_positives` positifs ;
    - `evaluated`                     : au moins `min_positives` positifs ET des négatifs.
    Aucune métrique inventée : ce statut ne fait que QUALIFIER la mesure réelle.
    """
    pos = int(test_metrics.get("positives", 0))
    neg = int(test_metrics.get("negatives", 0))
    if pos == 0 or neg == 0:
        return config.EVAL_STATUS_MONO_CLASS
    if pos < min_positives:
        return config.EVAL_STATUS_INSUFFICIENT
    return config.EVAL_STATUS_EVALUATED


def _f1_from(y_true: np.ndarray, y_pred: np.ndarray) -> float | None:
    cm = confusion_matrix(y_true, y_pred, labels=[0, 1])
    tn, fp, fn, tp = int(cm[0, 0]), int(cm[0, 1]), int(cm[1, 0]), int(cm[1, 1])
    if tp + fp == 0 or tp + fn == 0:
        return None
    prec = tp / (tp + fp)
    rec = tp / (tp + fn)
    if prec + rec == 0:
        return None
    return 2 * prec * rec / (prec + rec)


def bootstrap_metrics(
    y_true,
    y_prob,
    *,
    n_boot: int = 200,
    threshold: float = 0.5,
    seed: int = config.RANDOM_SEED,
    ci: float = 0.95,
) -> dict:
    """Intervalles d'incertitude par bootstrap (rééchantillonnage avec remise du TEST).

    Renvoie pour AUROC/AUPRC/F1/Brier un dict {mean, lo, hi, n_valid} calculé sur
    les rééchantillons où la métrique est définie (deux classes pour AUROC/AUPRC/F1).
    AUCUNE valeur inventée : si une métrique n'est jamais définie, ses bornes sont None.
    """
    y_true = np.asarray(y_true, dtype=int)
    y_prob = np.asarray(y_prob, dtype=float)
    n = int(y_true.size)
    out: dict = {
        "n_boot": int(n_boot),
        "ci": ci,
        "method": "bootstrap percentile (rééchantillonnage du test avec remise)",
    }
    if n == 0:
        out["note"] = "test vide : bootstrap impossible."
        return out

    rng = np.random.default_rng(seed)
    collect: dict[str, list[float]] = {"auroc": [], "auprc": [], "f1": [], "brier": []}
    for _ in range(n_boot):
        idx = rng.integers(0, n, n)
        yt, yp = y_true[idx], y_prob[idx]
        collect["brier"].append(float(brier_score_loss(yt, yp)))
        if (yt == 1).any() and (yt == 0).any():
            collect["auroc"].append(float(roc_auc_score(yt, yp)))
            collect["auprc"].append(float(average_precision_score(yt, yp)))
            f1 = _f1_from(yt, (yp >= threshold).astype(int))
            if f1 is not None:
                collect["f1"].append(f1)

    lo_q = (1.0 - ci) / 2.0
    hi_q = 1.0 - lo_q
    for name, vals in collect.items():
        if vals:
            arr = np.asarray(vals, dtype=float)
            out[name] = {
                "mean": float(arr.mean()),
                "lo": float(np.quantile(arr, lo_q)),
                "hi": float(np.quantile(arr, hi_q)),
                "n_valid": int(arr.size),
            }
        else:
            out[name] = {"mean": None, "lo": None, "hi": None, "n_valid": 0}
    return out
