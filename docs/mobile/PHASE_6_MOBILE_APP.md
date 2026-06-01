# Phase 6 — Application mobile Expo + intégration API

> **Statut : livré, à valider.** Prototype académique non certifié. Données 100 %
> synthétiques. Open-loop strict. API = source de vérité. **Phase 7 NON démarrée.**

Ce document décrit l'application mobile patient/clinicien construite en Phase 6,
en complément de `mobile/README.md` (lancement, sécurité, a11y) et de
`docs/mobile/MOBILE_API_CONTRACTS.md` (contrats consommés, produits en Phase 5).

## 1. Objectif

Construire une première application mobile Expo / React Native robuste, typée,
sécurisée, connectée au backend FastAPI existant — **sans** modifier le
comportement clinique, **sans** introduire de données réelles, **sans** automatiser
de décision, et **sans** contourner les contrats API validés en Phase 5.

## 2. Non-négociables tenus

| Contrainte                                | Mise en œuvre                                                                                       |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Données synthétiques uniquement           | Bannières de conformité globales (`COMPLIANCE`) ; badges synthétiques ; aucun flux réel.           |
| Open-loop strict                          | Aucune dose/décision/instruction locale ; recommandations = suggestions soumises à validation.     |
| Sécurité mobile                           | Jetons en `expo-secure-store` ; jamais AsyncStorage/localStorage ; jamais loggés ; logout efface.  |
| RBAC strict                               | Patient = ses données + recos approuvées (`/mine`) ; clinicien = liste/generate/approve/.../XAI.   |
| Pas de changement ML/XAI/seuils           | Aucun calcul local ; l'app affiche tel quel ce que renvoie l'API.                                  |
| API source-of-truth                       | Probabilités, XAI et recommandations viennent **exclusivement** du backend.                        |
| Disclaimers visibles                      | Prototype/synthétique/non certifié/avis médical/ne pas modifier le traitement/XAI non causale.     |

## 3. Structure (`mobile/`)

```
mobile/
├── app.json                 # config Expo STATIQUE (jamais app.config.ts)
├── package.json             # deps + config Jest
├── tsconfig.json            # strict + types jest/node + alias @/*
├── jest.setup.ts
└── src/
    ├── app/                 # Expo Router (file-based)
    │   ├── _layout.tsx      # provider auth + query + redirections
    │   ├── index.tsx        # routeur d'amorçage selon rôle
    │   ├── login.tsx
    │   ├── (patient)/       # onglets patient + écrans
    │   ├── (clinician)/     # onglets clinicien + écrans
    │   └── patient-detail.tsx
    ├── components/          # design system (Button, Card, Banners, Badge,
    │                        #   XaiWarningBox, RecommendationCard, States…)
    ├── config/env.ts        # API_BASE_URL (EXPO_PUBLIC_*), timeouts, COMPLIANCE
    ├── services/
    │   ├── api/             # client + auth/patients/timeseries/ml/xai/recos
    │   ├── secureStore.ts   # jetons (Keychain/Keystore ; mémoire sur web)
    │   └── queryClient.ts   # TanStack Query
    ├── store/auth.tsx       # contexte auth + rôle
    ├── hooks/useOnline.ts   # état réseau (offline minimal)
    ├── theme/theme.ts       # palette accessible, typographie, espacements
    ├── types/api.ts         # types alignés sur les contrats v1
    ├── utils/format.ts
    └── __tests__/           # 7 suites Jest
```

## 4. Stack

Expo (SDK géré) · React Native · TypeScript strict · Expo Router · `fetch` typé
maison · TanStack Query (cache serveur) · `expo-secure-store` · Jest + `jest-expo`.
Aucune librairie lourde non justifiée ; pas de state-manager global externe.

## 5. Configuration API

`src/config/env.ts` lit `EXPO_PUBLIC_API_BASE_URL` (racine, sans `/api/v1`).
Aucune URL hardcodée. Absente → erreur explicite non technique (pas de crash).
Timeout 15 s ; 1 retry réseau (GET) ; refresh auto sur 401. Le préfixe `/api/v1`
est ajouté par le client sauf pour les routes meta (`/health`, `/ready`, `/`).

## 6. Flux d'authentification

1. `login(email, password)` → `POST /auth/login` (sans Bearer) → `saveTokens` →
   `GET /auth/me` pour le profil + rôle.
2. Restauration de session au lancement : si un access token existe, `GET /auth/me`.
3. Sur `401` : `tryRefresh()` (une seule tentative, dédupliquée via
   `refreshInFlight`) → rejeu de la requête. Échec → `clearTokens` + handler global
   « session expirée » → retour login.
4. `logout` : `POST /auth/logout` best-effort puis **toujours** `clearTokens`
   (bloc `finally`).

## 7. Stockage sécurisé

`expo-secure-store` (Keychain/Keystore chiffrés) en natif. **Web** : stockage
mémoire volatil (jamais `localStorage`). Le module n'importe jamais `AsyncStorage`.
Aucun jeton journalisé. Vérifié par 3 suites de tests (natif, web, garde statique).

## 8. Écrans patient

