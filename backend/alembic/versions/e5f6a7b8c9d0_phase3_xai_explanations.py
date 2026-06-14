"""phase3 xai explanations

Migration ADDITIVE et non destructive (Phase 3 — XAI clinique). Crée la table
`xai_explanations` (traçabilité open-loop des explications LOCALES : contributions
de features, textes pédagogiques patient/clinicien). Aucune table existante n'est
modifiée ou supprimée : rejouable. Sur SQLite (tests via create_all) la table
existe déjà ; les gardes idempotentes évitent une double création.

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-06-01 00:30:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_TABLE = "xai_explanations"


def _has_table(name: str) -> bool:
    bind = op.get_bind()
    return sa.inspect(bind).has_table(name)


def upgrade() -> None:
    if _has_table(_TABLE):
        return
    op.create_table(
        _TABLE,
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("patient_id", sa.Uuid(), sa.ForeignKey("patients.id"), nullable=False),
        sa.Column("ts", sa.DateTime(timezone=True), nullable=False),
        sa.Column("target", sa.String(length=20), nullable=False),
        sa.Column("horizon_min", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("probability", sa.Float(), nullable=True),
        sa.Column("risk_label", sa.String(length=20), nullable=False, server_default="non calculable"),
        sa.Column("calculable", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("model_name", sa.String(length=80), nullable=False, server_default="none"),
        sa.Column("model_version", sa.String(length=40), nullable=False, server_default="0.0.0"),
        sa.Column("calibrated", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("explains", sa.String(length=60), nullable=False, server_default="modèle non calibré"),
        sa.Column("xai_method", sa.String(length=40), nullable=False, server_default="none"),
        sa.Column("method_fallback", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("top_features", sa.JSON(), nullable=True),
        sa.Column("baseline", sa.Float(), nullable=True),
        sa.Column("explanation_text_patient", sa.Text(), nullable=True),
        sa.Column("explanation_text_clinician", sa.Text(), nullable=True),
        sa.Column("is_synthetic", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_xai_explanations_patient_id", _TABLE, ["patient_id"])
    op.create_index("ix_xai_explanations_ts", _TABLE, ["ts"])
    op.create_index("ix_xai_explanations_target", _TABLE, ["target"])
    op.create_index("ix_xai_explanations_horizon_min", _TABLE, ["horizon_min"])


def downgrade() -> None:
    if not _has_table(_TABLE):
        return
    for ix in (
        "ix_xai_explanations_horizon_min",
        "ix_xai_explanations_target",
        "ix_xai_explanations_ts",
        "ix_xai_explanations_patient_id",
    ):
        op.drop_index(ix, table_name=_TABLE)
    op.drop_table(_TABLE)
