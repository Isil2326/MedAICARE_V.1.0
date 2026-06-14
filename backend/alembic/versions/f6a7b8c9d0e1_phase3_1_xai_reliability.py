"""phase3.1 xai reliability columns

Migration ADDITIVE et non destructive (Phase 3.1 — sécurisation sémantique XAI).
Ajoute trois colonnes à `xai_explanations` pour tracer la fiabilité sémantique des
explications persistées : `xai_reliability_status`, `xai_warnings` (JSON),
`semantic_limitations` (JSON). Aucune colonne existante n'est modifiée/supprimée :
rejouable. Gardes idempotentes (colonne déjà présente → no-op) pour SQLite
(create_all en tests) comme pour PostgreSQL.

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-06-01 03:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f6a7b8c9d0e1"
down_revision: Union[str, None] = "e5f6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_TABLE = "xai_explanations"


def _has_table(name: str) -> bool:
    return sa.inspect(op.get_bind()).has_table(name)


def _has_column(table: str, column: str) -> bool:
    insp = sa.inspect(op.get_bind())
    return column in {c["name"] for c in insp.get_columns(table)}


def upgrade() -> None:
    if not _has_table(_TABLE):
        return
    if not _has_column(_TABLE, "xai_reliability_status"):
        op.add_column(
            _TABLE,
            sa.Column(
                "xai_reliability_status",
                sa.String(length=48),
                nullable=False,
                server_default="reliable_for_model_debug",
            ),
        )
    if not _has_column(_TABLE, "xai_warnings"):
        op.add_column(_TABLE, sa.Column("xai_warnings", sa.JSON(), nullable=True))
    if not _has_column(_TABLE, "semantic_limitations"):
        op.add_column(_TABLE, sa.Column("semantic_limitations", sa.JSON(), nullable=True))


def downgrade() -> None:
    if not _has_table(_TABLE):
        return
    for col in ("semantic_limitations", "xai_warnings", "xai_reliability_status"):
        if _has_column(_TABLE, col):
            op.drop_column(_TABLE, col)
