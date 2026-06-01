# MediAI Care — Matrice RBAC & Ownership (API v1)

> Prototype non certifié · open-loop · données synthétiques. Phase 5.
> Contrôle **côté serveur** : `require_role(...)` (rôle) + `resolve_read_scope(...)` /
> vérifications d'ownership (périmètre des données). Deny-by-default.

## Rôles
- **patient** — accède **uniquement** à son propre dossier (lecture/écriture de ses séries, lecture de ses recommandations approuvées).
- **clinician** — lecture transverse des patients, génère/valide les recommandations, lit l'audit et la XAI globale.
- **admin** — sur-ensemble fonctionnel du clinicien pour ce périmètre (mêmes droits de lecture/validation).
- **none** — non authentifié (meta + register + login/refresh).

## Matrice (✓ autorisé · — interdit · *self* = limité à son dossier)

| Ressource / action | none | patient | clinician | admin |
|---|:--:|:--:|:--:|:--:|
| `GET /health`, `/ready`, `/` | ✓ | ✓ | ✓ | ✓ |
| `POST /auth/register/*` | ✓ | ✓ | ✓ | ✓ |
| `POST /auth/login`, `/auth/refresh` | ✓ | ✓ | ✓ | ✓ |
| `POST /auth/logout`, `GET /auth/me` | — | ✓ | ✓ | ✓ |
| `GET /patients` (liste) | — | — | ✓ | ✓ |
| `GET /patients/me` | — | ✓ | — | — |
| `GET /patients/{id}` | — | *self* | ✓ | ✓ |
| `POST /timeseries/*` (écriture) | — | *self* | — | — |
| `GET /timeseries/*` (lecture) | — | *self* | ✓ (`patient_id`) | ✓ (`patient_id`) |
| `POST /ml/predict` | — | *self* | ✓ (`patient_id`) | ✓ (`patient_id`) |
| `POST /xai/explain` | — | *self* | ✓ (`patient_id`) | ✓ (`patient_id`) |
| `GET /xai/global` | — | — | ✓ | ✓ |
| `POST /recommendations/generate` | — | — | ✓ | ✓ |
| `GET /recommendations` (filtré) | — | — | ✓ | ✓ |
| `GET /recommendations/mine` | — | ✓ (approuvées) | — | — |
| `GET /recommendations/{id}` | — | *self* (approuvée) | ✓ | ✓ |
| `POST /recommendations/{id}/approve\|reject\|modify` | — | — | ✓ | ✓ |
| `GET /audit-logs`, `/audit-logs/verify` | — | — | ✓ | ✓ |

## Règles d'ownership
- **Patient** : `patient_id` implicite (sa propre identité) ; toute tentative d'accès à un autre dossier → 403/404 (deny-by-default, pas de fuite d'existence).
- **Clinicien/Admin** : `patient_id` **explicite obligatoire** pour les lectures de séries et l'inférence ML/XAI.
- **Écriture timeseries** : réservée au patient propriétaire ; clinicien/admin ne créent pas de données patient.
- **Recommandations** : la génération et la validation sont réservées clinicien/admin ; le patient ne voit que les recommandations **approuvées** le concernant (via `/mine` et `/{id}`).

## Décision de conception (RBAC recommandations)
`GET /recommendations` reste **clinicien/admin** (préserve la sémantique 403 pour un
patient) ; le patient passe par `GET /recommendations/mine`. Cela évite d'élargir une
route transverse tout en donnant au patient un accès cadré à ses suggestions approuvées.
