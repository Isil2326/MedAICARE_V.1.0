"""Accès données du registre de modèles (miroir DB). Aucune autorisation ici."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import ModelRegistryEntry


def get_active(db: Session, *, target: str, horizon_min: int) -> ModelRegistryEntry | None:
    return db.scalar(
        select(ModelRegistryEntry)
        .where(
            ModelRegistryEntry.target == target,
            ModelRegistryEntry.horizon_min == horizon_min,
            ModelRegistryEntry.is_active.is_(True),
        )
        .order_by(ModelRegistryEntry.created_at.desc())
    )


def get_by_model_id(db: Session, model_id: str) -> ModelRegistryEntry | None:
    return db.scalar(
        select(ModelRegistryEntry).where(ModelRegistryEntry.model_id == model_id)
    )


def list_all(db: Session) -> list[ModelRegistryEntry]:
    return list(
        db.scalars(select(ModelRegistryEntry).order_by(ModelRegistryEntry.created_at.desc()))
    )


def deactivate_others(db: Session, *, target: str, horizon_min: int, keep_model_id: str) -> None:
    """Désactive les autres entrées actives du même couple (un seul actif)."""
    rows = db.scalars(
        select(ModelRegistryEntry).where(
            ModelRegistryEntry.target == target,
            ModelRegistryEntry.horizon_min == horizon_min,
            ModelRegistryEntry.is_active.is_(True),
            ModelRegistryEntry.model_id != keep_model_id,
        )
    )
    for r in rows:
        r.is_active = False
        r.status = "archived"


def upsert(db: Session, entry_dict: dict) -> ModelRegistryEntry:
    """Insère ou met à jour une entrée par `model_id` (flush géré par l'appelant)."""
    existing = get_by_model_id(db, entry_dict["model_id"])
    fields = {
        "target": entry_dict["target"],
        "horizon_min": entry_dict["horizon_min"],
        "model_name": entry_dict["model_name"],
        "model_version": entry_dict["model_version"],
        "artifact_path": entry_dict["artifact_path"],
        "calibrated": entry_dict.get("calibrated", False),
        "is_active": entry_dict.get("is_active", True),
        "status": entry_dict.get("status", "active"),
        "evaluation_status": entry_dict.get("evaluation_status"),
        "dataset_version": entry_dict.get("dataset_version"),
        "features_version": entry_dict.get("features_version"),
        "synthetic_only": entry_dict.get("synthetic_only", True),
        "feature_columns": entry_dict.get("feature_columns"),
        "metrics": entry_dict.get("metrics"),
        "dataset_meta": entry_dict.get("dataset_meta"),
    }
    if existing is None:
        existing = ModelRegistryEntry(model_id=entry_dict["model_id"], **fields)
        db.add(existing)
    else:
        for k, v in fields.items():
            setattr(existing, k, v)
    return existing
