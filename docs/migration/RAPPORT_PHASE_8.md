# Rapport Phase 8 — Durcissement device, build mobile réel, QA accessibilité, pré-release

> **MediAI Care** — prototype **NON certifié** · données **100 % synthétiques** ·
> **open-loop strict** · **XAI support-only** · **API = source de vérité**. Aucun
> changement ML/XAI/seuils, aucune donnée réelle, aucune décision automatique, aucune
> nouvelle logique métier mobile.

## 1. Fichiers ajoutés / modifiés
**Ajoutés**
- `mobile/src/components/CgmChart.tsx` — graphique CGM **lecture seule** (Views pures).
- `mobile/src/__tests__/cgmChart.test.tsx` — tests du graphique + garde-fous.
- `mobile/eas.json` — config build device (profils dev/preview/prod, **sans secret**).
- `docs/mobile/DEVICE_BUILD_GUIDE.md` — guide de build device Expo/EAS.
- `docs/security/DEVICE_TOKEN_STORAGE_VALIDATION.md` — checklist SecureStore device.
- `docs/qa/DEVICE_ACCESSIBILITY_CHECKLIST.md` — checklist accessibilité device.
- `docs/security/MOBILE_TLS_PINNING_STRATEGY.md` — stratégie/décision TLS pinning.
- `docs/qa/MOBILE_PRE_RELEASE_CHECKLIST.md` — checklist QA pré-release.
- `docs/migration/PHASE_8_DEVICE_HARDENING_PRERELEASE.md` — doc Phase 8 (13 sections).
- `docs/migration/RAPPORT_PHASE_8.md` — ce rapport.

**Modifiés**
- `mobile/src/app/(patient)/data.tsx` — intégration du graphique CGM (lecture seule)
  au-dessus des listes existantes (qui restent comme détail/fallback).
- `replit.md` — Phase 7 → **validée**, Phase 8 → **livré, à valider**, prochaine phase
  → Phase 9 ; ajout des références documentaires Phase 8.

**Inchangé** : backend, ML, XAI, moteur de recommandation, sécurité serveur, seuils.

## 2. Configuration build device
`mobile/eas.json` : profils `development` (dev client, APK/simulateur), `preview`
(interne, APK), `production` (store, autoIncrement). **Aucun secret committé** :
`EXPO_PUBLIC_API_BASE_URL` = placeholder, à fournir via **secret EAS**. Builds device
**non exécutables sur Replit** (documenté).

## 3. Guide device
`docs/mobile/DEVICE_BUILD_GUIDE.md` : pré-requis, variables d'environnement, procédures
Android et iOS, identifiants d'app, sécurité du build (aucun secret au dépôt ;
`EXPO_PUBLIC_*` = valeurs non sensibles uniquement), limites Replit.

## 4. Validation SecureStore
`docs/security/DEVICE_TOKEN_STORAGE_VALIDATION.md` : checklist device (Keychain iOS,
Keystore Android, effacement au logout y compris hors-ligne, redémarrage, expiration/
réutilisation refresh, absence d'AsyncStorage/localStorage). Conformité du **code**
déjà couverte par `no-token-leak` / `secureStore.*` ; conformité **device** = à valider
sur build réel.

## 5. Checklist accessibilité device
`docs/qa/DEVICE_ACCESSIBILITY_CHECKLIST.md` : VoiceOver/TalkBack, dynamic type 200 %,
contraste mesuré, zones tactiles, focus, annonces, navigation patient/clinicien,
warnings XAI (texte, jamais couleur seule), recommandations (aucune dose lue).

## 6. Graphiques lecture seule
`mobile/src/components/CgmChart.tsx` (intégré dans `(patient)/data.tsx`) :
- **Lecture seule**, **zéro dépendance** (Views pures) → robuste natif + web.
- **Aucun calcul métier/risque local** : échelle d'axe **FIXE [40, 300]** (mapping
  linéaire pur) ; le repère **70–180** est un **repère visuel non décisionnel**.
- **Aucune** prédiction/alerte/interprétation/dose côté client ; label a11y résumé ;
  **fallback liste** si < 2 points.
- Tests (`cgmChart.test.tsx`) : rendu, repère non décisionnel, fallback, label
  accessible, et garde statique « pas d'import de service ML/reco, pas de wording
  dose/décision ».

## 7. Stratégie TLS pinning
`docs/security/MOBILE_TLS_PINNING_STRATEGY.md` : options A–D analysées ; **décision** =
**TLS standard** conservé pour le prototype (données synthétiques) ; pinning **non
implémenté** (dépendance native instable, maintenance d'empreintes, aucun bénéfice réel
ici) ; documenté comme étape d'un build device durci ultérieur (dev client / prebuild).

## 8. Durcissement configuration
Vérifié : **aucune URL sensible en dur** ; `API_BASE_URL` **exclusivement** via
`EXPO_PUBLIC_API_BASE_URL` ; **aucun** `console.*` de secret (seul un commentaire
d'interdiction) ; messages d'erreur non sensibles ; CORS par env côté backend. Aucune
modification de code nécessaire (configuration déjà saine depuis Phase 6).

## 9. Checklist pré-release
`docs/qa/MOBILE_PRE_RELEASE_CHECKLIST.md` : 16 blocs couvrant auth/refresh/logout,
patient/clinicien, recos/XAI, offline/erreurs, accessibilité/sécurité token,
disclaimers/non-certification/synthetic-only/open-loop, configuration.

## 10. Tests exécutés
| Périmètre | Commande | Résultat |
|---|---|---|
| Mobile typecheck | `cd mobile && npx tsc --noEmit` | **rc=0** |
| Mobile tests | `cd mobile && npx jest --ci --runInBand` | **8 suites / 34 tests verts** (+1 suite / +5 tests : CgmChart) |
| Backend smoke | `cd backend && python scripts/validate_backend.py` | **OK** |
| Backend tests | `cd backend && bash scripts/run_test_batches.sh` (par lots) | **172 fonctions / 16 fichiers** (inchangé) |

## 11. Limites restantes
- Build device / EAS / Keychain-Keystore réels / VoiceOver-TalkBack / contraste mesuré
  / TLS pinning effectif : **non exécutables sur Replit** → checklists device.
- Graphique = repère **non décisionnel** ; aucune interprétation clinique.
- Rate-limit par IP ; enveloppe d'erreur uniforme non implémentée (inchangé).
- Scores ML = benchmark synthétique séparable (non transférable au clinique).

## 12. Recommandation pour Phase 9
**Ne PAS démarrer la Phase 9 sans validation explicite du superviseur.** Pistes
(open-loop, synthétiques, sans changement ML/XAI) : exécution réelle des checklists
device (build EAS, audit lecteurs d'écran), durcissement natif (prebuild + TLS pinning
si requis), visualisations **lecture seule** supplémentaires (insuline/repas/activité)
sans calcul local, formalisation d'un dossier de validation si un cadre réglementaire
était un jour envisagé.

---

**Conclusion.** Phase 8 livrée : configuration et guide de build device, checklists
device (SecureStore, accessibilité), graphique CGM **lecture seule** avec garde-fous
open-loop + tests, stratégie TLS, vérification du durcissement de configuration et
checklist pré-release. Tous les tests **verts** ; **aucune** régression de posture
(non certifié, synthétique, open-loop, XAI support-only, API source de vérité). **En
attente de validation du superviseur. Phase 9 non démarrée.**
