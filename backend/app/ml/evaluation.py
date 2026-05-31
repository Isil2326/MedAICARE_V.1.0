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
