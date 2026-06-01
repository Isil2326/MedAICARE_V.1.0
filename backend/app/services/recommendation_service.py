"""Workflow open-loop des recommandations.

Une recommandation ne peut passer que pending → approved | rejected, et
uniquement par un clinicien. Aucune transition automatique, aucune action
thérapeutique exécutée par le système.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import update
from sqlalchemy.orm import Session

from app.models import Recommendation
from app.models.clinical import RecommendationStatus
from app.recommendations import safety, workflow
from app.repositories import recommendation_repo
from app.services import audit_service

_REVIEWABLE = tuple(workflow.REVIEWABLE_SOURCE)


class RecommendationError(Exception):
    def __init__(self, message: str, code: str = "recommendation_error"):
        super().__init__(message)
        self.message = message
        self.code = code


def _review(
    db: Session,
    rec_id: uuid.UUID,
    *,
    clinician_id: uuid.UUID,
    new_status: RecommendationStatus,
    note: str | None,
    ip=None,
    ua=None,
) -> Recommendation:
    # Transition atomique : l'UPDATE n'affecte une ligne QUE si elle est encore
    # arbitrable (`pending` ou `modified`). Garantit l'open-loop à arbitrage unique
    # même si deux cliniciens agissent en même temps (anti-course). rowcount == 0 →
    # déjà arbitrée ou inexistante.
    result = db.execute(
        update(Recommendation)
        .where(
            Recommendation.id == rec_id,
            Recommendation.status.in_(_REVIEWABLE),
        )
        .values(
            status=new_status.value,
            reviewed_by=clinician_id,
            reviewed_at=datetime.now(timezone.utc),
            review_note=note,
        )
    )
    db.flush()

    if (result.rowcount or 0) == 0:
        rec = recommendation_repo.get(db, rec_id)
        if rec is None:
            raise RecommendationError("Recommandation introuvable.", "not_found")
        raise RecommendationError(
            f"Recommandation déjà arbitrée ({rec.status}).", "already_reviewed"
        )

    rec = recommendation_repo.get(db, rec_id)

    audit_service.record(
        db,
        action=f"recommendation.{new_status.value}",
        actor_user_id=clinician_id,
        resource_type="recommendation",
        resource_id=str(rec.id),
        event_metadata={"patient_id": str(rec.patient_id), "note": note},
        ip_address=ip,
        user_agent=ua,
    )
    db.commit()
    db.refresh(rec)
    return rec  # type: ignore[return-value]


def approve(db, rec_id, *, clinician_id, note=None, ip=None, ua=None) -> Recommendation:
    return _review(
        db, rec_id, clinician_id=clinician_id,
        new_status=RecommendationStatus.approved, note=note, ip=ip, ua=ua,
    )


def reject(db, rec_id, *, clinician_id, note=None, ip=None, ua=None) -> Recommendation:
    return _review(
        db, rec_id, clinician_id=clinician_id,
        new_status=RecommendationStatus.rejected, note=note, ip=ip, ua=ua,
    )


def modify(
    db: Session,
    rec_id: uuid.UUID,
    *,
    clinician_id: uuid.UUID,
    message: str | None = None,
    note: str | None = None,
    ip=None,
    ua=None,
) -> Recommendation:
    """Le clinicien amende une suggestion `pending` → `modified` (arbitrable ensuite).

    Open-loop : une modification reste une SUGGESTION non prescriptive. Seul le
    message libre et la note d'arbitrage sont éditables ; la trace (règle, contexte,
    probabilité, scores) reste intacte. Transition atomique (uniquement depuis
    `pending`).

    Garde-fou de sécurité : tout texte édité (message libre OU note) est validé par
    `safety.check_message` ; un terme prescriptif ou une dose chiffrée → blocage
    (`recommendation.safety_blocked`), jamais persisté. Empêche un contournement de
    la couche safety via l'édition après génération.
    """
    violations: list[str] = []
    for text in (message, note):
        violations.extend(safety.check_message(text))
    if violations:
        rec = recommendation_repo.get(db, rec_id)
        audit_service.record(
            db,
            action="recommendation.safety_blocked",
            actor_user_id=clinician_id,
            resource_type="recommendation",
            resource_id=str(rec_id),
            event_metadata={
                "patient_id": str(rec.patient_id) if rec else None,
                "context": "modify",
                "violations": violations,
            },
            ip_address=ip,
            user_agent=ua,
        )
        db.commit()
        raise RecommendationError(
            "Modification refusée : contenu prescriptif/dose interdit (open-loop).",
            "safety_blocked",
        )

    values = {
        "status": RecommendationStatus.modified.value,
        "reviewed_by": clinician_id,
        "reviewed_at": datetime.now(timezone.utc),
        "review_note": note,
    }
    if message is not None:
        values["message"] = message

    result = db.execute(
        update(Recommendation)
        .where(
            Recommendation.id == rec_id,
            Recommendation.status == RecommendationStatus.pending.value,
        )
        .values(**values)
    )
    db.flush()

    if (result.rowcount or 0) == 0:
        rec = recommendation_repo.get(db, rec_id)
        if rec is None:
            raise RecommendationError("Recommandation introuvable.", "not_found")
        raise RecommendationError(
            f"Recommandation non modifiable ({rec.status}).", "already_reviewed"
        )

    rec = recommendation_repo.get(db, rec_id)
    audit_service.record(
        db,
        action="recommendation.modified",
        actor_user_id=clinician_id,
        resource_type="recommendation",
        resource_id=str(rec.id),
        event_metadata={
            "patient_id": str(rec.patient_id),
            "note": note,
            "message_edited": message is not None,
        },
        ip_address=ip,
        user_agent=ua,
    )
    db.commit()
    db.refresh(rec)
    return rec  # type: ignore[return-value]
