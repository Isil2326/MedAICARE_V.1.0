# Phase 1 — Data Engineering & Pipeline temporel

> **Statut :** livré et testé en environnement Replit (dev).
> **Périmètre :** option 2 du `PROMPT_RECADRE_MIGRATION` — construire un **socle
> temporel robuste, testable, anti-leakage**, prêt pour une future couche ML/XAI,
> **sans** introduire de ML/XAI réel à ce stade.
> **Posture :** prototype académique honnête, **open-loop strict**, **données
> simulées uniquement (`is_synthetic=True`)**, **non certifié**.

---

## 1. Objectif et contraintes non négociables

| Contrainte | Application en Phase 1 |
|---|---|
| Données simulées uniquement | Tout événement est `is_synthetic=True`. Aucun branchement vers une source réelle (IoMT, capteur). |
| Open-loop strict | Le pipeline **ingère et calcule des features** ; il ne déclenche **aucune** recommandation ni action thérapeutique. |
| Pas de ML/XAI réel | `feature_engineering.py` ne contient **que des fonctions pures** de préparation (statistiques de fenêtre). Aucun modèle, aucun entraînement, aucune inférence. |
| Pas de mobile Expo | Hors périmètre de cette phase. |
| RBAC + ownership + audit + Pydantic | Imposés sur toutes les routes d'écriture/lecture (voir §5). |

---

## 2. Modèle de données temporel

Les 4 tables d'événements (`cgm_readings`, `insulin_events`, `meal_events`,
`activity_events`) partagent désormais un **mixin pipeline** (`_TimeseriesPipelineMixin`)
qui ajoute les colonnes de traçabilité d'ingestion :

| Colonne | Rôle |
|---|---|
| `source` | Origine logique de l'événement (`manual`, `sim`, …), indexée. |
| `external_event_id` | Identifiant fourni par la source amont, support de l'idempotence. |
| `device_id` | Identifiant de l'appareil émetteur (était absent sur 3 tables sur 4). |
| `quality_flag` | Marqueur qualité (`valid`, `suspect`, …) posé côté service, jamais correctif (open-loop). |
| `ingestion_batch_id` | Regroupe les événements d'un même lot d'ingestion. |
| `unit` | Unité explicite de la mesure. |
| `event_metadata` | JSON libre (contexte non structuré). |

La migration `a1b2c3d4e5f6_phase1_timeseries_pipeline` est **additive et
non destructive** (`ADD COLUMN` + `CREATE INDEX` uniquement), **rejouable**, et
appliquée sur PostgreSQL (`alembic upgrade head`). `down_revision = 8e901cc3bbbc`.

### Déduplication / idempotence
Chaque table porte un **index unique partiel** sur `(patient_id, source,
external_event_id)` limité aux lignes où `external_event_id IS NOT NULL`
(portable PostgreSQL via `postgresql_where`, SQLite via `sqlite_where`). Couplé à
la détection de doublon logique côté service (même patient, même `ts`, même
mesure), il garantit qu'un même événement réémis n'est **jamais** dupliqué.

---

## 3. Décision TimescaleDB vs repli PostgreSQL standard

L'extension **TimescaleDB 2.13.0 est disponible** dans l'image mais **non
installée** dans la base de dev. La conversion des tables en *hypertables* a été
**volontairement écartée** :

1. Une hypertable impose une **clé primaire composite incluant la colonne de
   temps** (`(id, ts)`). Migrer les PK existantes serait un **changement
   destructif** — interdit par le cahier des charges.
2. La table `predictions` porte des **clés étrangères** vers les tables
   d'événements ; transformer ces tables en hypertables entrerait en conflit
   avec ces FK.

**Choix retenu : repli PostgreSQL standard**, avec une architecture
**TimescaleDB-ready** :
- index `(patient_id, ts)` sur chaque table (`ix_<kind>_patient_ts`) — le motif
  de requête dominant (fenêtre temporelle par patient) est déjà optimisé ;
- types portables `DateTime(timezone=True)` — compatibles hypertable ;
- aucune logique applicative ne dépend de l'absence de partitionnement.

**Chemin d'évolution documenté :** quand une hypertable deviendra nécessaire
(volumétrie), elle se fera via une **migration dédiée** créant une nouvelle table
partitionnée + backfill, sans casser les PK actuelles ni les FK de `predictions`.

---

## 4. Validation stricte des timestamps

Centralisée dans `normalize_utc()` (`app/schemas/timeseries.py`), appliquée à
**tout** timestamp entrant (ingestion et fenêtres de requête) :

- **timezone-aware obligatoire** — un timestamp naïf est **rejeté (422)**. Raison :
  un instant sans fuseau est ambigu et corromprait silencieusement l'axe temporel
  du pipeline. Le client doit envoyer un offset explicite (`…+00:00`).
