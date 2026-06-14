"""phase2 model registry table

Migration ADDITIVE et non destructive (Phase 2 — Modélisation ML).
Crée la table `model_registry` (miroir DB du registre JSON des modèles). Aucune
table existante modifiée, aucune colonne supprimée : rejouable et sûre.

Le registre JSON `artifacts/registry.json` reste la source canonique côté
fichiers ; cette table en est un miroir requêtable/traçable côté base.

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-05-31 22:45:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_TABLE = "model_registry"


def _has_table(name: str) -> bool:
    bind = op.get_bind()
    return sa.inspect(bind).has_table(name)


def upgrade() -> None:
    if _has_table(_TABLE):
        return
    op.create_table(
        _TABLE,
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("model_id", sa.String(length=120), nullable=False),
        sa.Column("target", sa.String(length=20), nullable=False),
        sa.Column("horizon_min", sa.Integer(), nullable=False),
        sa.Column("model_name", sa.String(length=80), nullable=False),
        sa.Column("model_version", sa.String(length=40), nullable=False),
        sa.Column("artifact_path", sa.String(length=255), nullable=False),
        sa.Column("calibrated", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("feature_columns", sa.JSON(), nullable=True),
        sa.Column("metrics", sa.JSON(), nullable=True),
        sa.Column("dataset_meta", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_model_registry_model_id", _TABLE, ["model_id"], unique=True)
    op.create_index("ix_model_registry_target", _TABLE, ["target"])
    op.create_index("ix_model_registry_horizon_min", _TABLE, ["horizon_min"])
    op.create_index("ix_model_registry_is_active", _TABLE, ["is_active"])


def downgrade() -> None:
    if not _has_table(_TABLE):
        return
    op.drop_index("ix_model_registry_is_active", table_name=_TABLE)
    op.drop_index("ix_model_registry_horizon_min", table_name=_TABLE)
    op.drop_index("ix_model_registry_target", table_name=_TABLE)
    op.drop_index("ix_model_registry_model_id", table_name=_TABLE)
    op.drop_table(_TABLE)
