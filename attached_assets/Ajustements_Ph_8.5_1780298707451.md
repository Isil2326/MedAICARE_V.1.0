Avant de démarrer la Phase 9, je veux insérer une phase intermédiaire obligatoire :

PHASE 8.5 — Refonte UI/UX premium, design system et polish démo

Objectif :
Réorganiser et améliorer le design de l’application mobile pour qu’elle soit moderne, fluide, cohérente, attractive et convaincante en soutenance/démonstration, sans modifier la logique métier, sans changer les contrats API, sans toucher au ML/XAI/recommandations, et sans introduire de données réelles.

La Phase 9 est suspendue jusqu’à validation de cette Phase 8.5.

Contraintes non négociables :

1. Ne pas modifier le backend métier.
2. Ne pas modifier les modèles ML.
3. Ne pas modifier XAI.
4. Ne pas modifier les règles de recommandation.
5. Ne pas modifier les seuils.
6. Ne pas introduire de données réelles.
7. Ne pas créer de décision automatique.
8. Ne pas ajouter de dose ou conseil thérapeutique.
9. Ne pas stocker de token dans AsyncStorage/localStorage.
10. Maintenir open-loop strict.
11. Maintenir XAI support-only.
12. Maintenir API = source de vérité.
13. Maintenir accessibilité et lisibilité.
14. Ne pas sacrifier la performance pour l’esthétique.

Périmètre attendu :

## 1. Direction artistique mobile

Créer une direction visuelle cohérente :

- style moderne medtech ;
- interface claire, premium, rassurante ;
- hiérarchie visuelle forte ;
- design patient plus chaleureux ;
- design clinicien plus professionnel ;
- cohérence couleurs, typographie, espacements ;
- cards plus propres ;
- badges plus lisibles ;
- états de risque plus élégants ;
- disclaimers visibles mais mieux intégrés.

Objectif : donner une impression de produit mature, pas de prototype brut.

## 2. Design system

Refondre ou consolider les composants UI :

- `Button`;
- `Card`;
- `Screen`;
- `Header`;
- `SectionTitle`;
- `StatusBadge`;
- `RiskBadge`;
- `SyntheticBadge`;
- `ComplianceBanner`;
- `XaiWarningBox`;
- `RecommendationCard`;
- `MetricCard`;
- `PatientCard`;
- `ClinicianActionBar`;
- `LoadingState`;
- `ErrorState`;
- `EmptyState`.

Tous les composants doivent être réutilisables, typés et accessibles.

## 3. Écrans patient à polir

Améliorer visuellement :

- Login ;
- Patient Home ;
- Données / CGM ;
- Risque ;
- XAI ;
- Recommandations ;
- Profil.

Priorités patient :

- écran d’accueil plus convaincant ;
- carte glycémie / données synthétiques plus moderne ;
- meilleur affichage des risques ;
- meilleure lisibilité de la XAI ;
- recommandations approuvées plus claires ;
- messages de prudence intégrés sans alourdir l’interface.

## 4. Écrans clinicien à polir

Améliorer visuellement :

- liste patients ;
- détail patient ;
- prédiction ;
- XAI ;
- recommandations ;
- actions approve/reject/modify.

Priorités clinicien :

- vue plus professionnelle ;
- meilleure densité d’information ;
- badges statut lisibles ;
- actions clairement séparées ;
- pending/approved/rejected/modified bien distingués ;
- XAI warnings visibles ;
- workflow open-loop évident.

## 5. Fluidité et micro-interactions

Ajouter uniquement des animations légères si compatibles Expo/Replit :

- transitions simples ;
- feedback bouton ;
- skeleton/loading propre ;
- états vides élégants ;
- erreurs plus lisibles ;
- refresh visuel doux.

Ne pas ajouter de dépendance lourde sauf justification.

## 6. Graphiques et visualisation

Améliorer le graphique CGM lecture seule :

- design plus moderne ;
- axes lisibles ;
- repère 70–180 clair ;
- accessibilité conservée ;
- aucun calcul de risque local ;
- aucun conseil thérapeutique.

Si possible, améliorer aussi l’affichage repas/insuline/activité sous forme de timeline visuelle simple, lecture seule.

## 7. Cohérence responsive Expo Web

Vérifier :

- rendu mobile étroit ;
- rendu web Replit ;
- pas d’overflow ;
- spacing correct ;
- lisibilité ;
- zones tactiles ;
- aucune carte coupée ;
- navigation stable.

## 8. Accessibilité maintenue

Chaque amélioration design doit respecter :

- contraste suffisant ;
- texte lisible ;
- boutons accessibles ;
- labels ;
- pas d’information uniquement par couleur ;
- taille minimale ;
- warnings XAI bien lisibles.

Si une couleur ou animation nuit à l’accessibilité, elle doit être corrigée.

## 9. Performance

Ne pas alourdir inutilement l’app.

Vérifier :

- pas de dépendance graphique lourde inutile ;
- pas de re-render massif ;
- pas d’animation coûteuse ;
- pas de gros assets non optimisés ;
- composants simples et robustes.

## 10. Documentation design

Créer :

- `docs/mobile/PHASE_8_5_UI_UX_POLISH.md`

Inclure :

- objectif ;
- direction artistique ;
- composants refondus ;
- écrans améliorés ;
- choix couleurs ;
- typographie ;
- accessibilité ;
- performance ;
- limites ;
- screenshots ou walkthrough.

## 11. Tests

Conserver et adapter les tests existants.

Ajouter si pertinent :

- tests de rendu composants ;
- disclaimers toujours visibles ;
- XAI warnings visibles ;
- RecommendationCard ne contient aucune dose ;
- Patient ne voit pas actions clinicien ;
- pas d’import ML/reco dans composants visuels ;
- typecheck vert.

Commandes attendues :

```bash
cd mobile && npx tsc --noEmit
cd mobile && npx jest --ci --runInBand
cd backend && python scripts/validate_backend.py
```

Backend complet par lots seulement si nécessaire, mais aucune modification backend métier n’est attendue.

## 12. Livrable final Phase 8.5

Fournir un rapport avec :

1. fichiers ajoutés/modifiés ;
2. composants UI créés/refondus ;
3. écrans améliorés ;
4. choix de design ;
5. accessibilité ;
6. performance ;
7. screenshots ou walkthrough visuel ;
8. tests exécutés ;
9. limites restantes ;
10. confirmation qu’aucune logique métier n’a été modifiée ;
11. recommandation pour Phase 9.

Conclusion :
Ne pas démarrer la Phase 9. Démarrer maintenant la Phase 8.5 — Refonte UI/UX premium, design system et polish démo.
