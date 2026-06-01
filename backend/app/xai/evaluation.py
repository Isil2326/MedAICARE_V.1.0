"""Évaluation des explications XAI (Phase 3) — métriques RÉELLES, jamais inventées.

Toutes les métriques sont calculées sur un sous-échantillon du dataset SYNTHÉTIQUE.
Une valeur non calculable est renvoyée `None` (aucune fabrication). Ces métriques
mesurent la qualité TECHNIQUE des explications (fidélité, stabilité, accord,
congruence directionnelle attendue), PAS une validité clinique — qui exigerait une
étude humaine sur données réelles, hors périmètre (open-loop, prototype).
"""
from __future__ import annotations

import numpy as np
from sqlalchemy.orm import Session

from app.ml import config, dataset_builder
from app.xai import ebm_explainer, lime_explainer, shap_explainer, utils


def _sample_rows(db: Session, *, n: int, seed: int = config.RANDOM_SEED) -> np.ndarray:
    bg = utils.background_matrix(db, max_rows=10_000)
    if bg.shape[0] == 0:
        return bg
    rng = np.random.default_rng(seed)
    n = min(n, bg.shape[0])
    idx = rng.choice(bg.shape[0], size=n, replace=False)
    return bg[idx]


def _explain_row(method: str, model, entry, x_row: np.ndarray, db: Session) -> dict:
    import pandas as pd

    X = pd.DataFrame([x_row], columns=list(config.FEATURE_COLUMNS))
    if method == "native":
        return ebm_explainer.explain_local(model, entry, X, db)
    if method == "lime":
        return lime_explainer.explain_local(model, entry, X, db)
    return shap_explainer.explain_local(model, entry, X, db)


def _top_set(contribs: np.ndarray, k: int) -> set[int]:
    if contribs is None:
        return set()
    return set(np.argsort(-np.abs(contribs))[:k].tolist())


def _jaccard(a: set, b: set) -> float | None:
    if not a and not b:
        return None
    union = a | b
    return len(a & b) / len(union) if union else None


def stability(db: Session, *, target: str, horizon_min: int, method: str,
              n_samples: int = 15, n_perturb: int = 5, k: int = 5,
              noise: float = 0.02) -> dict:
    """Stabilité : recoupement top-k des contributions sous petites perturbations."""
    model, entry = utils.load_active_model(target, horizon_min)
    rows = _sample_rows(db, n=n_samples)
    if model is None or rows.shape[0] == 0:
        return {"metric": "stability_topk_jaccard", "value": None,
                "n": 0, "reason": "Modèle ou échantillon indisponible."}
    inner = utils.unwrap(model)
    if getattr(inner, "_single_class", None) is not None:
        return {"metric": "stability_topk_jaccard", "value": None, "n": 0,
                "reason": "Modèle mono-classe (pas de contribution)."}
    bg = utils.background_matrix(db)
    std = np.nanstd(bg, axis=0)
    std = np.where((std == 0) | np.isnan(std), 1.0, std)
    rng = np.random.default_rng(config.RANDOM_SEED)
    overlaps: list[float] = []
    for row in rows:
        base = _explain_row(method, model, entry, row, db).get("contributions")
        base_set = _top_set(base, k)
        for _ in range(n_perturb):
            pert = row + rng.normal(0.0, noise, size=row.shape) * std
            c = _explain_row(method, model, entry, pert, db).get("contributions")
            j = _jaccard(base_set, _top_set(c, k))
            if j is not None:
                overlaps.append(j)
    val = float(np.mean(overlaps)) if overlaps else None
    return {"metric": "stability_topk_jaccard", "value": val,
            "n": len(overlaps), "k": k, "method": method,
            "reason": None if val is not None else "Aucun recoupement calculable."}


def deletion_faithfulness(db: Session, *, target: str, horizon_min: int, method: str,
                          n_samples: int = 15, m: int = 3) -> dict:
    """Fidélité par ablation : retirer les top features doit déplacer la proba plus
    que retirer les features les moins importantes (Δp_top > Δp_bottom).
    """
    model, entry = utils.load_active_model(target, horizon_min)
    rows = _sample_rows(db, n=n_samples)
    if model is None or rows.shape[0] == 0:
        return {"metric": "deletion_delta", "value": None, "n": 0,
                "reason": "Modèle ou échantillon indisponible."}
    inner = utils.unwrap(model)
    if getattr(inner, "_single_class", None) is not None:
        return {"metric": "deletion_delta", "value": None, "n": 0,
                "reason": "Modèle mono-classe."}
    ref = utils.median_reference(db)
    d_top, d_bot, wins = [], [], 0
    n_used = 0
    for row in rows:
        contribs = _explain_row(method, model, entry, row, db).get("contributions")
        if contribs is None:
            continue
        order = np.argsort(-np.abs(contribs))
        top_idx, bot_idx = order[:m], order[-m:]
        p0 = float(np.asarray(inner.predict_proba(row.reshape(1, -1))).reshape(-1)[0])
        rt = row.copy(); rt[top_idx] = ref[top_idx]
        rb = row.copy(); rb[bot_idx] = ref[bot_idx]
        pt = float(np.asarray(inner.predict_proba(rt.reshape(1, -1))).reshape(-1)[0])
        pb = float(np.asarray(inner.predict_proba(rb.reshape(1, -1))).reshape(-1)[0])
        dt, dbm = abs(p0 - pt), abs(p0 - pb)
        d_top.append(dt); d_bot.append(dbm)
        wins += 1 if dt >= dbm else 0
        n_used += 1
    if n_used == 0:
        return {"metric": "deletion_delta", "value": None, "n": 0,
                "reason": "Aucune contribution exploitable."}
    return {
        "metric": "deletion_delta", "value": float(np.mean(d_top)),
        "delta_top_mean": float(np.mean(d_top)), "delta_bottom_mean": float(np.mean(d_bot)),
        "faithfulness_win_rate": wins / n_used, "n": n_used, "m": m, "method": method,
        "reason": None,
    }


