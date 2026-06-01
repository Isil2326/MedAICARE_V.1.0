# Script de démonstration end-to-end — backend + mobile

> **Phase 7 — QA / validation E2E.** Prototype académique NON certifié · données 100 %
> synthétiques · open-loop strict · API = source de vérité. Ce script décrit le
> parcours complet patient et clinicien à exécuter **manuellement** dans
> l'environnement Replit (preview Expo Web). Aucune donnée réelle, aucune dose,
> aucune décision automatique.

## 0. Pré-requis & lancement

| Élément | Commande / action |
|---|---|
| Backend (port 8000) | workflow **« Backend API »** (`uvicorn app.main:app --host 0.0.0.0 --port 8000`) |
| Migrations + seed synthétique | `cd backend && alembic upgrade head && python -m app.seed` |
| Seed séries temporelles v2 | `cd backend && python -m app.seed_timeseries` (10 profils, 14 j, CGM 5 min) |
| Mobile (port 5173) | workflow **« Mobile App »** (`npx expo start --web --port 5173`, `EXPO_PUBLIC_API_BASE_URL` → backend) |
| Vérif santé backend | `GET /health` → 200 ; `GET /ready` → 200 (503 si DB indisponible) |

**Identifiants démo** : `patient@demo.fr` / `clinicien@demo.fr` — mot de passe
`DemoMediAI2026!` (≥ 12 caractères). L'inscription clinicien est désactivée **dans
l'app mobile de démo** (aucun flux exposé ; l'endpoint backend existe toujours).

**Attendus transverses à vérifier sur CHAQUE écran** : bannière conformité
(synthétique / non certifié / open-loop) visible · aucun conseil de dose · aucune
instruction thérapeutique locale · jetons jamais affichés/loggés.

---

## 1. Parcours PATIENT

| # | Étape | Action mobile | Endpoint API | Attendu |
|---|---|---|---|---|
| 1 | Lancer backend | workflow « Backend API » | — | `/health` 200 |
| 2 | Lancer mobile | workflow « Mobile App » | — | écran **Login** visible |
| 3 | Login patient | saisir `patient@demo.fr` / mot de passe → Se connecter | `POST /auth/login` puis `GET /auth/me` | redirection vers l'espace patient `(patient)` |
| 4 | Profil | onglet **Profil** | `GET /patients/me` | identité + rappels de conformité + bouton Déconnexion |
| 5 | Données temporelles | onglet **Données** | `GET /timeseries/{cgm,insulin,meals,activity}` | listes CGM/repas/insuline/activité (badges synthétiques) |
| 6 | Prédiction ML | onglet **Risque** → choisir cible/horizon | `POST /ml/predict` | probabilité + `target`/`horizon`/modèle + `open_loop_notice` + `is_synthetic` ; **aucun conseil** |
| 7 | XAI locale | onglet **XAI** | `POST /xai/explain` | top features + `xai_reliability_status` + warnings + limites + texte non causal ; **alerte forte** si `not_reliable_for_clinical_interpretation` |
| 8 | Recommandations approuvées | onglet **Recommandations** | `GET /recommendations/mine` | **uniquement** les recos `approved` ; rappel open-loop |
| 9 | Logout | Profil → Déconnexion | `POST /auth/logout` | retour **Login** ; secrets effacés (même si l'appel réseau échoue) |

**Contrôles RBAC patient** : aucune action de génération/approbation visible ; les
endpoints cliniciens renvoient 403 (mappé en message FR non technique) ; XAI globale
inaccessible.

---

## 2. Parcours CLINICIEN

| # | Étape | Action mobile | Endpoint API | Attendu |
|---|---|---|---|---|
| 1 | Login clinicien | `clinicien@demo.fr` / mot de passe | `POST /auth/login` + `GET /auth/me` | espace `(clinician)` |
| 2 | Liste patients | onglet **Patients** (+ recherche) | `GET /patients` | cohorte + badges synthétiques |
| 3 | Détail patient | ouvrir une carte patient | `GET /patients/{id}` | dossier (profil/séries) |
| 4 | Séries | section données du détail | `GET /timeseries/* ?patient_id=` | séries du patient ciblé |
| 5 | Prédiction | bouton estimation | `POST /ml/predict` (`patient_id` requis) | probabilité + open-loop notice |
| 6 | XAI locale | section XAI du détail | `POST /xai/explain` | attribution + reliability + warnings |
| 7 | Générer reco | bouton Générer | `POST /recommendations/generate` | suggestion créée en **`pending`** (jamais auto-approuvée) ; safety appliquée (dose/terme interdit → 400 `safety_blocked`) |
| 8 | Modifier (si applicable) | éditer le message | `POST /recommendations/{id}/modify` | passe `modified` ; **safety revalidée** (texte + note) |
| 9 | Approuver / Rejeter | bouton dédié | `POST /recommendations/{id}/approve` ou `/reject` | transition gardée `pending|modified → approved|rejected` |
| 10 | Vérif côté patient | se reconnecter en patient → Recommandations | `GET /recommendations/mine` | **seule** la reco `approved` apparaît (une reco `rejected`/`pending` n'apparaît pas) |
| 11 | Audit (si exposé) | — | (backend) `audit_service.verify_chain` | journal append-only chaîné SHA-256 (intégrité vérifiable) |
| 12 | Logout | Profil → Déconnexion | `POST /auth/logout` | retour Login ; secrets effacés |

**Contrôles RBAC clinicien** : `GET /recommendations` (liste complète) autorisé ;
XAI globale (`GET /xai/global`) autorisée ; un patient sur ces mêmes routes → 403.

---

## 3. Points de validation transverses (à cocher pendant la démo)
- [ ] Bannières conformité visibles partout (synthétique / non certifié / open-loop).
- [ ] Aucune dose, aucune instruction thérapeutique locale.
- [ ] Probabilités/XAI/recos proviennent **exclusivement** de l'API (aucun calcul local).
- [ ] Patient ne voit que ses données + recos **approuvées**.
- [ ] Refresh automatique sur 401 transparent ; échec refresh → retour Login.
- [ ] Logout efface les secrets (vérifiable : après logout, relancer une requête → Login).
- [ ] Erreurs API (401/403/429/503/réseau) → messages FR non techniques, sans masquer le critique.
- [ ] XAI : warnings et statut de fiabilité affichés ; jamais de causalité.

Voir aussi : `docs/qa/MOBILE_QA_CHECKLIST.md` (checklist détaillée) et
`docs/demo/SCREEN_WALKTHROUGH.md` (structure écran par écran).

---

## Note Phase 8.5.1 — Web = portail, Mobile = app principale

Le **web** (port 5000) est désormais un **portail institutionnel** de présentation
(hero, posture synthétique/open-loop/non certifié, accès mobile, limites,
architecture, documentation). L'**application réelle** patient/clinicien est
l'**app mobile** (Expo Web, port 5173 ; lien « Ouvrir l'app mobile » depuis le
portail). Le login web n'est conservé que comme **« Démo web (legacy) »**
secondaire (footer du portail). Détails : `docs/web/WEB_PORTAL_STRATEGY.md`.
