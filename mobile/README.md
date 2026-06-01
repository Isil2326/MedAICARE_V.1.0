# MediAI Care — Application mobile (Phase 6)

Application **Expo + React Native (TypeScript)** patient/clinicien du prototype
MediAI Care. Elle consomme **exclusivement** l'API backend FastAPI v1 validée en
Phase 5. Aucune logique clinique, aucun calcul de risque et aucune génération de
recommandation ne sont effectués localement : **l'API est la source de vérité**.

> ⚠️ **Prototype académique — non certifié.** Données 100 % simulées
> (synthétiques). Open-loop strict : aucune dose, aucune décision automatique,
> aucune instruction thérapeutique. Ne remplace pas un avis médical.

## Stack

| Domaine        | Choix                                              |
| -------------- | -------------------------------------------------- |
| Framework      | Expo (SDK géré) · React Native · TypeScript strict |
| Navigation     | Expo Router (file-based, `src/app/`)               |
| Données réseau | `fetch` typé maison + TanStack Query (cache)       |
| État auth      | Contexte React (`src/store/auth.tsx`)              |
| Secrets        | `expo-secure-store` (Keychain/Keystore) — natif    |
| Tests          | Jest + `jest-expo` + Testing Library (RN)          |

Aucune librairie lourde non justifiée. Pas de state-manager global externe : le
seul état partagé (auth) tient dans un contexte ; le reste est géré par TanStack
Query (cache serveur).

## Installation

```bash
cd mobile
npm install
```

## Configuration API

L'URL du backend provient **uniquement** de la variable d'environnement Expo
`EXPO_PUBLIC_API_BASE_URL` (racine du serveur, sans `/api/v1`). **Aucune URL n'est
codée en dur.** Si la variable est absente, l'app ne plante pas : le client API
renvoie une erreur explicite et non technique (« L'adresse du serveur n'est pas
configurée… »).

```bash
# Exemple (dev Replit) — injecté automatiquement par le workflow « Mobile App »
EXPO_PUBLIC_API_BASE_URL="https://<replit-dev-domain>:8000"
```

Paramètres réseau (`src/config/env.ts`) : timeout 15 s, 1 retry réseau sur GET
idempotents, refresh automatique sur 401.

## Lancement

### Sur Replit (preview = Expo Web)

Deux workflows tournent en parallèle :

1. **Backend API** — `uvicorn` sur le port **8000** (injecte `CORS_ORIGINS` pour
   autoriser l'origine du preview Expo).
2. **Mobile App** — `expo start --web` sur le port **5173**, avec
   `EXPO_PUBLIC_API_BASE_URL` pointant vers le backend.

```bash
# équivalent manuel du workflow Mobile App
cd mobile && EXPO_PUBLIC_API_BASE_URL="https://$REPLIT_DEV_DOMAIN:8000" \
  npx expo start --web --port 5173
```

Ouvrir le port **5173** dans le preview Replit. Identifiants de démo :
`patient@demo.fr` / `clinicien@demo.fr` (mot de passe `DemoMediAI2026!`).

### Sur device (iOS/Android)

`npx expo start` puis scan du QR avec Expo Go. **Indisponible dans ce repo Replit
combiné** (voir « Compatibilité Replit »).

## Sécurité des jetons

- Jetons access/refresh stockés via `expo-secure-store` (Keychain iOS / Keystore
  Android, **chiffrés**).
- **Jamais** d'`AsyncStorage`, **jamais** de `localStorage` (le module n'importe
  même pas `AsyncStorage`).
- **Web** : `expo-secure-store` se rabattrait sur `localStorage` (interdit) → on
  utilise un **stockage mémoire volatil** (perdu au rafraîchissement). Limitation
  documentée et **testée** (`secureStore.web.test.ts`).
- Aucun jeton, mot de passe ou donnée sensible n'est journalisé.
- `logout` efface tous les secrets ; un refresh échoué efface aussi les secrets et
  renvoie vers l'écran de connexion.

## Navigation par rôle

- **Non authentifié** → `login`. Inscription clinicien **désactivée** côté mobile
  (note de démo) ; on s'appuie sur les comptes de démo seedés par le backend.
- **Patient** → onglets : Aujourd'hui · Données · Risque · XAI · Recommandations ·
  Profil.
- **Clinicien/admin** → onglets : Patients · Recommandations · XAI · Profil (+
  écran Détail patient).

Le rôle est lu depuis `/auth/me` (API) ; le routage RBAC est appliqué à la fois
côté navigation (écrans visibles) **et** côté serveur (autorité).

## Écrans