def method_agreement(db: Session, *, target: str, horizon_min: int,
                     n_samples: int = 15, k: int = 5) -> dict:
    """Accord SHAP vs LIME (recoupement top-k). EBM : native vs LIME."""
    model, entry = utils.load_active_model(target, horizon_min)
    rows = _sample_rows(db, n=n_samples)
    if model is None or rows.shape[0] == 0:
        return {"metric": "agreement_topk_jaccard", "value": None, "n": 0,
                "reason": "Modèle ou échantillon indisponible."}
    primary = "native" if (entry or {}).get("model_name") == "ebm" else "shap"
    overlaps = []
    for row in rows:
        a = _explain_row(primary, model, entry, row, db).get("contributions")
        b = _explain_row("lime", model, entry, row, db).get("contributions")
        j = _jaccard(_top_set(a, k), _top_set(b, k))
        if j is not None:
            overlaps.append(j)
    val = float(np.mean(overlaps)) if overlaps else None
    return {"metric": "agreement_topk_jaccard", "value": val, "n": len(overlaps),
            "pair": f"{primary}_vs_lime", "k": k,
            "reason": None if val is not None else "Non calculable."}


def physiological_congruence(db: Session, *, target: str, horizon_min: int,
                            method: str, n_samples: int = 25) -> dict:
    """Congruence directionnelle ATTENDUE (heuristique, NON preuve clinique).

    Hyper : une glycémie moyenne élevée devrait contribuer POSITIVEMENT au score.
    Hypo : une glycémie moyenne basse et/ou une pente négative devraient contribuer
    positivement au risque. On mesure la fraction d'instances où le signe de la
    contribution de `cgm_mean_30` (resp. `cgm_slope_30` pour hypo) suit l'attendu,
    UNIQUEMENT sur les instances où la feature est nettement au-dessus/au-dessous de
    sa médiane. C'est un contrôle de cohérence du modèle, pas une validation médicale.
    """
    model, entry = utils.load_active_model(target, horizon_min)
    rows = _sample_rows(db, n=max(n_samples, 30))
    cols = list(config.FEATURE_COLUMNS)
    if model is None or rows.shape[0] == 0:
        return {"metric": "physio_congruence", "value": None, "n": 0,
                "reason": "Modèle ou échantillon indisponible."}
    inner = utils.unwrap(model)
    if getattr(inner, "_single_class", None) is not None:
        return {"metric": "physio_congruence", "value": None, "n": 0,
                "reason": "Modèle mono-classe."}
    ref = utils.median_reference(db)
    i_mean = cols.index("cgm_mean_30")
    i_slope = cols.index("cgm_slope_30")
    ok, total = 0, 0
    for row in rows:
        contribs = _explain_row(method, model, entry, row, db).get("contributions")
        if contribs is None:
            continue
        if target == "hyper":
            if row[i_mean] > ref[i_mean] * 1.05:
                total += 1
                ok += 1 if contribs[i_mean] > 0 else 0
        else:  # hypo
            if row[i_mean] < ref[i_mean] * 0.95:
                total += 1
                ok += 1 if contribs[i_mean] < 0 else 0
            elif row[i_slope] < ref[i_slope]:
                total += 1
                ok += 1 if contribs[i_slope] < 0 else 0
    val = (ok / total) if total > 0 else None
    return {"metric": "physio_congruence", "value": val, "n": total, "method": method,
            "note": "Heuristique de cohérence directionnelle, PAS une validation clinique.",
            "reason": None if val is not None else "Aucune instance éligible."}


def evaluate_couple(db: Session, *, target: str, horizon_min: int, method: str | None = None) -> dict:
    """Batterie complète d'évaluation XAI pour un couple actif."""
    _, entry = utils.load_active_model(target, horizon_min)
    if method is None:
        method = "native" if (entry or {}).get("model_name") == "ebm" else "shap"
    return {
        "target": target, "horizon_min": horizon_min,
        "model_name": (entry or {}).get("model_name"), "method": method,
        "synthetic_only": True,
        "stability": stability(db, target=target, horizon_min=horizon_min, method=method),
        "deletion": deletion_faithfulness(db, target=target, horizon_min=horizon_min, method=method),
        "agreement": method_agreement(db, target=target, horizon_min=horizon_min),
        "physio_congruence": physiological_congruence(db, target=target, horizon_min=horizon_min, method=method),
        "disclaimer": "Métriques techniques sur données synthétiques. Aucune validité clinique.",
    }
