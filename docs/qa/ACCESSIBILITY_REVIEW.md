# Revue d'accessibilité — application mobile MediAI Care

> **Phase 7 — revue a11y (corrections simples seulement, pas de nouvelle
> fonctionnalité).** Périmètre : app Expo/React Native `mobile/`, vérifiée sur le
> preview Expo Web (port 5173).

Échelle : ✅ conforme · ⚠️ conforme avec limite · ❌ à corriger.

## 1. Tailles de texte
- Corps de texte ≥ 16 px ; hiérarchie titres/labels via le thème (`theme/theme.ts`). ✅
- Dynamic type respecté (pas de tailles figées empêchant l'agrandissement). ✅

## 2. Contrastes
- Palette sémantique (risque/succès/avertissement/danger) assombrie pour viser AA. ✅
- Bannières conformité : surface contrastée (`syntheticSurface` / `synthetic`). ✅
- À revalider avec un outil de contraste sur device réel (limite preview). ⚠️

## 3. Labels
- Champs de formulaire (login) étiquetés ; boutons porteurs de texte explicite. ✅
- Bannières d'alerte : `accessibilityRole="alert"`. ✅
- États (`LoadingState`/`ErrorState`) : `accessibilityRole="progressbar"`/`"alert"`. ✅

## 4. Boutons
- `Button.tsx` : `accessibilityRole="button"` + `accessibilityState={{ disabled, busy }}`. ✅
- Texte toujours présent (jamais icône seule sans libellé). ✅

## 5. Zones tactiles
- `MIN_TOUCH_TARGET = 44` appliqué (`minHeight: 44`) sur les actions principales. ✅
- Vérifier l'espacement des actions rapprochées dans les listes denses. ⚠️

## 6. Messages d'erreur
- Messages FR non techniques, lisibles, annoncés via `role="alert"`. ✅
- Pas de jargon HTTP brut exposé à l'utilisateur. ✅

## 7. Non-dépendance à la couleur
- Statuts de reco : `StatusBadge` avec **libellé texte** (pas seulement une couleur). ✅
- XAI non fiable : bordure épaisse **+ préfixe ⚠ + texte explicite** (pas que la couleur). ✅
- Risque : valeur numérique + libellé, pas uniquement un code couleur. ✅

## 8. Dynamic text / responsive
- Mise en page fluide en largeur mobile étroite (preview Web). ✅
- Pas de troncature critique des disclaimers. ⚠️ (revalider sur petits écrans réels)

## 9. Lecteurs d'écran (VoiceOver / TalkBack)
- **Non testé** : indisponible sur le preview Expo Web Replit. ⚠️ (limite documentée)
- Les rôles/états a11y sont posés pour préparer ce test sur device.

## Corrections appliquées en Phase 7
- Aucune correction de code nécessaire : les rôles/états a11y, le `MIN_TOUCH_TARGET`,
  la non-dépendance à la couleur et les tailles de texte étaient déjà en place
  (Phase 6). Cette revue **confirme** la conformité de base et **documente** les
  points à revalider sur device réel (contraste mesuré, espacement en listes denses,
  lecteurs d'écran).

> Toute correction future devra rester cosmétique/a11y et ne pas modifier la logique
> métier (open-loop, RBAC, ML/XAI inchangés).

## Reste à faire (device réel — hors Phase 7)
1. Audit VoiceOver/TalkBack complet (ordre de focus, annonces).
2. Mesure de contraste instrumentée (AA/AAA) sur tous les états.
3. Test d'agrandissement système jusqu'à 200 %.
4. Vérification des zones tactiles au doigt (densités d'écran variées).
