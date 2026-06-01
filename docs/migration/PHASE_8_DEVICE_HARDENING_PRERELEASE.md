# Phase 8 — Durcissement device, build mobile réel, QA accessibilité device, pré-release

> **MediAI Care** — prototype académique **NON certifié** · données **100 %
> synthétiques** · **open-loop strict** · **XAI support-only** · **API = source de
> vérité**. Phase de **préparation/durcissement**, sans nouvelle logique métier, sans
> changement ML/XAI/seuils, sans données réelles, sans décision automatique.

## 1. Objectif
Préparer le prototype mobile à une validation **plus réaliste sur appareil** (build
device, SecureStore réel, accessibilité device, pré-release) **sans** modifier la
logique métier, **sans** données réelles, **sans** réentraînement/nouveau modèle/
changement de seuils, **sans** automatiser de décision, **sans** démarrer la Phase 9.

## 2. Périmètre
- Configuration de build device Expo/EAS + guide.
- Checklists de validation device : SecureStore réel, accessibilité.
- Ajout d'une **visualisation CGM lecture seule** (graphique) côté patient.
- Stratégie TLS / certificate pinning (analyse + décision).
- Durcissement de configuration mobile (vérification).
- Checklist QA pré-release.
- Documentation + rapport Phase 8 ; tests existants maintenus verts.

## 3. Hors périmètre
- Build store réel, signature de production, comptes développeur Apple/Google.
- Implémentation effective du certificate pinning (build natif requis).
- Tests sur parc d'appareils ; toute donnée réelle ; tout changement ML/XAI/seuils ;
  toute logique métier/décision côté mobile ; **Phase 9**.

## 4. Build device (EAS)
- `mobile/eas.json` : profils `development` / `preview` / `production`, **sans secret**
  (placeholder d'URL uniquement).
- `docs/mobile/DEVICE_BUILD_GUIDE.md` : pré-requis, variables d'environnement
  (`EXPO_PUBLIC_API_BASE_URL` via **secret EAS**, jamais committé), procédures Android/
  iOS, identifiants d'app, limites Replit (aucun build natif sur Replit).

## 5. SecureStore réel
- `docs/security/DEVICE_TOKEN_STORAGE_VALIDATION.md` : checklist device (Keychain iOS /
  Keystore Android, effacement au logout, redémarrage, expiration refresh, absence
  d'AsyncStorage/localStorage). Code inchangé ; conformité unitaire déjà couverte
  (`no-token-leak`, `secureStore.*`).

## 6. Accessibilité device
- `docs/qa/DEVICE_ACCESSIBILITY_CHECKLIST.md` : VoiceOver/TalkBack, dynamic type,
  contraste mesuré, zones tactiles, focus, annonces, navigation patient/clinicien,
  warnings XAI, recommandations. Complète la revue statique Phase 7.

## 7. Graphiques lecture seule
- `mobile/src/components/CgmChart.tsx` : graphique CGM en **Views pures (zéro
  dépendance)**, intégré dans `(patient)/data.tsx` au-dessus des listes.
- **Garde-fous open-loop** : échelle d'axe **FIXE [40, 300]** (mapping linéaire pur,
  aucune dérivation des données), repère 70–180 affiché comme **repère visuel non
  décisionnel**, **aucune** prédiction/alerte/interprétation/dose côté client, label
  d'accessibilité résumé, **fallback liste** si < 2 points.
- Tests : `mobile/src/__tests__/cgmChart.test.tsx` (rendu, repère non décisionnel,
  fallback, label a11y, absence de wording dose/décision/risque + garde statique
  « aucun import de service de calcul métier »).

## 8. TLS pinning
- `docs/security/MOBILE_TLS_PINNING_STRATEGY.md` : options analysées ; **décision** =
  conserver **TLS standard** pour le prototype (données synthétiques), **ne pas**
  implémenter de pinning maintenant (dépendance native instable / maintenance
  d'empreintes sans bénéfice réel), documenter comme étape d'un build device durci
  ultérieur (dev client / prebuild EAS).

## 9. Configuration mobile
Vérifié : aucune URL sensible en dur (seules des mentions dans `config/env.ts`) ;
`API_BASE_URL` **exclusivement** via `EXPO_PUBLIC_API_BASE_URL` ; aucun `console.*` de
secret (uniquement un commentaire d'interdiction) ; messages d'erreur non sensibles ;
CORS piloté par env côté backend (documenté). `EXPO_PUBLIC_*` réservé à des valeurs non
sensibles (exposées au client par conception).

## 10. QA pré-release
- `docs/qa/MOBILE_PRE_RELEASE_CHECKLIST.md` : 16 blocs (auth, refresh, logout, patient,
  clinicien, recos, XAI, offline, erreurs, accessibilité, sécurité token, disclaimers,
  non-certification, synthetic-only, open-loop, configuration).

## 11. Tests
| Périmètre | Commande | Résultat |
|---|---|---|
| Mobile typecheck | `cd mobile && npx tsc --noEmit` | **rc=0** |
| Mobile tests | `cd mobile && npx jest --ci --runInBand` | **8 suites / 34 tests verts** (+1 suite, +5 tests : CgmChart) |
| Backend smoke | `cd backend && python scripts/validate_backend.py` | **OK** |
| Backend tests | `cd backend && bash scripts/run_test_batches.sh` (par lots, anti-OOM) | **172 fonctions / 16 fichiers** (inchangé) |

Tous les tests existants restent verts ; les nouveaux tests couvrent uniquement le
graphique lecture seule et ses garde-fous.

## 12. Limites
- **Build device, EAS, Keychain/Keystore réels, VoiceOver/TalkBack, contraste mesuré,
  TLS pinning effectif** : non exécutables sur Replit (Expo Web) → checklists device.
- Graphique = repère visuel **non décisionnel** ; aucune interprétation clinique.
- Rate-limit backend par IP ; enveloppe d'erreur uniforme non implémentée (inchangé).
- Scores ML = benchmark synthétique séparable (non transférable au clinique).

## 13. Recommandation pour Phase 9
**Ne PAS démarrer la Phase 9 sans validation explicite du superviseur.** Pistes (à
arbitrer, toujours open-loop/synthétique) : exécution réelle des checklists device
(build EAS dev/preview, audit VoiceOver/TalkBack), durcissement natif (prebuild + TLS
pinning si cadre l'exige), enrichissement **lecture seule** des visualisations
(insuline/repas/activité) sans calcul local, préparation d'un dossier de validation
plus formel si un cadre réglementaire venait à être envisagé.

---

**Statut : Phase 8 livrée, en attente de validation du superviseur. Phase 9 non
démarrée.**
