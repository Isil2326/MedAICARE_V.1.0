"""Registre de modèles — JSON canonique (+ miroir DB optionnel).

Source de vérité côté fichiers : `artifacts/registry.json` (utilisable sans
session DB, ex. CLI/inférence). Un seul modèle ACTIF par couple (target, horizon).
Si une session DB est fournie, l'entrée est aussi reflétée dans `model_registry`
(traçabilité/requêtage), mais le JSON reste la référence pour charger l'artefact.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone

from app.ml import config


def _read_json() -> list[dict]:
    if not config.REGISTRY_JSON.exists():
        return []
    try:
        data = json.loads(config.REGISTRY_JSON.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []
    return data.get("models", []) if isinstance(data, dict) else []


def _write_json(entries: list[dict]) -> None:
    config.ensure_dirs()
    payload = {"version": 1, "models": entries}
    config.REGISTRY_JSON.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False, default=str), encoding="utf-8"
    )


def list_entries() -> list[dict]:
    return _read_json()


def get_active(target: str, horizon_min: int) -> dict | None:
    """Dernière entrée active pour (target, horizon) selon le JSON canonique."""
    candidates = [
        e for e in _read_json()
        if e.get("target") == target
        and int(e.get("horizon_min", -1)) == horizon_min
        and e.get("is_active", False)
    ]
    if not candidates:
        return None
    return sorted(candidates, key=lambda e: e.get("created_at", ""), reverse=True)[0]


def register(entry: dict, *, db=None, set_active: bool = True) -> dict:
    """Enregistre une entrée. Désactive les autres du même couple si `set_active`.

    Met à jour le JSON canonique puis, si `db` fourni, reflète dans la table DB.
    """
    entry = dict(entry)
    entry.setdefault("created_at", datetime.now(timezone.utc).isoformat())
    entry["is_active"] = bool(set_active)

    entries = _read_json()
    if set_active:
        for e in entries:
            if (
                e.get("target") == entry["target"]
                and int(e.get("horizon_min", -1)) == int(entry["horizon_min"])
                and e.get("model_id") != entry["model_id"]
            ):
                e["is_active"] = False
    # remplace l'entrée existante de même model_id, sinon ajoute.
    entries = [e for e in entries if e.get("model_id") != entry["model_id"]]
    entries.append(entry)
    _write_json(entries)

    if db is not None:
        from app.repositories import ml_registry_repo

        ml_registry_repo.upsert(db, entry)
        if set_active:
            ml_registry_repo.deactivate_others(
                db,
                target=entry["target"],
                horizon_min=int(entry["horizon_min"]),
                keep_model_id=entry["model_id"],
            )
        db.commit()
    return entry
