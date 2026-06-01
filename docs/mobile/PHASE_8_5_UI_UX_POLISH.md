# Phase 8.5 — Refonte UI/UX premium (app mobile Expo)

> **Posture inchangée.** Cette phase est **purement présentationnelle**. Aucune
> logique métier, aucun contrat API, aucun modèle ML/XAI, aucun moteur de
> recommandation, aucun seuil et aucune donnée n'ont été modifiés. Prototype
> académique **non certifié**, **open-loop strict**, **données 100 % synthétiques**.

## 1. Objectif

Moderniser l'apparence et la sensation de l'application mobile (design system,
écrans patient/clinicien, micro-interactions légères, visuel du graphique CGM)
tout en **préservant intégralement** les garde-fous médicaux/de conformité et la
verte des tests.

## 2. Périmètre

| Inclus | Exclu (non négociable) |
|--------|------------------------|
| Tokens de thème (couleurs, ombres, durées d'animation) | Tout code backend / ML / XAI / reco |
| Composants UI (Card, Button, Badge, Banners, States…) | Contrats API, schémas, endpoints |
| Nouveaux composants présentationnels | Seuils cliniques, calculs de risque |
| Écrans patient & clinicien (mise en page, hiérarchie) | Données (toujours synthétiques) |
| Micro-interactions via `Animated` (RN, zéro dépendance) | Stockage des jetons (inchangé) |
| Visuel du `CgmChart` (axes, repère, légende) | Tout calcul/dérivation côté client |

## 3. Design system (`theme.ts`)

- Palette enrichie (verts de marque `brandDeep`/`brandDark`, surfaces toniques
  `brandSurface`/`brandSurfaceStrong`, `surfaceMuted`, fond `#F6F8FB`).
- Élévation multi-niveaux : `shadow.subtle`, `shadow.card`, `shadow.elevated`.
- Jetons de **mouvement** : `motion.fast (120 ms)`, `motion.base (200 ms)`,
  `motion.slow (320 ms)` — utilisés par les micro-interactions.
- Couleurs de risque et contrastes **conservés** (WCAG AA), `MIN_TOUCH_TARGET`
  inchangé (zones tactiles ≥ 44 px).

## 4. Composants

**Refondus** : `Card` (variants `default`/`tonal`/`flat` + apparition douce),
`Button` (prop `size`, retour d'échelle à la pression, `Pressable`), `Badge`
(pastille + libellé texte explicite), `Banners` (`AlertBanner`,
`OpenLoopSyntheticBanner`, ajout `ComplianceBanner`, `OfflineBanner`), `States`
(`SkeletonLine`, squelette de chargement, `EmptyState`/`ErrorState` soignés),
`XaiWarningBox` (en-tête à pastille, libellé de fiabilité **texte**),
`RecommendationCard` (hiérarchie, rappel open-loop renforcé), `TabIcon`.

**Nouveaux (présentationnels uniquement)** : `Header` (variant `hero`/`plain`),
`SectionTitle`, `MetricCard`, `PatientCard` (avatar d'initiales + zone tactile
large), `ClinicianActionBar` (cadre des actions de validation humaine),
`SelectChip` (puce/segment de sélection unique et **accessible** : toute la puce
est la zone tactile `Pressable` ≥ 44 px, état porté par texte + bordure + fond).

> Micro-interactions : `react-native` `Animated` avec `useNativeDriver`. **Aucune
> nouvelle dépendance** ajoutée. Le texte reste toujours rendu (lisible par les
> lecteurs d'écran et requêtable par les tests) même pendant les animations.

## 5. Écrans

- **Patient** : `login` (logotype, bannière conformité), `index` (en-tête héros +
  `MetricCard` dernière glycémie), `data` (chronologie + graphique CGM), `risk`
  (sélecteurs segmentés + `MetricCard` probabilité), `xai` (liste de variables
  numérotée), `recommendations`, `profile`.
- **Clinicien** : `index` (héros + `PatientCard` cliquables), `recommendations`
  (filtres + `ClinicianActionBar`), `xai` (global), `profile`, et
  `patient-detail` (héros, `MetricCard` risque, `SectionTitle`, actions encadrées).

## 6. Visuel du graphique CGM (`CgmChart`)

- Gouttière d'axe Y avec étiquettes de repère **fixes** (40 / 70 / 180 / 300),
  lignes de repère pointillées 70–180, légende texte de la bande.
- **Invariants préservés** : domaine d'affichage **fixe** `[40, 300]` (aucune
  dérivation des données), barres **toutes de la même couleur** (jamais d'encodage
  « dans/hors plage » par la couleur — ce serait une interprétation clinique),
  repère 70–180 **non décisionnel**, `testID` `cgm-chart`/`cgm-chart-fallback`,
  libellé d'accessibilité et mention « aucune interprétation clinique » inchangés.

## 7. Accessibilité

- Information **jamais** portée par la seule couleur : chaque badge/bannière/repère
  est accompagné d'un libellé texte.
- Zones tactiles ≥ 44 px **sans exception** : boutons, cartes patient et **tous**
  les sélecteurs (cibles/horizons/filtres/couples) passent par `SelectChip`, dont
  toute la surface (`Pressable`, `minHeight: MIN_TOUCH_TARGET`) est la cible tactile
  — le `onPress` n'est plus porté par le `Text`. Test de non-régression dédié
  (`ui-constraints.test.ts` : aucun `minHeight` < 44 px dans les écrans à sélecteurs).
- Libellés et rôles d'accessibilité explicites (`button`, `alert`, `image`,
  `progressbar`), états `selected`/`disabled`/`busy` annoncés.

## 8. Tests

- **Existants : verts** (8 suites, 34 tests) — y compris `cgmChart.test.tsx`,
  `recommendations.rbac.test.ts`, `no-token-leak.test.ts`, `components.test.tsx`.
- **Ajoutés** : `ui-components.test.tsx` (rendu des nouveaux composants,
  disclaimers visibles, `RecommendationCard` sans dose) et `ui-constraints.test.ts`
  (composants visuels n'important jamais `services/api/ml` ni
  `services/api/recommendations`, aucune instruction de dose, séparation des rôles
  patient ≠ actions de validation clinicien).
- **Total : 10 suites / 79 tests verts.** `tsc --noEmit` : rc=0.

> **Note (pré-existante, hors Phase 8.5)** : `jest --ci --runInBand` se termine avec
> le code 1 **alors que les 79 tests passent** — uniquement à cause d'un avertissement
> Expo émis *après* le démontage des tests (`Cannot log after tests are done` →
> `ExpoModulesCoreJSLogger`). Ce n'est pas un échec de test ; ne pas le corriger par
> un mock global d'`expo-secure-store` (casserait le test « no-token-leak »).

## 9. Commandes de validation

```bash
cd mobile && npx tsc --noEmit          # rc=0
cd mobile && npx jest --ci --runInBand # 10 suites / 79 tests verts
cd backend && python scripts/validate_backend.py  # RESULTAT : OK
```

## 10. Invariants de conformité (revérifiés)

- Données **synthétiques** uniquement ; bannières open-loop/synthétique visibles.
- **Open-loop strict** : aucune dose, aucune décision/action automatique.
- **XAI = support d'affichage/audit** ; fiabilité exprimée par texte ; jamais une
  cause clinique.
- **API = source de vérité** : aucun calcul de risque/reco côté client/UI.
- Jetons mobiles : stockage **inchangé** (SecureStore natif / mémoire volatile web).
- Validation humaine des recommandations **réservée au clinicien** (RBAC serveur +
  séparation d'écran vérifiée par test).

## 11. Rapport final (11 points)

1. **Objectif atteint** : refonte UI/UX premium de toute l'app mobile, sans
   toucher à la logique métier.
2. **Design system** : tokens d'élévation, de mouvement et de surface ajoutés ;
   exports existants préservés.
3. **Composants** : 9 refondus, 5 nouveaux, tous présentationnels.
4. **Écrans** : 7 patient + 5 clinicien/dossier modernisés (en-têtes, métriques,
   sections, cartes patient, barres d'action).
5. **CGM** : visuel amélioré (axes/repères/légende) avec invariants non
   décisionnels intacts.
6. **Micro-interactions** : `Animated` RN, **zéro dépendance**, sans régression
   perceptible.
7. **Accessibilité** : contrastes AA, ≥ 44 px, libellés/rôles, jamais
   info-par-couleur-seule.
8. **Conformité** : open-loop, synthétique, XAI support-only, API source de vérité
   — tous revérifiés.
9. **Tests** : existants verts + 2 nouvelles suites ; 79 tests verts ; `tsc` rc=0 ;
   backend smoke OK.
10. **Aucune dépendance lourde** ajoutée ; aucune modification backend/ML/XAI/reco.
11. **Phase 9 NON démarrée** — en attente de validation explicite du superviseur.
