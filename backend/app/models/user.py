"""Rôles et comptes utilisateurs (autorité serveur)."""
from __future__ import annotations

import uuid

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class Role(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "roles"

    name: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)

    users: Mapped[list["User"]] = relationship(back_populates="role")


class User(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    role_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("roles.id"), index=True)
    role: Mapped["Role"] = relationship(back_populates="users")

    patient: Mapped["Patient | None"] = relationship(  # type: ignore[name-defined]
        back_populates="user", uselist=False
    )
    clinician_profile: Mapped["ClinicianProfile | None"] = relationship(  # type: ignore[name-defined]
        back_populates="user", uselist=False
    )

    @property
    def role_name(self) -> str:
        return self.role.name if self.role else "unknown"