- **normalisation systématique en UTC** avant stockage ;
- **rejet du futur aberrant** au-delà d'une tolérance d'horloge de 2 min
  (`FUTURE_TOLERANCE`) — un événement « futur » n'a pas de sens physique ;
- **rejet de l'antérieur aberrant** avant `MIN_TS` (2000-01-01) ;
- **cohérence `start <= end`** pour les fenêtres de requête (400 sinon).

### Bornes physiologiques (rejet 422)
| Mesure | Bornes acceptées |
|---|---|
| Glycémie CGM | 30 – 600 mg/dL |
| Insuline | 0 (exclu) – 100 U |
| Glucides repas | 0 – 300 g |
| Durée activité | 0 (exclu) – 1440 min |

Les valeurs **physiologiquement impossibles** sont refusées ; les valeurs
plausibles mais extrêmes sont acceptées et peuvent être **signalées** via
`quality_flag` (jamais corrigées — open-loop).

---

## 5. Pipeline d'ingestion : repository / service / API

- **`repositories/timeseries_repo.py`** — accès données pur : `find_by_external_id`,
  `find_logical_duplicate`, `query_window`, `query_all_kinds_window`,
  table `MODEL_BY_KIND`.
- **`services/timeseries_service.py`** — orchestration : vérification
  **ownership**, **déduplication idempotente** (renvoie l'événement existant sans
  doublon), pose du `quality_flag`, **écriture d'audit**, `commit`.
- **`api/v1/timeseries.py`** — 9 routes :
  `POST/GET /timeseries/{cgm,insulin,meals,activity}` + `GET /timeseries/events`
  (vue consolidée multi-types). Réponse d'ingestion `IngestionResult`
  (`created` / `duplicate` / `id` / `quality_flag`) : **201** si créé, **200** si
  doublon idempotent.

### RBAC & ownership (côté serveur)
| Acteur | Écriture | Lecture |
|---|---|---|
| Patient | **son propre** dossier uniquement | **son propre** dossier uniquement |
| Clinicien / Admin | **interdite (403)** | autorisée **avec `patient_id` explicite** (400 si absent) |
| Non authentifié | **401** | **401** |

Toute écriture produit une entrée d'**audit** (`timeseries.<kind>.create`).

---

## 6. Feature engineering anti temporal leakage

`services/feature_engineering.py` ne contient **que des fonctions pures** (aucun
état, aucun I/O, aucun ML). Garantie centrale : **aucune donnée future ne peut
influencer une feature calculée à l'instant T**.

- `assert_no_future(points, at)` lève si un point a `ts > at`.
- `compute_features(at, …)` **refuse explicitement** toute série contenant un
  point futur (garde anti-leakage testée).
- Les fonctions de fenêtre (`rolling_mean`, `rolling_std`, `glucose_slope`,
  `dg_dt`, `delta_over`, `tir_rolling`, `time_since_last`, `post_event_flag`,
  `cgm_count_in_window`, `cgm_gap_flag`, calendaires `hour_of_day` / `day_of_week`
  / `night_flag`) ne considèrent **que** les points `ts <= at`.

**Test de non-régression de leakage** : ajouter un point strictement postérieur à
T ne modifie **aucune** feature calculée à T (`test_antileakage.py`).

---

## 7. Seed temporel synthétique

`app/seed_timeseries.py` (câblé dans `app/seed.py`) crée **3 profils** sur
`DAYS = 3` jours, pas de 15 min :

| Profil | Email | Comportement glycémique |
|---|---|---|
| stable | `patient.stable@demo.fr` | majoritairement dans la cible |
| hypo-prone | `patient.hypo@demo.fr` | hypoglycémies nocturnes (~03 h) |
| hyper-prone | `patient.hyper@demo.fr` | excursions post-prandiales (~14 h / 21 h) |

Repas, insuline et activité sont générés en cohérence. **Tout est
`is_synthetic=True`.** Le seed est **idempotent** : réexécuté, il ne crée aucun
doublon (vérifié — 960 lectures CGM stables sur deux exécutions consécutives).

---

## 8. Qualité

- **66 tests pytest** verts sur base SQLite isolée (32 Phase 0/0.1 + 34 Phase 1) :
  `test_timeseries` (ingestion, RBAC, ownership, audit, bornes, UTC, dedup,
  fenêtre), `test_timeseries_schemas`, `test_features`, `test_antileakage`.
- `scripts/smoke_postgres.py` étendu : vérifie les 7 colonnes pipeline + les
  index de déduplication sur PostgreSQL réel.

---

## 9. Limites assumées (honnêteté académique)

- **Aucun ML/XAI** : seules les *features* sont préparées. Aucun modèle n'est
  entraîné ni servi.
- **Données 100 % simulées** : les profils sont des générateurs déterministes, pas
  des patients réels ; aucune validité clinique.
- **Pas de partitionnement temporel actif** (repli PostgreSQL standard, voir §3).
- **Non certifié** (MDR, IEC 62304, ISO 13485, HDS, GDPR opérationnel).
