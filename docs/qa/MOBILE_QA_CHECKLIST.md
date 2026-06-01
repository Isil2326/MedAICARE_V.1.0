# Checklist QA manuelle — application mobile MediAI Care

> **Phase 7.** À exécuter sur le preview **Expo Web** (port 5173) avec le backend
> (port 8000) lancé et la base synthétique seedée. Cocher chaque item. Aucune donnée
> réelle, open-loop strict, XAI support-only.

Légende statut : ✅ conforme · ⚠️ conforme avec limite documentée · ❌ non conforme (à corriger).

## 1. Authentification
- [ ] Login patient (`patient@demo.fr`) → espace patient.
- [ ] Login clinicien (`clinicien@demo.fr`) → espace clinicien.
- [ ] Identifiants invalides → message FR « identifiants incorrects » (pas de stack technique).
- [ ] Mot de passe < 12 caractères refusé côté serveur (politique mot de passe).
- [ ] Inscription clinicien désactivée (note démo affichée).

## 2. Refresh token
- [ ] Sur expiration de l'access token, une requête 401 déclenche `POST /auth/refresh` automatique puis rejeu transparent.
- [ ] Refresh concurrent dédupliqué (une seule tentative en vol).
- [ ] Refresh invalide/expiré → effacement des secrets + retour Login (handler `auth-expired`).

## 3. Logout
- [ ] Déconnexion appelle `POST /auth/logout` puis efface les secrets dans `finally`.
- [ ] Logout efface les secrets **même si l'appel réseau échoue**.
- [ ] Après logout, toute requête protégée → retour Login (aucun token résiduel).

## 4. RBAC patient
- [ ] Patient ne voit que **ses** données (séries, profil).
- [ ] Recommandations patient = `GET /recommendations/mine` → **approuvées uniquement**.
- [ ] Aucune action clinicien (générer/approuver/rejeter/modifier) visible ou atteignable.
- [ ] Appel d'un endpoint clinicien en tant que patient → 403 mappé FR.
- [ ] XAI globale inaccessible au patient.

## 5. RBAC clinicien
- [ ] Liste patients + détail accessibles.
- [ ] `POST /recommendations/generate` crée une reco en `pending` (jamais auto-approuvée).
- [ ] `modify` revalide la safety (texte + note) ; terme interdit/dose → 400 `safety_blocked`.
- [ ] Transitions de statut gardées (`pending|modified → approved|rejected`).
- [ ] XAI globale (`GET /xai/global`) accessible.

## 6. Erreurs API (messages FR non techniques, sans masquer le critique)
- [ ] 400 → message « requête invalide » + détail court éventuel.
- [ ] 401 → « session expirée, reconnectez-vous ».
- [ ] 403 → « droits insuffisants ».
- [ ] 404 → « ressource introuvable ».
- [ ] 409 → conflit d'état (workflow reco).
- [ ] 422 → validation (ex. spoof de probabilité refusé).
- [ ] 429 → « trop de requêtes, réessayez plus tard » (rate-limit).
- [ ] 503 → « service indisponible » (`/ready`).
- [ ] Réseau/timeout → « connexion impossible » + retry GET.
- [ ] `EXPO_PUBLIC_API_BASE_URL` manquante → message explicite, pas de crash.

## 7. Offline minimal
- [ ] Bannière hors-ligne affichée quand la connexion est perdue (`useOnline`).
- [ ] Données en cache mémoire (TanStack Query) lisibles hors-ligne.
- [ ] Actions réseau désactivées/échouent proprement hors-ligne (aucune file locale de recos, aucune décision offline).

## 8. Disclaimers / conformité
- [ ] Bannière synthétique + open-loop + non certifié visible sur les écrans clés.
- [ ] Disclaimer « Ne modifiez jamais votre traitement sans avis médical » présent sur les recos.
- [ ] Badges « données simulées » sur les listes.

## 9. XAI warnings
- [ ] `xai_reliability_status` affiché (reliable / caution / not_reliable).
- [ ] `xai_warnings` et `semantic_limitations` visibles, jamais masqués.
- [ ] Cas `not_reliable_for_clinical_interpretation` → alerte visuelle forte (bordure + préfixe).
- [ ] Aucun langage causal (« le modèle a utilisé… », jamais « la cause est »).

## 10. Recommandations
- [ ] Catégories non prescriptives affichées (alerte/comportemental/renvoi clinique/revue).
- [ ] Rappel open-loop + validation humaine sur chaque carte.
- [ ] Patient : aucune reco non approuvée visible.

## 11. Accessibilité (résumé — détail dans docs/qa/ACCESSIBILITY_REVIEW.md)
- [ ] Boutons avec texte + `accessibilityRole`/`accessibilityState`.
- [ ] Zones tactiles ≥ 44 px (`MIN_TOUCH_TARGET`).
- [ ] Contraste AA ; info critique jamais par couleur seule (libellé + icône).
- [ ] Corps de texte ≥ 16 px ; dynamic type respecté.

## 12. Responsive web
- [ ] Mise en page lisible en largeur mobile étroite (preview Expo Web).
- [ ] Pas de débordement / chevauchement des cartes et bannières.

## 13. Navigation
- [ ] Aiguillage racine selon rôle (`index.tsx`).
- [ ] Gardes de groupe (`(patient)`/`(clinician)`) redirigent si rôle incorrect.
- [ ] Retour arrière cohérent (détail → liste).

## 14. Absence de données réelles
- [ ] Toutes les données portent `is_synthetic=True` côté API.
- [ ] Aucune saisie/import de donnée patient réelle possible.

## 15. Absence de dose / conseil thérapeutique
- [ ] Aucun nombre d'unités d'insuline, aucune posologie affichée.
- [ ] Aucune instruction « faites / injectez / modifiez votre traitement ».

## 16. Absence de token dans les logs
- [ ] Aucun `console.log` de token (test statique `no-token-leak`).
- [ ] Aucun import d'`AsyncStorage` (test statique).
- [ ] Jetons jamais affichés à l'écran.

---

## Synthèse d'exécution
| Bloc | Résultat | Notes |
|---|---|---|
| 1 Auth | | |
| 2 Refresh | | |
| 3 Logout | | |
| 4 RBAC patient | | |
| 5 RBAC clinicien | | |
| 6 Erreurs | | |
| 7 Offline | | |
| 8 Disclaimers | | |
| 9 XAI | | |
| 10 Recos | | |
| 11 A11y | | |
| 12 Responsive | | |
| 13 Navigation | | |
| 14 No real data | | |
| 15 No dose | | |
| 16 No token logs | | |

> Limite Replit : VoiceOver/TalkBack et SecureStore réel non testables (preview Expo
> Web). Voir `docs/security/MOBILE_SECURITY_REVIEW.md` et `docs/qa/ACCESSIBILITY_REVIEW.md`.
