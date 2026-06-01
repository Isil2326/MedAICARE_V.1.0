# RAPPORT PHASE 6 — Application mobile Expo + intégration API

> **Statut : livré, à valider.** Prototype académique non certifié · données 100 %
> synthétiques · open-loop strict · API = source de vérité · **Phase 7 NON démarrée**.

Rapport structuré conforme au §14 du cahier des charges Phase 6 (14 points).
Détail technique complémentaire : `docs/mobile/PHASE_6_MOBILE_APP.md` ·
lancement / sécurité / checklist a11y : `mobile/README.md` · contrats consommés :
`docs/mobile/MOBILE_API_CONTRACTS.md`.

---

## 1. Fichiers ajoutés / modifiés

**Ajoutés**
- `mobile/src/**` : `app/` (Expo Router : `_layout.tsx`, `index.tsx`, `login.tsx`,
  `(patient)/`, `(clinician)/`, `patient-detail.tsx`), `components/` (Button, Card,
  Banners, Badge, XaiWarningBox, RecommendationCard, RecommendationActions, States,
  Screen, Text, TabIcon), `services/` (`api/` + `secureStore.ts` + `queryClient.ts`),
  `store/auth.tsx`, `hooks/useOnline.ts`, `theme/theme.ts`, `types/api.ts`,
  `utils/format.ts`, `config/env.ts`.
- `mobile/src/__tests__/**` : 7 suites Jest.
- `mobile/jest.setup.ts`.
- `docs/mobile/PHASE_6_MOBILE_APP.md`, `docs/migration/RAPPORT_PHASE_6.md` (ce fichier).

**Réécrits**
- `mobile/README.md` (objectif, stack, installation, config API, lancement Replit,
  sécurité jetons, navigation, écrans, erreurs, offline, **checklist a11y**, tests,
  compat Replit, prochaines étapes).

**Modifiés**
- `mobile/package.json` (config Jest : preset `jest-expo`, `moduleNameMapper @/→src`,
  `transformIgnorePatterns` incl. `expo-secure-store`, scripts `test`/`test:ci`).
