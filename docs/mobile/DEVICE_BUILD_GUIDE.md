# Guide de build device — application mobile MediAI Care

> **Phase 8 — préparation build device réel.** Prototype académique **NON certifié** ·
> données **100 % synthétiques** · **open-loop strict** · **aucun secret committé**.
> Ce guide prépare un build Expo/EAS réel **hors de Replit** (Replit ne peut pas
> produire de build natif device).

## 1. Limite Replit (à lire d'abord)
- Replit fournit **Expo Web** uniquement (preview port 5173). Il **ne construit pas**
  d'APK/IPA, n'exécute pas EAS, ne signe pas d'application.
- Les builds device (`eas build`) se lancent depuis une machine locale ou la CI EAS
  d'Expo, **pas** depuis le workspace Replit.
- La config `mobile/eas.json` est fournie comme **point de départ** ; aucune valeur
  réelle d'URL ni de secret n'y figure (placeholder `https://CHANGEZ-MOI.example`).

## 2. Pré-requis (machine locale, hors Replit)
- Node LTS + `npm`.
- Compte Expo (EAS) : `npm i -g eas-cli` puis `eas login`.
- Android : Android Studio / SDK (pour run local) ; iOS : macOS + Xcode (pour iOS).

## 3. Variables d'environnement (jamais committées)
- `EXPO_PUBLIC_API_BASE_URL` — **obligatoire** : URL racine du backend (sans `/api/v1`).
  - Lue exclusivement via cette variable (`src/config/env.ts`) ; aucune URL en dur.
  - Définie par **profil** dans `eas.json` (`build.<profil>.env`) ou via
    `eas secret:create` / `eas env` côté EAS (recommandé pour ne rien committer).
- Aucune autre clé/secret nécessaire côté mobile (auth = JWT obtenu à l'exécution).

```bash
# Recommandé : secret EAS (non committé) plutôt qu'une valeur en clair dans eas.json
eas secret:create --scope project --name EXPO_PUBLIC_API_BASE_URL --value "https://votre-backend"
```

## 4. Profils de build (`mobile/eas.json`)
| Profil | Usage | Distribution | Notes |
|---|---|---|---|
| `development` | dev client + débogage | internal | `developmentClient: true`, APK Android, simulateur iOS |
| `preview` | test interne sur device réel | internal | APK installable hors store |
| `production` | pré-release store | store | `autoIncrement`, signature gérée par EAS |

> Remplacer le placeholder `EXPO_PUBLIC_API_BASE_URL` par un **secret EAS** avant tout
> build réel. Ne jamais committer d'URL/secret réel.

## 5. Procédure Android
```bash
# Depuis une machine locale (hors Replit), à la racine mobile/
eas login
eas build:configure            # si premier build (génère/complète les identifiants)
eas build --platform android --profile preview     # APK interne
eas build --platform android --profile development  # dev client
```
- Installer l'APK généré sur un appareil Android (téléchargement EAS).
- Renseigner `EXPO_PUBLIC_API_BASE_URL` (secret EAS) pointant un backend **accessible
  depuis l'appareil** (réseau/tunnel), backend lançant des données synthétiques.

## 6. Procédure iOS (si environnement macOS disponible)
```bash
eas build --platform ios --profile development   # simulateur
eas build --platform ios --profile preview       # device interne (compte Apple requis)
```
- iOS device nécessite un compte développeur Apple + provisioning (géré par EAS).
- À défaut de macOS/compte Apple : se limiter au simulateur ou à Android.

## 7. Identifiants d'application
- `app.json` : `slug`/`name` = `mobile`, `scheme` = `mobile`, plugin `expo-secure-store`
  présent (requis pour Keychain/Keystore réels).
- Avant un build store, définir un **bundle identifier iOS** et un **package Android**
  dédiés (ex. `org.exemple.mediaicare`) dans `app.json` (`ios.bundleIdentifier`,
  `android.package`). Non requis pour un simple dev/preview interne.

## 8. Après installation device — validations à mener
- SecureStore réel : voir `docs/security/DEVICE_TOKEN_STORAGE_VALIDATION.md`.
- Accessibilité device : voir `docs/qa/DEVICE_ACCESSIBILITY_CHECKLIST.md`.
- TLS / pinning : voir `docs/security/MOBILE_TLS_PINNING_STRATEGY.md`.
- QA pré-release : voir `docs/qa/MOBILE_PRE_RELEASE_CHECKLIST.md`.

## 9. Sécurité du build (non négociable)
- **Aucun secret** dans le dépôt (ni `eas.json`, ni code). Utiliser les secrets EAS.
- `EXPO_PUBLIC_*` est **exposé côté client** par conception : n'y mettre **que** des
  valeurs non sensibles (l'URL d'API publique en fait partie ; jamais de clé privée).
- Ne pas désactiver de contrôle de sécurité pour faciliter les tests.

## 10. Ce qui reste hors périmètre Phase 8
- Publication store réelle, comptes développeur, signature de production effective.
- TLS certificate pinning effectif (stratégie documentée, implémentation = build natif).
- Tests sur parc d'appareils (device farm).
