"""Orchestrateur XAI (Phase 3) : cache + calcul local/global + persistance optionnelle.

La RBAC, l'audit et le `commit` sont gérés par la couche API (parité avec `ml.py`).
Ce service reste pur côté logique : il calcule l'explication, sert le cache, et
prépare la persistance (sans committer). Open-loop strict, données synthétiques.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy.orm import Session

from app.ml import config
from app.repositories import xai_repo
from app.xai import cache, global_explanations, local_explanations, utils


def explain_local(
    db: Session,
    *,
    patient_id: uuid.UUID,
    target: str,
    horizon_min: int,
    at: datetime | None = None,
    method: str = "auto",
    audience: str = "clinician",
    top_k: int = 6,
    persist: bool = False,
    use_cache: bool = True,
) -> dict:
    """Explication locale (open-loop). Sert le cache, calcule, persiste si demandé."""
    model, entry = utils.load_active_model(target, horizon_min)
    model_id = (entry or {}).get("artifact_path", "none")

    # Contexte de features construit UNE fois : sert au hash de cache ET au calcul
    # (passé à local_explanations pour éviter un double calcul).
    ctx = utils.build_feature_context(db, patient_id=patient_id, at=at)

    # Cache content-addressé : la clé inclut un vrai hash des features au point T.
    # On ne cache que pour un `at` explicite (une explication « maintenant » varie).
    cache_key = None
    if use_cache and at is not None:
        feats_hash = cache.features_hash(ctx.row) if getattr(ctx, "row", None) else "noctx"
        cache_key = cache.make_key(
            model_id=model_id, patient_id=str(patient_id), target=target,
            horizon_min=horizon_min, at=ctx.at.isoformat(), method=method,
            audience=audience, feats_hash=feats_hash,
        )
        cached = cache.get(cache_key)
        if cached is not None:
            out = dict(cached)
            out["cached"] = True
            out["explanation_id"] = None
            # `persist=True` doit écrire même sur un hit de cache (traçabilité).
            if persist and out.get("calculable"):
                row = xai_repo.create_from_result(db, out)
                out["explanation_id"] = row.id
            return out

    result = local_explanations.explain_local(
        db, patient_id=patient_id, target=target, horizon_min=horizon_min,
        at=at, method=method, audience=audience, top_k=top_k, ctx=ctx,
    )
    # La proba affichée provient du bundle (calibrée si calibrateur présent) ;
    # l'attribution explique le modèle (non calibré) — voir `result["explains"]`.
    result["calibrated"] = utils.is_calibrated(model) if model is not None else False
    result["cached"] = False
    result["explanation_id"] = None

    if cache_key is not None:
        to_cache = dict(result)
        to_cache["explanation_id"] = None  # ne pas mémoriser l'id de persistance
        cache.set(cache_key, to_cache)

    if persist and result.get("calculable"):
        row = xai_repo.create_from_result(db, result)
        result["explanation_id"] = row.id

    return result


def get_global(
    db: Session, *, target: str, horizon_min: int, regenerate: bool = False
) -> dict:
    """Explication globale d'un couple actif. Lit l'artefact JSON sinon le calcule."""
    if target not in config.TARGETS:
        raise ValueError(f"Cible inconnue : {target!r}.")
    if horizon_min not in config.HORIZONS_MIN:
        raise ValueError(f"Horizon invalide : {horizon_min!r}.")
    if not regenerate:
        cached = global_explanations.load_artifact(target, horizon_min)
        if cached is not None:
            return cached
    payload = global_explanations.compute_global(db, target=target, horizon_min=horizon_min)
    global_explanations.write_artifact(payload)
    serializable = dict(payload)
    serializable["generated_at"] = payload["generated_at"].isoformat()
    return serializable
