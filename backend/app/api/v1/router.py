"""Agrégation des routers de l'API v1."""
from fastapi import APIRouter

from app.api.v1 import audit, auth, patients, recommendations, timeseries

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(patients.router)
api_router.include_router(recommendations.router)
api_router.include_router(timeseries.router)
api_router.include_router(audit.router)
