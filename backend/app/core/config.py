"""Configuration centralisée (12-factor) — lue depuis l'environnement.

Aucune valeur sensible n'est codée en dur. Sur Replit, DATABASE_URL et
JWT_SECRET_KEY sont fournis via les variables d'environnement / secrets.
"""
from __future__ import annotations

import os
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


def _normalize_db_url(url: str) -> str:
    """Force le driver psycopg2 pour SQLAlchemy.

    Replit fournit une URL `postgresql://...`. SQLAlchemy a besoin du driver
    explicite `postgresql+psycopg2://` pour un fonctionnement déterministe.
    """
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- Application ---
    app_name: str = "MediAI Care API"
    app_version: str = "0.1.0-backend-foundation"
    environment: str = os.getenv("APP_ENV", "development")
    api_v1_prefix: str = "/api/v1"

    # --- Base de données ---
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./dev.db")

    # --- Sécurité / JWT ---
    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
    refresh_token_expire_days: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

    # --- Rate limiting (login/refresh) ---
    rate_limit_login_max: int = int(os.getenv("RATE_LIMIT_LOGIN_MAX", "5"))
    rate_limit_login_window: int = int(os.getenv("RATE_LIMIT_LOGIN_WINDOW", "60"))
    rate_limit_refresh_max: int = int(os.getenv("RATE_LIMIT_REFRESH_MAX", "10"))
    rate_limit_refresh_window: int = int(os.getenv("RATE_LIMIT_REFRESH_WINDOW", "60"))

    # --- CORS (clinicien web / mobile Expo plus tard) ---
    # Liste d'origines autorisées, séparées par des virgules, lue depuis l'env.
    # Vide => défaut localhost en dev ; refus strict en production (pas de `*`).
    cors_origins_env: str = os.getenv("CORS_ORIGINS", "")

    @property
    def sqlalchemy_database_uri(self) -> str:
        return _normalize_db_url(self.database_url)

    @property
    def is_production(self) -> bool:
        return self.environment.strip().lower() in {"production", "prod"}

    @property
    def cors_origins(self) -> list[str]:
        """Origines CORS restreintes par environnement.

        - Si CORS_ORIGINS est défini : on respecte exactement cette allow-list.
        - Sinon, en dev/test : origines localhost usuelles (Vite/Expo).
        - Sinon, en production : liste vide (refus) — il faut définir CORS_ORIGINS.

        `*` est rejeté : il est incompatible avec `allow_credentials=True` et
        rouvrirait l'accès à toutes les origines (régression de sécurité).
        """
        explicit = [o.strip() for o in self.cors_origins_env.split(",") if o.strip()]
        if "*" in explicit:
            raise RuntimeError(
                "CORS_ORIGINS='*' interdit avec credentials. Indiquez une "
                "allow-list explicite d'origines."
            )
        if explicit:
            return explicit
        if self.is_production:
            return []
        return [
            "http://localhost:5000",
            "http://localhost:5173",
            "http://127.0.0.1:5000",
            "http://127.0.0.1:5173",
        ]


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    if not settings.jwt_secret_key and settings.environment != "test":
        # Fail loud, never silently sign tokens with an empty key.
        raise RuntimeError(
            "JWT_SECRET_KEY manquant. Définissez-le dans les secrets Replit."
        )
    return settings


settings = get_settings()
