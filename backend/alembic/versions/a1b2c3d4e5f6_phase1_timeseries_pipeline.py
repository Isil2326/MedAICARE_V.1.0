"""phase1 timeseries pipeline fields

Migration ADDITIVE et non destructive (Phase 1 — Data Engineering).
Ajoute aux 4 tables de séries temporelles les champs du pipeline temporel
(source, external_event_id, device_id, quality_flag, ingestion_batch_id, unit,
event_metadata) et un index unique partiel d'idempotence par external_event_id.

Aucune colonne supprimée, aucun type modifié : la migration est rejouable et
sûre. Les tables restent des tables PostgreSQL natives (pas de conversion
hypertable TimescaleDB — voir docs/migration/PHASE_1_DATA_ENGINEERING.md).

Revision ID: a1b2c3d4e5f6
Revises: 8e901cc3bbbc
Create Date: 2026-05-31 21:30:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "8e901cc3bbbc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Tables event et présence (ou non) d'une colonne device_id préexistante.
_EVENT_TABLES = ("cgm_readings", "insulin_events", "meal_events", "activity_events")
_HAS_DEVICE_ID = {"cgm_readings"}  # device_id existait déjà sur cgm_readings


def _existing_columns(table: str) -> set[str]:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    return {c["name"] for c in insp.get_columns(table)}


def upgrade() -> None:
    for table in _EVENT_TABLES:
        cols = _existing_columns(table)

        if "source" not in cols:
            op.add_column(
                table,
                sa.Column(
                    "source", sa.String(length=40), nullable=False,
                    server_default="manual",
                ),
            )
        if "external_event_id" not in cols:
            op.add_column(
                table, sa.Column("external_event_id", sa.String(length=120), nullable=True)
            )
        if "device_id" not in cols and table not in _HAS_DEVICE_ID:
            op.add_column(
                table, sa.Column("device_id", sa.String(length=80), nullable=True)
            )
        if "quality_flag" not in cols:
            op.add_column(
                table,
                sa.Column(
                    "quality_flag", sa.String(length=30), nullable=False,
                    server_default="valid",
                ),
            )
        if "ingestion_batch_id" not in cols:
            op.add_column(
                table, sa.Column("ingestion_batch_id", sa.Uuid(), nullable=True)
            )
        if "unit" not in cols:
            op.add_column(table, sa.Column("unit", sa.String(length=20), nullable=True))
        if "event_metadata" not in cols:
            op.add_column(table, sa.Column("event_metadata", sa.JSON(), nullable=True))

        # Index sur source (filtrage / dedup logique).
        bind = op.get_bind()
        insp = sa.inspect(bind)
        existing_idx = {i["name"] for i in insp.get_indexes(table)}

        src_idx = f"ix_{table}_source"
        if src_idx not in existing_idx:
            op.create_index(src_idx, table, ["source"])

        qf_idx = f"ix_{table}_quality_flag"
        if qf_idx not in existing_idx:
            op.create_index(qf_idx, table, ["quality_flag"])

    # Index unique partiel d'idempotence par external_event_id.
    dedup = {
        "cgm_readings": "uq_cgm_external_event",
        "insulin_events": "uq_insulin_external_event",
        "meal_events": "uq_meal_external_event",
        "activity_events": "uq_activity_external_event",
    }
    for table, idx_name in dedup.items():
        bind = op.get_bind()
        insp = sa.inspect(bind)
        existing_idx = {i["name"] for i in insp.get_indexes(table)}
        if idx_name not in existing_idx:
            op.create_index(
                idx_name,
                table,
                ["patient_id", "source", "external_event_id"],
                unique=True,
                postgresql_where=sa.text("external_event_id IS NOT NULL"),
                sqlite_where=sa.text("external_event_id IS NOT NULL"),
            )


def downgrade() -> None:
    dedup = (
        ("cgm_readings", "uq_cgm_external_event"),
        ("insulin_events", "uq_insulin_external_event"),
        ("meal_events", "uq_meal_external_event"),
        ("activity_events", "uq_activity_external_event"),
    )
    for table, idx_name in dedup:
        op.drop_index(idx_name, table_name=table)

    for table in _EVENT_TABLES:
        op.drop_index(f"ix_{table}_quality_flag", table_name=table)
        op.drop_index(f"ix_{table}_source", table_name=table)
        for col in (
            "event_metadata",
            "unit",
            "ingestion_batch_id",
            "quality_flag",
            "external_event_id",
            "source",
        ):
            op.drop_column(table, col)
        if table not in _HAS_DEVICE_ID:
            op.drop_column(table, "device_id")
