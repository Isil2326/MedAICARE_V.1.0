"""Contrats Pydantic pour l'authentification."""
from __future__ import annotations

import re
import uuid
from datetime import date

from pydantic import BaseModel, EmailStr, Field, field_validator

# Politique de mot de passe (prototype) — voir docs/security/PASSWORD_POLICY.md
PASSWORD_MIN_LENGTH = 12


def validate_password_strength(value: str) -> str:
    if len(value) < PASSWORD_MIN_LENGTH:
        raise ValueError(
            f"Mot de passe trop court (minimum {PASSWORD_MIN_LENGTH} caractères)."
        )
    if not re.search(r"[A-Za-z]", value):
        raise ValueError("Le mot de passe doit contenir au moins une lettre.")
    if not re.search(r"\d", value):
        raise ValueError("Le mot de passe doit contenir au moins un chiffre.")
    if not re.search(r"[^A-Za-z0-9]", value):
        raise ValueError("Le mot de passe doit contenir au moins un caractère spécial.")
    return value


class PatientRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=PASSWORD_MIN_LENGTH, max_length=128)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    birth_date: date | None = None
    diabetes_type: str | None = Field(default=None, max_length=20)

    _check_pw = field_validator("password")(validate_password_strength)

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "patient@demo.fr",
                "password": "DemoMediAI2026!",
                "first_name": "Alex",
                "last_name": "Martin",
                "birth_date": "1990-05-21",
                "diabetes_type": "T1",
            }
        }
    }


class ClinicianRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=PASSWORD_MIN_LENGTH, max_length=128)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    specialty: str | None = Field(default=None, max_length=100)
    license_number: str | None = Field(default=None, max_length=100)

    _check_pw = field_validator("password")(validate_password_strength)

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "clinicien@demo.fr",
                "password": "DemoMediAI2026!",
                "first_name": "Camille",
                "last_name": "Durand",
                "specialty": "Endocrinologie",
                "license_number": "DEMO-CLN-001",
            }
        }
    }


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    model_config = {
        "json_schema_extra": {
            "example": {"email": "clinicien@demo.fr", "password": "DemoMediAI2026!"}
        }
    }


class RefreshRequest(BaseModel):
    refresh_token: str

    model_config = {
        "json_schema_extra": {
            "example": {"refresh_token": "<jeton-opaque-renvoyé-par-/login>"}
        }
    }


class LogoutRequest(BaseModel):
    refresh_token: str

    model_config = {
        "json_schema_extra": {
            "example": {"refresh_token": "<jeton-opaque-à-révoquer>"}
        }
    }


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class UserPublic(BaseModel):
    id: uuid.UUID
    email: EmailStr
    role: str
    is_active: bool

    class Config:
        from_attributes = True
