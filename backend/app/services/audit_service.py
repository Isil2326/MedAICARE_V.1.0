"""Service d'audit append-only à chaînage cryptographique.

Le hash de chaque entrée est calculé sur ses champs immuables + le hash de
l'entrée précédente. La chaîne est vérifiable a posteriori : toute
altération (modification/suppression) la casse.

Note SaMD honnête : ce mécanisme garantit la *détectabilité* d'une
altération, pas son *impossibilité*. Un journal réellement inviolable
exigerait un stockage WORM + signature par clé gérée séparément (hors
périmètre de ce socle).
"""
from __future__ import annotations

import hashlib
import json
import threading
import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models import AuditLog
from app.repositories import audit_repo

GENESIS_HASH = "0" * 64

# Verrou applicatif léger : sérialise le calcul de `sequence` + l'append au sein
# d'un même processus (cas mono-instance Replit), évitant une course sur le
# numéro de séquence. Voir docs/security/AUDIT_CONCURRENCY.md pour les limites
# (multi-processus) et la garantie dure complémentaire (contraintes d'unicité DB).
_append_lock = threading.Lock()


def _compute_hash(
    *,
    sequence: int,
    actor_user_id: str | None,
    action: str,
    resource_type: str | None,
    resource_id: str | None,
    event_metadata: dict | None,
    created_at_iso: str,
    prev_hash: str,
) -> str:
    canonical = json.dumps(
        {
            "sequence": sequence,
            "actor_user_id": actor_user_id,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "event_metadata": event_metadata,
            "created_at": created_at_iso,
            "prev_hash": prev_hash,
        },
        sort_keys=True,
        separators=(",", ":"),
        default=str,
    )
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def record(
    db: Session,
    *,
    action: str,
    actor_user_id: uuid.UUID | None = None,
    resource_type: str | None = None,
    resource_id: str | None = None,
    event_metadata: dict | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> AuditLog:
    """Ajoute une entrée chaînée. Ne lève jamais d'exception silencieuse :
    l'appelant est responsable du commit de la transaction."""
    with _append_lock:
        last = audit_repo.get_last_entry(db)
        prev_hash = last.entry_hash if last else GENESIS_HASH
        sequence = (last.sequence + 1) if last else 1
        created_at = datetime.now(timezone.utc)
        created_at_iso = created_at.isoformat()

        entry_hash = _compute_hash(
            sequence=sequence,
            actor_user_id=str(actor_user_id) if actor_user_id else None,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            event_metadata=event_metadata,
            created_at_iso=created_at_iso,
            prev_hash=prev_hash,
        )

        entry = AuditLog(
            actor_user_id=actor_user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            event_metadata=event_metadata,
            ip_address=ip_address,
            user_agent=user_agent,
            prev_hash=prev_hash,
            entry_hash=entry_hash,
            sequence=sequence,
            created_at=created_at,
        )
        return audit_repo.add_entry(db, entry)


def verify_chain(db: Session) -> dict:
    """Recalcule toute la chaîne et renvoie sa validité."""
    entries = audit_repo.all_entries_ordered(db)
    prev_hash = GENESIS_HASH
    for idx, e in enumerate(entries):
        created_at_iso = (
            e.created_at.isoformat()
            if e.created_at.tzinfo
            else e.created_at.replace(tzinfo=timezone.utc).isoformat()
        )
        expected = _compute_hash(
            sequence=e.sequence,
            actor_user_id=str(e.actor_user_id) if e.actor_user_id else None,
            action=e.action,
            resource_type=e.resource_type,
            resource_id=e.resource_id,
            event_metadata=e.event_metadata,
            created_at_iso=created_at_iso,
            prev_hash=prev_hash,
        )
        if e.prev_hash != prev_hash or e.entry_hash != expected:
            return {"valid": False, "checked": idx + 1, "broken_at": e.sequence}
        prev_hash = e.entry_hash
    return {"valid": True, "checked": len(entries), "broken_at": None}
