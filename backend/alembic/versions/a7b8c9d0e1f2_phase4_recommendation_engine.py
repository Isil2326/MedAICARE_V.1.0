"""phase4 recommendation engine traceability columns

Migration ADDITIVE et non destructive (Phase 4 — moteur de recommandation open-loop).
Ajoute des colonnes de traçabilité à `recommendations` afin de tracer la genèse d'une
suggestion non prescriptive : `target`, `horizon_min`, `probability`, `model_name`,
`model_version`, `rule_id`, `rule_version`, `trigger_name`, `safety_level`,
`xai_reliability_status`, `actionability_score`, `is_synthetic`. Aucune colonne
existante n'est modifiée/supprimée : rejouable. Gardes idempotentes (colonne déjà
présente → no-op) pour SQLite (create_all en tests) comme pour PostgreSQL.

Le statut `modified` (workflow open-loop étendu) n'est PAS un type SQL : `status` reste
une String, donc aucune migration de type n'est requise.

Revision ID: a7b8c9d0e1f2
Revises: f6a7b8c9d0e1
Create Date: 2026-06-01 04:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a7b8c9d0e1f2"
down_revision: Union[str, None] = "f6a7b8c9d0e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_TABLE = "recommendations"

_COLUMNS: tuple[tuple[str, sa.types.TypeEngine], ...] = (
    ("target", sa.String(length=10)),
    ("horizon_min", sa.Integer()),
    ("probability", sa.Float()),
    ("model_name", sa.String(length=80)),
    ("model_version", sa.String(length=40)),
    ("rule_id", sa.String(length=60)),
    ("rule_version", sa.String(length=20)),
    ("trigger_name", sa.String(length=120)),
    ("safety_level", sa.String(length=20)),
    ("xai_reliability_status", sa.String(length=48)),
    ("actionability_score", sa.Float()),
)


def _has_table(name: str) -> bool:
    return sa.inspect(op.get_bind()).has_table(name)


def _has_column(table: str, column: str) -> bool:
    insp = sa.inspect(op.get_bind())
    return column in {c["name"] for c in insp.get_columns(table)}


def upgrade() -> None:
    if not _has_table(_TABLE):
        return
    for name, coltype in _COLUMNS:
        if not _has_column(_TABLE, name):
            op.add_column(_TABLE, sa.Column(name, coltype, nullable=True))
    if not _has_column(_TABLE, "is_synthetic"):
        op.add_column(
            _TABLE,
            sa.Column(
                "is_synthetic",
                sa.Boolean(),
                nullable=False,
                server_default=sa.true(),
            ),
        )
    if not _has_column(_TABLE, "rule_id"):
        return
    # Index non unique sur rule_id (traçabilité / requêtes par règle).
    insp = sa.inspect(op.get_bind())
    existing_idx = {ix["name"] for ix in insp.get_indexes(_TABLE)}
    if "ix_recommendations_rule_id" not in existing_idx:
        op.create_index("ix_recommendations_rule_id", _TABLE, ["rule_id"])


def downgrade() -> None:
    if not _has_table(_TABLE):
        return
    insp = sa.inspect(op.get_bind())
    existing_idx = {ix["name"] for ix in insp.get_indexes(_TABLE)}
    if "ix_recommendations_rule_id" in existing_idx:
        op.drop_index("ix_recommendations_rule_id", table_name=_TABLE)
    for name in ("is_synthetic", "actionability_score", "xai_reliability_status",
                 "safety_level", "trigger_name", "rule_version", "rule_id",
                 "model_version", "model_name", "probability", "horizon_min", "target"):
        if _has_column(_TABLE, name):
            op.drop_column(_TABLE, name)
