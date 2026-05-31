"""Profils métier patient et clinicien (séparés du compte d'auth)."""
from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class Patient(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "patients"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    user: Mapped["User"] = relationship(back_populates="patient")  # type: ignore[name-defined]

    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    birth_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    diabetes_type: Mapped[str | None] = mapped_column(String(20), nullable=True)  # T1 / T2
    is_synthetic: Mapped[bool] = mapped_column(default=True)


class ClinicianProfile(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "clinician_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    user: Mapped["User"] = relationship(back_populates="clinician_profile")  # type: ignore[name-defined]

    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    specialty: Mapped[str | None] = mapped_column(String(100), nullable=True)
    license_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
