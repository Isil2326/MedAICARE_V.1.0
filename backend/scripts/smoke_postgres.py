"""Smoke test PostgreSQL réel — vérifie le schéma piloté par Alembic.

Les tests unitaires (`pytest`) tournent sur SQLite jetable pour l'isolation ;
ce script complémentaire valide que la base **PostgreSQL réelle** issue de
`alembic upgrade head` contient bien les tables, index et contraintes attendus.

Usage (depuis le dossier backend/, sur une base déjà migrée) :

    alembic upgrade head
    python -m scripts.smoke_postgres

Sortie : rapport lisible + code de sortie 0 (OK) / 1 (au moins un manque).
N'écrit ni ne modifie aucune donnée (lecture du catalogue uniquement).
"""
from __future__ import annotations

import sys

from sqlalchemy import create_engine, inspect

from app.core.config import settings

EXPECTED_TABLES = {
    "users",
    "roles",
    "patients",
    "clinician_profiles",
    "consents",
    "refresh_tokens",
    "audit_logs",
    "cgm_readings",
    "insulin_events",
    "meal_events",
    "activity_events",
    "lab_reports",
    "predictions",
    "recommendations",
}

# Index temporels (patient_id, ts) attendus sur les tables de séries temporelles.
EXPECTED_TS_INDEXES = {
    "cgm_readings": ("ix_cgm_patient_ts", ["patient_id", "ts"]),
    "insulin_events": ("ix_insulin_patient_ts", ["patient_id", "ts"]),
    "meal_events": ("ix_meal_patient_ts", ["patient_id", "ts"]),
    "activity_events": ("ix_activity_patient_ts", ["patient_id", "ts"]),
}

# Champs pipeline temporel (Phase 1) attendus sur chaque table event.
_EVENT_TABLES = ("cgm_readings", "insulin_events", "meal_events", "activity_events")
EXPECTED_PIPELINE_COLS = {
    "source",
    "external_event_id",
    "device_id",
    "quality_flag",
    "ingestion_batch_id",
    "unit",
    "event_metadata",
}
# Index unique partiel d'idempotence (external_event_id) par table event.
EXPECTED_DEDUP_INDEXES = {
    "cgm_readings": "uq_cgm_external_event",
    "insulin_events": "uq_insulin_external_event",
    "meal_events": "uq_meal_external_event",
    "activity_events": "uq_activity_external_event",
}


def main() -> int:
    failures: list[str] = []
    oks: list[str] = []

    url = settings.sqlalchemy_database_uri
    if url.startswith("sqlite"):
        print(
            "ERREUR : DATABASE_URL pointe sur SQLite. Ce smoke test doit cibler "
            "PostgreSQL réel. Exportez la bonne DATABASE_URL puis réessayez."
        )
        return 1

    engine = create_engine(url)
    insp = inspect(engine)

    # 1) Présence des 14 tables ------------------------------------------------
    tables = set(insp.get_table_names())
    missing = EXPECTED_TABLES - tables
    if missing:
        failures.append(f"Tables manquantes : {sorted(missing)}")
    else:
        oks.append(f"14/14 tables présentes ({len(EXPECTED_TABLES)}).")

    # 2) Index temporels (patient_id, ts) -------------------------------------
    for table, (idx_name, cols) in EXPECTED_TS_INDEXES.items():
        if table not in tables:
            failures.append(f"Index {idx_name} : table {table} absente.")
            continue
        idx = {i["name"]: i for i in insp.get_indexes(table)}
        if idx_name not in idx:
            failures.append(f"Index {idx_name} absent sur {table}.")
        elif list(idx[idx_name]["column_names"]) != cols:
            failures.append(
                f"Index {idx_name} : colonnes {idx[idx_name]['column_names']} "
                f"(attendu {cols})."
            )
        else:
            oks.append(f"Index temporel {idx_name} OK ({cols}).")

    # 2b) Champs pipeline temporel + index dedup (Phase 1) --------------------
    for table in _EVENT_TABLES:
        if table not in tables:
            failures.append(f"Table event {table} absente — pipeline non vérifiable.")
            continue
        cols = {c["name"] for c in insp.get_columns(table)}
        missing_cols = EXPECTED_PIPELINE_COLS - cols
        if missing_cols:
            failures.append(f"{table} : champs pipeline manquants {sorted(missing_cols)}.")
        else:
            oks.append(f"Champs pipeline temporel {table} OK (7/7).")

        idx = {i["name"]: i for i in insp.get_indexes(table)}
        dedup_name = EXPECTED_DEDUP_INDEXES[table]
        if dedup_name not in idx:
            failures.append(f"Index dedup {dedup_name} absent sur {table}.")
        elif not idx[dedup_name].get("unique"):
            failures.append(f"Index dedup {dedup_name} non unique sur {table}.")
        else:
            oks.append(f"Index dedup unique {dedup_name} OK.")

    # 3) Contraintes d'unicité audit (sequence + entry_hash) ------------------
    if "audit_logs" in tables:
        audit_idx = insp.get_indexes("audit_logs")
        unique_cols = {
            tuple(i["column_names"]) for i in audit_idx if i.get("unique")
        }
        uniq_constraint_cols = {
            tuple(u["column_names"]) for u in insp.get_unique_constraints("audit_logs")
        }
        all_unique = unique_cols | uniq_constraint_cols
        for col in ("sequence", "entry_hash"):
            if (col,) in all_unique:
                oks.append(f"Contrainte d'unicité audit_logs.{col} OK.")
            else:
                failures.append(f"Contrainte d'unicité audit_logs.{col} absente.")
    else:
        failures.append("Table audit_logs absente — contraintes audit non vérifiables.")

    # 4) Clés étrangères critiques --------------------------------------------
    critical_fks = {
        "patients": "users",
        "clinician_profiles": "users",
        "recommendations": "patients",
        "cgm_readings": "patients",
    }
    for table, target in critical_fks.items():
        if table not in tables:
            continue
        fk_targets = {fk["referred_table"] for fk in insp.get_foreign_keys(table)}
        if target in fk_targets:
            oks.append(f"FK {table} -> {target} OK.")
        else:
            failures.append(f"FK {table} -> {target} absente.")

    # Rapport ------------------------------------------------------------------
    print("=== Smoke test PostgreSQL — schéma Alembic ===")
    print(f"URL : {url.split('@')[-1] if '@' in url else url}")
    print()
    for line in oks:
        print(f"  [OK]   {line}")
    for line in failures:
        print(f"  [FAIL] {line}")
    print()
    if failures:
        print(f"RÉSULTAT : ÉCHEC ({len(failures)} problème(s)).")
        return 1
    print("RÉSULTAT : OK — schéma PostgreSQL conforme aux migrations.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
