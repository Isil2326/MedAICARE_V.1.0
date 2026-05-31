# Rapport — Phase 1 : Data Engineering & Pipeline temporel

> **Statut :** livré, testé (66 tests verts), validé sur PostgreSQL dev (Replit).
> **Posture :** prototype académique honnête · **open-loop strict** · **données
> simulées uniquement (`is_synthetic=True`)** · **non certifié**.
> **À valider par l'utilisateur avant tout passage en Phase 2.**

Ce rapport suit le **livrable en 14 points** convenu.

---

## 1. Objectif de la phase
Construire un socle de **data engineering temporel** robuste, testable et
**anti-leakage**, préparant le terrain ML/XAI **sans** introduire de modèle réel.
Contraintes non négociables respectées : simulation only, open-loop, pas de
ML/XAI, pas de mobile, RBAC + ownership + audit + Pydantic strict.

## 2. Périmètre réellement implémenté
- 4 tables d'événements enrichies d'un mixin pipeline (7 colonnes de traçabilité).
- Migration Alembic additive non destructive (appliquée sur PG).
- Contrats Pydantic v2 stricts + validation timestamps + bornes physiologiques.
- Repository + service (ownership, dedup idempotent, quality_flag, audit, commit).
- Module de feature engineering **pur** anti-leakage.
- 9 routes REST d'ingestion/lecture sous `/api/v1/timeseries`.
- Seed synthétique 3 profils multi-jours, idempotent.
- 34 nouveaux tests (66 au total).

## 3. Hors périmètre (assumé)
ML/XAI réel, partitionnement TimescaleDB actif, mobile Expo, source de données
réelle, certification réglementaire.

## 4. Modèle de données
Mixin `_TimeseriesPipelineMixin` : `source`, `external_event_id`, `device_id`,
`quality_flag`, `ingestion_batch_id`, `unit`, `event_metadata`. Index
`(patient_id, ts)` par table + index unique partiel de déduplication sur
`(patient_id, source, external_event_id)`. Détail : `PHASE_1_DATA_ENGINEERING.md` §2.

## 5. Migration
`a1b2c3d4e5f6_phase1_timeseries_pipeline` (down_revision `8e901cc3bbbc`).
**Additive** (`ADD COLUMN` + `CREATE INDEX`), **non destructive**, **rejouable**.
`alembic upgrade head` OK sur PostgreSQL. `smoke_postgres.py` vérifie les 7
colonnes + les index de dedup.

## 6. Décision TimescaleDB
Extension disponible (2.13.0) mais **hypertables écartées** : PK composite `(id,ts)`
= changement destructif interdit, et conflit FK avec `predictions`. **Repli
PostgreSQL standard** + architecture TimescaleDB-ready (index `(patient_id, ts)`,
types tz-aware) + chemin d'évolution documenté. Détail §3 du doc technique.

## 7. Validation des entrées
`normalize_utc()` : tz-aware obligatoire (rejet du naïf), normalisation UTC, rejet
futur (>2 min) et antérieur à 2000, `start <= end`. Bornes physiologiques :
CGM 30–600 mg/dL, insuline 0–100 U, glucides 0–300 g, durée 0–1440 min.
`extra="forbid"` sur tous les schémas.

## 8. Pipeline d'ingestion
Repository (accès pur) → Service (ownership, dedup idempotent, quality_flag,
audit, commit) → API. Réponse `IngestionResult` : **201** si créé, **200** si
doublon idempotent (même `id` renvoyé, aucun doublon en base).

## 9. Sécurité (RBAC + ownership + audit)
Patient : écrit/lit **uniquement son dossier**. Clinicien/Admin : **lecture seule**
avec `patient_id` explicite (400 sans, 403 si patient écrit). Non authentifié :
401. Chaque écriture → audit `timeseries.<kind>.create` (chaîne append-only
existante réutilisée).

## 10. Feature engineering anti-leakage
Fonctions **pures** uniquement (aucun ML). `compute_features(at, …)` **refuse** une
série contenant un point `ts > at`. Toutes les fenêtres ne lisent que `ts <= at`.
Couverture : rolling mean/std, slope, dG/dt, deltas 15/30/60, TIR glissant,
time_since_meal/insulin, post-prandial/insulin, hour/day/night, count, gap flag.

## 11. Données simulées
Seed `seed_timeseries.py` : profils stable / hypo-prone / hyper-prone, 3 jours,
pas 15 min, repas + insuline + activité cohérents. **`is_synthetic=True`
partout.** **Idempotent** (vérifié : 960 CGM stables sur 2 exécutions).

## 12. Tests
**66 tests verts** (32 Phase 0/0.1 préservés + 34 Phase 1) sur SQLite isolée :
`test_timeseries`, `test_timeseries_schemas`, `test_features`, `test_antileakage`.
Commande : `cd backend && python -m pytest -q`.

## 13. Documentation
- `docs/migration/PHASE_1_DATA_ENGINEERING.md` (technique : modèle, TimescaleDB,
  timestamps, anti-leakage, RBAC, seed, limites).
- `backend/README.md` mis à jour (endpoints `/timeseries`).
- Ce rapport (`RAPPORT_PHASE_1.md`).

## 14. Limites & reste-à-faire (honnêteté)
- **Aucun ML/XAI** : seules les features sont préparées.
- **Données 100 % simulées**, aucune validité clinique.
- **Pas de partitionnement temporel actif** (repli PG standard).
- **Non certifié** (MDR, IEC 62304, ISO 13485, HDS, GDPR opérationnel).
- **Reste à faire (Phase 2, après validation utilisateur)** : couche ML/XAI réelle
  (entraînement/inférence), évaluation, et activation TimescaleDB si la volumétrie
  l'exige (via migration dédiée non destructive).

---

### Commandes de vérification
```bash
cd backend && alembic upgrade head          # migration (PostgreSQL)
cd backend && python -m app.seed            # seed idempotent
cd backend && python -m scripts.smoke_postgres   # smoke colonnes + index
cd backend && python -m pytest -q           # 66 tests verts
```
