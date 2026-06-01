# MediAI Care — Couverture d'audit (API v1)

> Prototype non certifié · open-loop · données synthétiques. Phase 5.

## Nature du journal
Journal **append-only chaîné** : chaque entrée référence le hash de la précédente
(SHA-256), avec contraintes d'unicité anti-fork. Vérifiable via `GET /audit-logs/verify`
(`{valid: bool, ...}`). **Aucun secret** (mot de passe, jeton access/refresh) n'est écrit
dans `event_metadata` — vérifié par test de non-régression.

## Actions auditées par domaine

### Authentification
| Action | Déclencheur |
|---|---|
| `user.register` | Inscription patient/clinicien |
| `auth.login` | Connexion réussie |
| `auth.login_failed` | Échec d'identifiants |
| `auth.refresh` | Rotation de refresh réussie |
| `auth.refresh_reuse_detected` | Réutilisation d'un refresh révoqué (→ révocation globale) |
| `auth.logout` | Déconnexion (révocation du refresh courant) |

### Patients
| Action | Déclencheur |
|---|---|
| `patient.list` | Liste (clinicien/admin) |
| `patient.read_self` | Lecture de son propre dossier (patient) |
| `patient.read` | Lecture d'un dossier (clinicien/admin ou self) |

### Timeseries (écritures)
| Action | Déclencheur |
|---|---|
| `timeseries.cgm.create` | Ingestion CGM |
| `timeseries.insulin.create` | Ingestion insuline |
| `timeseries.meal.create` | Ingestion repas |
| `timeseries.activity.create` | Ingestion activité |

> Les **lectures** de séries ne sont pas auditées individuellement (volume) ; les écritures le sont systématiquement.

### ML / XAI (inférence)
| Action | Déclencheur |
|---|---|
| `ml.predict` | Chaque appel `POST /ml/predict` (systématique) |
| `xai.explain` | Chaque explication locale `POST /xai/explain` |
| `xai.global` | Lecture/régénération de l'explication globale |

### Recommandations
| Action | Déclencheur |
|---|---|
| `recommendation.generated` | Suggestion générée (naît `pending`) |
| `recommendation.safety_blocked` | Texte bloqué par la safety (génération **ou** `modify`) |
| `recommendation.generate_skipped` | Génération sans déclenchement de règle |
| `recommendation.approved` | Validation clinicien |
| `recommendation.rejected` | Refus clinicien |
| `recommendation.modified` | Amendement clinicien (re-validé par la safety) |

## Invariants
- **Écritures et inférences** systématiquement auditées (création de données, prédiction, explication, décision clinicien).
- **Traçabilité décisionnelle** : tout le cycle de vie d'une recommandation (`generated → approved|rejected|modified`) est journalisé.
- **Intégrité** : chaînage SHA-256 + vérification dédiée ; toute insertion hors-séquence est détectable.
- **Confidentialité** : pas de secret ni de PII sensible dans les métadonnées d'audit.