Aujourd'hui (disclaimer + profil + dernier CGM + état API + accès rapides) ·
Données (CGM/repas/insuline/activité par fenêtre) · Risque (`ml/predict` :
probabilité, target, horizon, modèle, `open_loop_notice`, `is_synthetic` ; aucun
conseil local) · XAI (top features, warnings, `xai_reliability_status`,
`semantic_limitations`, calibration, texte patient ; alerte visuelle forte si
`not_reliable_for_clinical_interpretation`) · Recommandations (**approuvées
uniquement** via `/recommendations/mine`).

## 9. Écrans clinicien

Patients (liste/recherche/badges synthétiques) · Détail patient (profil, séries,
risque, XAI, recos) · Recommandations (lister, filtrer
pending/approved/rejected/modified, générer, approuver/rejeter/modifier ; chaque
action rappelle open-loop + validation humaine) · XAI (local + global,
reliability/warnings/limites, jamais de causalité).

## 10. Intégration API par rôle

| Service              | Patient                       | Clinicien/admin                                  |
| -------------------- | ----------------------------- | ------------------------------------------------ |
| auth                 | login/me/refresh/logout       | idem                                             |
| patients             | son dossier                   | liste + détail                                   |
| timeseries           | lecture de ses séries         | lecture par patient                              |
| ml.predict           | son dossier                   | `patient_id` requis                              |
| xai.explain / global | local (son dossier)           | local + global                                   |
| recommendations      | `/mine` (approuvées)          | list/generate/approve/reject/modify              |

Le RBAC est appliqué côté navigation (écrans visibles) **et** reste contrôlé par
le serveur (autorité finale) : un patient ne reçoit jamais d'action clinicien.

## 11. Gestion des erreurs

Mapping centralisé (`client.ts`) : 400/401/403/404/409/422/429/503, réseau/timeout,
refresh expiré, `API_BASE_URL` manquante → message utilisateur non technique
(français), sans masquer le critique. Détail serveur explicite et court (`{detail}`
FastAPI, Pydantic agrégé) ajouté sous le message standard.

## 12. Accessibilité

Voir la checklist complète dans `mobile/README.md`. Points clés : boutons toujours
avec texte, `accessibilityRole`/`accessibilityState`, zones tactiles ≥ 44 px,
contraste AA (couleurs de risque/état assombries), **pas d'info critique uniquement
par couleur** (libellé + icône), corps 16 px. Limitation : audit lecteur d'écran
sur device non réalisable sur le preview web.

## 13. Tests / validations

7 suites, 29 tests (`npx jest --ci --runInBand`) + `npx tsc --noEmit` rc=0 :
client API (mapping statuts, réseau+retry, Bearer, refresh+rejeu, refresh
échoué→effacement), token storage natif + web (jamais localStorage), login/logout
(efface secrets), RBAC recommandations (patient→`/mine` ; clinicien→endpoints
POST), garde statique anti-fuite de jeton (scan source), composants (disclaimers,
XAI warnings, reco approuvée). RBAC navigation et visibilité testés via les chemins
appelés et le rendu des composants.

**Limites RN testing Replit :** pas de simulateur device ; tests d'intégration
end-to-end natifs non exerçables ; on fournit tests unitaires services, tests de
fonctions, tests de composants simples et une checklist manuelle.

## 14. Compatibilité & limites Replit

- Preview = **Expo Web** (port 5173) ; backend (port 8000) injecte `CORS_ORIGINS`.
- Indisponibles dans ce repo combiné : tunnel device/QR, builds EAS, caméra, push
  natifs, Keychain/Keystore réel, capture d'écran automatisée de l'app Expo.
- Web : jetons en mémoire volatile (perdus au refresh) — **plus** strict que
  `localStorage`, choix de sécurité assumé, jamais contourné pour le confort.

## 15. Fichiers ajoutés / modifiés (synthèse)

Ajoutés : tout `mobile/src/**` (app/components/services/store/hooks/theme/types/
utils/config), `mobile/src/__tests__/**`, `mobile/jest.setup.ts`,
`mobile/README.md` (réécrit), `docs/mobile/PHASE_6_MOBILE_APP.md`. Modifiés :
`mobile/package.json` (config Jest + scripts), `mobile/tsconfig.json` (types
jest/node + alias), workflow « Mobile App » (port 5173) et « Backend API »
(`CORS_ORIGINS`), `.replit` (port 5173), `replit.md` (section Phase 6).

## 16. Décision proposée pour Phase 7

Phase 6 livre une app mobile typée, sécurisée et conforme aux non-négociables.
**Phase 7 NON démarrée** (attente validation). Pistes proposées, à arbitrer par le
superviseur :

1. **Durcissement device réel** — build EAS de dev, test Keychain/Keystore réel,
   audit VoiceOver/TalkBack, hors environnement Replit combiné.
2. **Graphiques séries temporelles** — visualisation CGM/insuline (lecture seule)
   au-delà des listes structurées actuelles.
3. **Parcours d'évaluation clinicien** — porter l'infrastructure d'évaluation XAI
   (A/B, Likert) déjà présente côté web, en restant open-loop.

Aucune de ces pistes n'introduit de données réelles, de décision automatique ni de
changement ML/XAI ; toutes resteraient open-loop et synthétiques.
