# Revue de sécurité — application mobile MediAI Care

> **Phase 7 — audit sécurité mobile (revue, sans changement de logique métier).**
> Périmètre : app Expo/React Native `mobile/` consommant l'API FastAPI v1. Posture :
> prototype non certifié, données synthétiques, open-loop strict.

Échelle : ✅ conforme · ⚠️ conforme avec limite documentée · ❌ écart.

## 1. Stockage des jetons
- **Natif (iOS/Android)** : `expo-secure-store` (Keychain / Keystore, chiffrés au repos). ✅
- **Web (preview)** : `Map` en **mémoire volatile** (`memoryStore`) — perdue au refresh,
  jamais persistée. Plus strict que `localStorage`. ⚠️ (limite plateforme assumée)
- **Jamais** d'`AsyncStorage`/`localStorage` pour les jetons. ✅ (test statique `no-token-leak`)

## 2. SecureStore
- Accès centralisé (`services/secureStore.ts`) : `setItem`/`getItem`/`deleteItem`
  aiguillés par `Platform.OS`. ✅
- Pas de fallback silencieux vers un stockage non sécurisé en natif. ✅

## 3. Fallback web mémoire
- Choix validé par le superviseur (Phase 6) : session volatile acceptée au profit de
  la sécurité. ✅
- Conséquence : reconnexion requise après rafraîchissement de l'onglet. ⚠️ (documenté)

## 4. API base URL
- Lue **uniquement** depuis `EXPO_PUBLIC_API_BASE_URL` (`config/env.ts`). ✅
- Aucune URL d'API en dur dans le code runtime. ✅
- Absente → erreur explicite non technique, sans crash. ✅

## 5. Absence d'AsyncStorage
- Aucun import d'`@react-native-async-storage/async-storage` dans la logique applicative. ✅
- Garde automatisée : `no-token-leak.test.ts` (scan statique des sources). ✅

## 6. Absence de logs de secrets
- Aucun `console.log`/trace de jeton ou de mot de passe. ✅ (test statique)
- Les messages d'erreur affichés sont non techniques et ne contiennent pas de secret. ✅

## 7. Gestion 401 / refresh
- Sur 401 : `POST /auth/refresh` automatique, **dédupliqué** (une tentative en vol),
  puis rejeu de la requête initiale. ✅
- Échec du refresh → `clearTokens()` + handler `auth-expired` → retour Login. ✅
- Refresh opaque côté serveur : rotation à chaque usage + détection de réutilisation
  (révoque la famille de jetons). ✅ (backend `auth_service`)

## 8. Logout
- `POST /auth/logout` best-effort puis `clearTokens()` dans un bloc `finally`. ✅
- Les secrets sont effacés **même si l'appel réseau échoue**. ✅ (test `auth.service`)

## 9. RBAC (côté mobile, autorité = serveur)
- Aiguillage racine + gardes de groupe (`(patient)`/`(clinician)`). ✅
- Patient : ses données + recos **approuvées** (`/recommendations/mine`). ✅
- Clinicien/admin : liste/détail/generate/approve/reject/modify + XAI global/local. ✅
- Le mobile n'est **pas** l'autorité : tout endpoint applique le RBAC serveur (403 sinon). ✅
- Aucun contournement RBAC côté mobile. ✅ (test `recommendations.rbac`)

## 10. Gestion des erreurs
- Mapping centralisé statut→message FR non technique (400/401/403/404/409/422/429/503/
  réseau/timeout/config). ✅
- Le détail serveur court est ajouté sans masquer la nature critique de l'erreur. ✅

## 11. Données sensibles en cache
- Cache **mémoire** uniquement (TanStack Query) — aucune persistance disque de données
  patient. ✅
- Données 100 % synthétiques (`is_synthetic=True`) — pas de PII réelle. ✅
- Pas de stockage durable sensible côté mobile. ✅

## 12. Limites Expo Web (Replit)
- Pas de device/QR, builds EAS, caméra, push natifs, Keychain/Keystore réel. ⚠️
- SecureStore réel non exerçable en preview → couvert par tests unitaires + checklist. ⚠️
- Capture d'écran Expo automatisée indisponible. ⚠️

## 13. Recommandations pour un build device réel (hors périmètre Phase 7)
1. Construire via **EAS** (dev/preview) pour exercer Keychain/Keystore réels.
2. Vérifier le comportement SecureStore sous redémarrage app / verrouillage device /
   biométrie.
3. Activer le **certificate pinning** TLS vers l'API si déploiement hors prototype.
4. Audit lecteur d'écran réel (VoiceOver/TalkBack) sur device.
5. Politique d'expiration/inactivité de session adaptée au natif (au-delà de la
   session volatile web).
6. Revue des permissions natives (aucune non nécessaire).

## Synthèse
Aucun écart bloquant relevé : jetons en stockage sécurisé (ou mémoire volatile sur
web, plus strict), aucun secret loggé, aucun `AsyncStorage`, RBAC serveur respecté,
refresh/logout robustes, données synthétiques en cache mémoire uniquement. Les limites
restantes sont **inhérentes au preview Expo Web sur Replit** et adressées par les
recommandations « build device réel » (Phase 8 potentielle, sur validation).
