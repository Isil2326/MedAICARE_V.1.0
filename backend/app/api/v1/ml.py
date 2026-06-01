"""Endpoint d'inférence ML open-loop (Phase 2).

POST /api/v1/ml/predict — renvoie une PROBABILITÉ de risque (hypo/hyper) à un
horizon donné. OPEN-LOOP STRICT : aucune décision/prescription. RBAC + ownership :
- patient   : uniquement son propre dossier (`patient_id` ignoré/contrôlé) ;
- clinician/admin : `patient_id` requis ;
- non authentifié : 401.

`persist=true` écrit la prédiction dans `predictions` (is_synthetic=True) et
l'audite. Toute inférence est auditée (traçabilité), qu'elle soit persistée ou non.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import client_ip, client_ua, get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.core.rate_limit import rate_limiter
from app.ml import config, inference_service
from app.ml.schemas import PredictRequest, PredictResponse
from app.models import Prediction, User
from app.services import audit_service
from app.services.timeseries_service import TimeseriesError, resolve_read_scope

router = APIRouter(prefix="/ml", tags=["ml"])

predict_rate_limit = rate_limiter(
    bucket="ml_predict",
    max_attempts=settings.rate_limit_predict_max,
    window_seconds=settings.rate_limit_predict_window,
)


@router.post(
    "/predict",
    response_model=PredictResponse,
    dependencies=[Depends(predict_rate_limit)],
)
def post_predict(
    payload: PredictRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if payload.horizon_min not in config.HORIZONS_MIN:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Horizon non supporté : {payload.horizon_min} (attendu {config.HORIZONS_MIN}).",
        )
    # RBAC + ownership : même résolution que la lecture des séries temporelles.
    try:
        scope_pid = resolve_read_scope(db, user, payload.patient_id)
    except TimeseriesError as e:
        code = {
            "forbidden": status.HTTP_403_FORBIDDEN,
            "not_found": status.HTTP_404_NOT_FOUND,
            "bad_request": status.HTTP_400_BAD_REQUEST,
        }.get(e.code, status.HTTP_409_CONFLICT)
        raise HTTPException(code, e.message)

    result = inference_service.predict(
        db,
        patient_id=scope_pid,
        target=payload.target,
        horizon_min=payload.horizon_min,
        at=payload.at,
    )

    prediction_id = None
    persisted = False
    if payload.persist and result["calculable"]:
        pred = Prediction(
            patient_id=scope_pid,
            ts=result["at"],
            horizon_min=result["horizon_min"],
            predicted_event=result["target"],
            probability=result["probability"],
            model_name=result["model_name"],
            model_version=result["model_version"],
            is_synthetic=True,
        )
        db.add(pred)
        db.flush()
        prediction_id = pred.id
        persisted = True

    # Audit systématique de l'inférence (open-loop, traçabilité).
    audit_service.record(
        db,
        action="ml.predict",
        actor_user_id=user.id,
        resource_type="prediction",
        resource_id=str(prediction_id) if prediction_id else None,
        event_metadata={
            "patient_id": str(scope_pid),
            "target": result["target"],
            "horizon_min": result["horizon_min"],
            "calculable": result["calculable"],
            "model_name": result["model_name"],
            "model_version": result["model_version"],
            "persisted": persisted,
            "synthetic": True,
            "open_loop": True,
        },
        ip_address=client_ip(request),
        user_agent=client_ua(request),
    )
    db.commit()

    result["persisted"] = persisted
    result["prediction_id"] = prediction_id
    return PredictResponse(**result)
