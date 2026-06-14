"""phase2 model registry lifecycle fields

Migration ADDITIVE et non destructive (Phase 2 — durcissement du registre).
Ajoute à `model_registry` : `status` (active/candidate/archived), `dataset_version`,
`features_version`, `synthetic_only`, et un index UNIQUE PARTIEL garantissant au
niveau BASE un seul modèle ACTIF par couple (target, horizon_min).

Aucune colonne supprimée, aucune table modifiée structurellement : rejouable.

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-05-31 23:40:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_TABLE = "model_registry"


def _columns(name: str) -> set[str]:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    if not insp.has_table(name):
        return set()
    return {c["name"] for c in insp.get_columns(name)}


def _indexes(name: str) -> set[str]:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    if not insp.has_table(name):
        return set()
    return {ix["name"] for ix in insp.get_indexes(name)}


def upgrade() -> None:
    cols = _columns(_TABLE)
    if not cols:
        return
    if "status" not in cols:
        op.add_column(
            _TABLE,
            sa.Column("status", sa.String(length=20), nullable=False, server_default="active"),
        )
        op.create_index("ix_model_registry_status", _TABLE, ["status"])
    if "dataset_version" not in cols:
        op.add_column(_TABLE, sa.Column("dataset_version", sa.String(length=40), nullable=True))
    if "features_version" not in cols:
        op.add_column(_TABLE, sa.Column("features_version", sa.String(length=40), nullable=True))
    if "synthetic_only" not in cols:
        op.add_column(
            _TABLE,
            sa.Column("synthetic_only", sa.Boolean(), nullable=False, server_default=sa.true()),
        )

    bind = op.get_bind()
    # Backfill cohérent : les lignes déjà inactives doivent être 'archived'
    # (le server_default 'active' s'appliquerait sinon à tort aux anciennes).
    false_lit = "false" if bind.dialect.name == "postgresql" else "0"
    op.execute(
        sa.text(f"UPDATE {_TABLE} SET status='archived' WHERE is_active = {false_lit}")
    )
    if "uq_model_registry_active_couple" not in _indexes(_TABLE):
        where = "is_active = true" if bind.dialect.name == "postgresql" else "is_active = 1"
        op.create_index(
            "uq_model_registry_active_couple",
            _TABLE,
            ["target", "horizon_min"],
            unique=True,
            postgresql_where=sa.text(where),
            sqlite_where=sa.text(where),
        )


def downgrade() -> None:
    if not _columns(_TABLE):
        return
    if "uq_model_registry_active_couple" in _indexes(_TABLE):
        op.drop_index("uq_model_registry_active_couple", table_name=_TABLE)
    if "ix_model_registry_status" in _indexes(_TABLE):
        op.drop_index("ix_model_registry_status", table_name=_TABLE)
    for col in ("synthetic_only", "features_version", "dataset_version", "status"):
        if col in _columns(_TABLE):
            op.drop_column(_TABLE, col)
