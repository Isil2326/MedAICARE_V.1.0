# Checklist d'accessibilité sur device — MediAI Care

> **Phase 8.** Revue d'accessibilité à exécuter sur **appareil réel** (VoiceOver iOS /
> TalkBack Android), non réalisable sur le preview Expo Web Replit. Complète
> `docs/qa/ACCESSIBILITY_REVIEW.md` (revue statique Phase 7).

Légende : ✅ conforme · ⚠️ conforme avec limite · ❌ à corriger.

## A. VoiceOver (iOS device)
- [ ] Ordre de focus logique (haut→bas, gauche→droite) sur chaque écran.
- [ ] Chaque bouton est annoncé avec son **rôle** et son **état** (désactivé/occupé).
- [ ] Les bannières de conformité sont annoncées (rôle `alert`).
- [ ] Le graphique CGM est annoncé par son **label résumé** (pas barre par barre).
- [ ] Aucun élément interactif « invisible » au lecteur d'écran.

## B. TalkBack (Android device)
- [ ] Parcours linéaire cohérent ; pas de piège de focus.
- [ ] Annonces équivalentes à VoiceOver (rôles/états/labels).
- [ ] Gestes d'exploration fonctionnels sur listes et cartes.

## C. Tailles de texte / Dynamic Type
- [ ] Agrandissement système jusqu'à 200 % sans perte d'information critique.
- [ ] Pas de troncature des disclaimers (open-loop, ne pas modifier le traitement).
- [ ] Corps de texte ≥ 16 px conservé après mise à l'échelle.

## D. Contraste (mesuré sur device)
- [ ] Texte principal ≥ AA (4.5:1) ; grands textes ≥ 3:1.
- [ ] Bannières synthétique/risque : contraste suffisant fond/texte.
- [ ] Graphique CGM : barres et repère distinguables (et non porteurs d'info critique seuls).

## E. Zones tactiles
- [ ] Cibles ≥ 44 × 44 px (`MIN_TOUCH_TARGET`) au doigt sur différentes densités.
- [ ] Espacement suffisant entre actions rapprochées (listes, file de recos).

## F. Focus & navigation
- [ ] Focus visible/annoncé après navigation (détail → liste, login → accueil).
- [ ] Retour arrière cohérent ; pas de perte de contexte.
- [ ] Redirections RBAC (rôle incorrect) annoncées sans confusion.

## G. Annonces lecteur d'écran (contenus sensibles)
- [ ] Statut de fiabilité XAI annoncé en **texte** (jamais couleur seule).
- [ ] XAI « non fiable » → annonce explicite (préfixe ⚠ + libellé).
- [ ] Probabilités annoncées avec leur libellé (cible/horizon), sans interprétation.

## H. Navigation patient (device)
- [ ] Accueil → Données (graphique + listes) → Risque → XAI → Recommandations → Profil
      parcourables au lecteur d'écran.
- [ ] Recommandations : seules les **approuvées** annoncées ; disclaimer lu.

## I. Navigation clinicien (device)
- [ ] Cohorte → détail patient → estimation/XAI → génération/validation recos.
- [ ] États (`pending/approved/rejected/modified`) annoncés en **texte** (badge libellé).

## J. Warnings XAI (device)
- [ ] Avertissements et limites sémantiques lus intégralement.
- [ ] Aucune formulation causale annoncée.

## K. Recommandations (device)
- [ ] Catégorie non prescriptive + rappel open-loop annoncés.
- [ ] Aucune dose, aucune instruction thérapeutique lue.

## Synthèse
| Domaine | iOS (VoiceOver) | Android (TalkBack) | Limite |
|---|---|---|---|
| Focus/annonces | à valider | à valider | device requis |
| Contraste mesuré | à valider | à valider | outil device |
| Zones tactiles | à valider | à valider | densités variées |
| Dynamic type | à valider | à valider | 200 % |

> Les rôles/états/labels a11y sont **déjà posés dans le code** (Phase 6/7) ; cette
> checklist valide leur **rendu réel** sur device, non testable sur Replit/Expo Web.
