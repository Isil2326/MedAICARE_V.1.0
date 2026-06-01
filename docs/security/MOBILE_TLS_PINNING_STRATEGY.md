# Stratégie TLS / certificate pinning mobile — MediAI Care

> **Phase 8 — analyse & décision (pas d'implémentation instable).** Prototype non
> certifié · open-loop · données synthétiques. Objectif : documenter une stratégie de
> pinning **sans** forcer une implémentation incompatible avec Expo/Replit.

## 1. Contexte
- L'app mobile communique avec le backend en **HTTPS** (TLS standard) ; l'URL provient
  de `EXPO_PUBLIC_API_BASE_URL`. Le chiffrement de transport est déjà assuré par TLS.
- Le **certificate pinning** ajoute une défense contre un MITM disposant d'une autorité
  de certification frauduleuse/compromise, en épinglant le certificat/clé publique
  attendu du serveur.

## 2. Options
| Option | Description | Faisabilité Expo | Verdict |
|---|---|---|---|
| A. Pas de pinning (TLS seul) | S'appuyer sur la validation CA standard de l'OS | ✅ par défaut | Acceptable pour un prototype synthétique |
| B. Pinning via config native | `react-native-ssl-pinning` / patch natif iOS/Android | ❌ pas en Expo Go ; ⚠️ nécessite **dev client / prebuild** | Possible hors prototype |
| C. Pinning via plugin/config plugin Expo | Config plugin appliquant le pinning au build EAS | ⚠️ nécessite build natif + maintenance des empreintes | Possible hors prototype |
| D. Pinning applicatif (fetch + vérif empreinte) | Vérifier l'empreinte au niveau réseau JS | ❌ non fiable / non supporté proprement par `fetch` RN | À éviter |

## 3. Ce qui est faisable avec Expo (managed)
- TLS standard : **oui**, immédiat (déjà le cas).
- Pinning : **non** en Expo Go ; **uniquement** via un **dev client / prebuild** (EAS)
  avec configuration native — donc hors du preview Replit et hors du prototype actuel.

## 4. Ce qui nécessite un build natif / dev client
- Toute forme de pinning robuste (Option B/C) requiert :
  - un **prebuild** (`expo prebuild`) ou un **config plugin** ajoutant la conf native ;
  - la gestion du **cycle de vie des empreintes** (rotation de certificat = mise à jour
    app, sinon coupure de service) ;
  - des tests sur device réel.

## 5. Risques
- **Brique de service** si le certificat serveur tourne sans mise à jour de l'app
  (pin obsolète → toutes les requêtes échouent).
- **Maintenance** : nécessite un processus de rotation coordonné backend/app.
- **Faux sentiment de sécurité** sur un prototype à données synthétiques : le pinning
  protège des données qui ne sont pas sensibles ici.
- **Instabilité** si tenté en Expo Go / via `fetch` JS (Option D) → à proscrire.

## 6. Décision (Phase 8)
- **Conserver TLS standard (Option A)** pour le prototype : suffisant compte tenu de la
  posture (données 100 % synthétiques, non clinique, non certifié).
- **Ne pas implémenter** de pinning maintenant (éviter une dépendance native instable
  et une maintenance d'empreintes sans bénéfice réel sur données synthétiques).
- **Documenter** le pinning comme **étape d'un build device durci ultérieur** (dev
  client / prebuild EAS, Option B/C), à activer seulement si des données réelles ou un
  cadre clinique étaient un jour envisagés (hors périmètre, Phase 9+ sur validation).

## 7. Si pinning activé plus tard (mémo de mise en œuvre)
1. Passer en **dev client / prebuild** (EAS), abandonner Expo Go.
2. Choisir l'épinglage **clé publique** (SPKI) plutôt que certificat (rotation plus
   souple) + **pin de secours** (backup pin).
3. Intégrer la conf native iOS (ATS / NSPinnedDomains) et Android
   (Network Security Config).
4. Mettre en place une **procédure de rotation** synchronisée avec le backend.
5. Tester échec/réussite sur device (MITM simulé) avant toute diffusion.
