"""phase2.1 model registry evaluation_status

Migration ADDITIVE et non destructive (Phase 2.1 — remédiation scientifique).
Ajoute à `model_registry` la colonne `evaluation_status` (statut d'évaluation
scientifique : evaluated / insufficient_test_positives /
not_evaluable_mono_class_test / candidate_only).

Aucune colonne supprimée : rejouable. Sur SQLite (tests via create_all) la table
porte déjà la colonne ; les gardes idempotentes évitent un double ajout.

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-05-31 23:55:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, None] = "c3d4e5f6a7b8"
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
    if "evaluation_status" not in cols:
        op.add_column(
            _TABLE, sa.Column("evaluation_status", sa.String(length=40), nullable=True)
        )
    if "ix_model_registry_evaluation_status" not in _indexes(_TABLE):
        op.create_index(
            "ix_model_registry_evaluation_status", _TABLE, ["evaluation_status"]
        )


def downgrade() -> None:
    if not _columns(_TABLE):
        return
    if "ix_model_registry_evaluation_status" in _indexes(_TABLE):
        op.drop_index("ix_model_registry_evaluation_status", table_name=_TABLE)
    if "evaluation_status" in _columns(_TABLE):
        op.drop_column(_TABLE, "evaluation_status")