- `mobile/tsconfig.json` (`types: [jest, node]` + alias `@/*`, `@/assets/*`).
- Workflows : « Mobile App » (`expo start --web`, port **5173**,
  `EXPO_PUBLIC_API_BASE_URL`) et « Backend API » (injecte `CORS_ORIGINS` autorisant
  l'origine 5173).
- `.replit` (port 5173 exposé), `replit.md` (section Phase 6),
  `.agents/memory/` (leçon Jest mocking).

## 2. Structure mobile

Arborescence `mobile/src/{app,components,services,store,hooks,theme,types,utils,config}`
+ `__tests__`. Navigation **file-based Expo Router** (`src/app/`), `app.json`
**statique** (jamais `app.config.ts`). Voir l'arbre complet dans
`docs/mobile/PHASE_6_MOBILE_APP.md §3`.

## 3. Stack utilisée

Expo (SDK géré) · React Native · TypeScript strict · **Expo Router** · `fetch` typé
maison · **TanStack Query** (cache serveur = offline minimal) · contexte React pour
l'auth · **expo-secure-store** · **Jest + jest-expo + Testing Library**. Aucune
librairie lourde non justifiée ; pas de state-manager global externe.

## 4. Configuration API

`src/config/env.ts` lit **uniquement** `EXPO_PUBLIC_API_BASE_URL` (racine, sans
`/api/v1`). **Aucune URL hardcodée.** Variable absente → erreur explicite non
technique, **sans crash**. Timeout 15 s · 1 retry réseau (GET idempotents) · refresh
auto sur 401 · préfixe `/api/v1` ajouté sauf routes meta (`/health`, `/ready`, `/`).

## 5. Auth flow

1. `login` → `POST /auth/login` (sans Bearer) → `saveTokens` → `GET /auth/me`.
2. Restauration de session au lancement (si access token → `/auth/me`).
3. `401` → `tryRefresh()` unique et dédupliqué (`refreshInFlight`) → rejeu ; échec →
   `clearTokens` + handler global « session expirée » → retour login.
4. `logout` → `POST /auth/logout` best-effort puis **toujours** `clearTokens`
   (`finally`).

## 6. Stockage sécurisé

`expo-secure-store` (Keychain iOS / Keystore Android, **chiffrés**) en natif.
**Web** : stockage **mémoire volatil** (jamais `localStorage`). Le module n'importe
**jamais** `AsyncStorage`. **Aucun jeton journalisé.** Vérifié par 3 suites
(natif, web, garde statique anti-fuite).

## 7. Écrans patient

Aujourd'hui (disclaimer + profil + dernier CGM + état réseau/API + accès rapides) ·
Données (CGM/repas/insuline/activité par fenêtre) · Risque (`ml/predict` :
probabilité, target, horizon, modèle, `open_loop_notice`, `is_synthetic` ; **aucun
conseil thérapeutique local**) · XAI (top features, warnings,
`xai_reliability_status`, `semantic_limitations`, calibration, texte patient ;
**alerte visuelle forte** si `not_reliable_for_clinical_interpretation`) ·
Recommandations (**approuvées uniquement** via `/recommendations/mine`).

## 8. Écrans clinicien

Patients (liste / recherche / badges synthétiques) · Détail patient (profil, séries,
risque, XAI, recos) · Recommandations (lister, filtrer
pending/approved/rejected/modified, générer, approuver/rejeter/modifier ; chaque
action rappelle **open-loop + validation humaine**) · XAI (local + global,
reliability/warnings/limites, **jamais de causalité**).

## 9. Navigation par rôle

Rôle lu depuis `/auth/me` (API). Layouts gardés : non authentifié → `login`
(inscription clinicien **désactivée**, note de démo) ; patient → onglets patient ;
clinicien/admin → onglets clinicien (+ détail patient gardé). RBAC appliqué côté
navigation **et** côté serveur (autorité finale).

## 10. Intégration API

L'app **n'effectue aucun calcul** de risque ni de recommandation : probabilités, XAI
et recommandations viennent **exclusivement** du backend. Mapping rôle→endpoints
détaillé dans `docs/mobile/PHASE_6_MOBILE_APP.md §10`.

## 11. Gestion des erreurs

Mapping centralisé (`client.ts`) :
400/401/403/404/409/422/429/503/réseau/timeout/refresh expiré/`API_BASE_URL`
manquante → message utilisateur **non technique** (FR), **sans masquer le critique**.
Détail serveur court (`{detail}` FastAPI, Pydantic agrégé) ajouté sous le message
standard.

## 12. Disclaimers

Bannières `COMPLIANCE` globales : prototype académique · données simulées · non
certifié (MDR/IEC 62304/ISO 13485) · ne remplace pas un avis médical · **ne modifiez
jamais votre traitement sans avis médical** · XAI = comportement du modèle, pas une
cause médicale · open-loop (aucune dose/décision auto). + badges synthétiques.

## 13. Accessibilité

Checklist complète dans `mobile/README.md`. Points clés : boutons **toujours avec
texte** · `accessibilityRole`/`accessibilityState` · zones tactiles **≥ 44 px** ·
contraste **AA** (couleurs de risque/état assombries) · **info critique jamais par
couleur seule** (libellé + icône) · corps 16 px · dynamic type conservé. Limite :
audit lecteur d'écran (VoiceOver/TalkBack) à conduire sur device.

## 14. Tests / validations, limites, visuel, sortie tests, décision Phase 7

**Sortie tests** (`cd mobile && npx jest --ci --runInBand`) :
```
Test Suites: 7 passed, 7 total
Tests:       29 passed, 29 total
```
+ `npx tsc --noEmit` → **rc=0**. Suites : client API (mapping statuts,
réseau+retry, Bearer, refresh+rejeu, refresh échoué→effacement), token storage
natif + web (jamais localStorage), login/logout (efface secrets), RBAC recos
(patient→`/mine`, clinicien→endpoints POST), garde statique anti-fuite de jeton
(scan source), composants (disclaimers, XAI warnings, reco approuvée).

**Limites Replit/mobile** : preview = **Expo Web** (port 5173) ; tunnel device/QR,
builds EAS, caméra, push natifs, Keychain/Keystore réel et capture d'écran
automatisée de l'app Expo **indisponibles** dans ce repo combiné. Web : jetons en
mémoire volatile (perdus au refresh) — **plus** strict que `localStorage`, jamais
contourné pour le confort du preview. Tests RN d'intégration device non exerçables →
tests unitaires services + fonctions + composants simples + checklist manuelle.

**Visuel** : pas de screenshot automatisé (l'outil cible l'app du port 5000, pas
Expo Web 5173). Le bundle Expo Web se compile proprement (~1390 modules, 0 erreur de
résolution) ; le CORS preflight backend renvoie 200.

**Revue architect** : verdict **PASS** — aucune fuite de jeton, aucun bypass RBAC,
aucune violation open-loop, aucun secret/URL hardcodé.

**Décision proposée pour Phase 7 (NON démarrée — attente validation)** :
1. Durcissement device réel (build EAS de dev, Keychain/Keystore réel, audit
   VoiceOver/TalkBack), hors Replit combiné.
2. Graphiques séries temporelles (lecture seule) au-delà des listes structurées.
3. Parcours d'évaluation clinicien (A/B, Likert) porté côté mobile, open-loop.

Aucune de ces pistes n'introduit de données réelles, de décision automatique ni de
changement ML/XAI ; toutes resteraient **open-loop** et **synthétiques**.
**Phase 7 ne sera pas démarrée sans validation explicite du superviseur.**