| Espace    | Écran             | Contenu clé                                                                 |
| --------- | ----------------- | --------------------------------------------------------------------------- |
| Patient   | Aujourd'hui       | Disclaimer, profil, dernier CGM, état réseau/API, accès rapides             |
| Patient   | Données           | CGM / repas / insuline / activité par fenêtre (liste structurée)            |
| Patient   | Risque            | `ml/predict` : probabilité, target, horizon, modèle, open-loop, synthétique |
| Patient   | XAI               | reliability_status, warnings, semantic_limitations, calibration, texte      |
| Patient   | Recommandations   | **approuvées uniquement** (`/recommendations/mine`)                         |
| Clinicien | Patients          | Liste + recherche + badges synthétiques                                     |
| Clinicien | Détail patient    | Profil, séries, risque, XAI, recommandations                                |
| Clinicien | Recommandations   | Lister/filtrer, générer, approuver/rejeter/modifier (+ open-loop)           |
| Clinicien | XAI               | Local + global, reliability/warnings/limites, jamais de causalité           |

Si `xai_reliability_status === not_reliable_for_clinical_interpretation`, un
**avertissement visuel fort** est affiché (`XaiWarningBox`).

## Gestion des erreurs

Chaque statut est traduit en message **non technique** sans masquer le critique :
400 (demande invalide), 401 (session expirée → refresh ou reconnexion), 403
(droits insuffisants), 404 (introuvable), 409 (déjà traité), 422 (saisie
invalide), 429 (trop de requêtes), 503 (service indisponible), réseau/timeout,
refresh expiré, et `API_BASE_URL` manquante.

## Offline minimal

Cache **mémoire** via TanStack Query + bannière hors-ligne (`useOnline`) qui
désactive les actions réseau. **Interdit** (et absent) : file locale de
recommandations, décisions offline, stockage durable de données sensibles en clair.

## Checklist accessibilité

- [x] **Boutons avec texte** — chaque action a un libellé textuel (pas d'icône
      seule pour une action critique).
- [x] **`accessibilityRole`** sur boutons, en-têtes, alertes (`Button`,
      `XaiWarningBox`, `States`, actions de reco).
- [x] **`accessibilityState`** (disabled/busy) sur les boutons et actions réseau.
- [x] **Zones tactiles suffisantes** — hauteur min ≥ 44 px sur les boutons.
- [x] **Taille de texte lisible** — corps 16 px, légende 12 px min ; interlignage
      confortable (`theme.type`).
- [x] **Contraste** — texte `#0F172A` sur fond clair ; couleurs de risque/état
      assombries (ex. élevé `#B91C1C`, modéré `#B45309`) pour le ratio AA.
- [x] **Pas d'info critique uniquement par couleur** — risque et fiabilité XAI
      portent toujours un **libellé texte** + icône en plus de la couleur.
- [x] **Messages d'erreur lisibles** — texte clair, pas de jargon technique.
- [x] **Dynamic type** — tailles relatives respectées (pas de hauteur de texte
      figée) ; `allowFontScaling` par défaut RN conservé.
- [ ] **Audit lecteur d'écran (VoiceOver/TalkBack)** — non réalisable sur le
      preview web Replit ; à conduire sur device (limitation documentée).

## Tests

```bash
cd mobile
npm test           # ou: npx jest --ci --runInBand
npx tsc --noEmit   # typecheck strict (rc=0)
```

**7 suites / 29 tests verts** : client API (mapping 400→503/réseau, Bearer,
refresh+rejeu, refresh échoué→effacement), token storage natif (SecureStore) et
web (mémoire, jamais localStorage), login/logout (efface secrets), RBAC
recommandations (patient→`/mine`, clinicien→actions), garde statique « aucun jeton
fuité » (scan source : pas d'`AsyncStorage`/`localStorage` pour les jetons),
composants (disclaimers, XAI warnings, reco approuvée).

## Compatibilité Replit

- **Preview = Expo Web** (port 5173). Le tunnel device (QR / Expo Go), les builds
  natifs (EAS), la caméra, les push natifs et le Keychain/Keystore réel **ne sont
  pas exerçables** dans ce repo combiné Vite+FastAPI → documentés comme limitations.
- L'outil de capture d'écran du workspace cible l'app React du port 5000, **pas**
  Expo Web (5173) : pas de screenshot automatisé de l'app mobile ; on s'appuie sur
  le bundle propre + les tests.
- La sécurité n'est **jamais** contournée pour faciliter le preview (le repli
  mémoire web est plus strict que `localStorage`, pas moins).

## Prochaines étapes (Phase 7 — NON démarrée)

Voir `docs/mobile/PHASE_6_MOBILE_APP.md`. Aucune action Phase 7 n'est entreprise
sans validation explicite du superviseur.
