# Checklist QA pré-release mobile — MediAI Care

> **Phase 8.** À exécuter avant toute diffusion interne d'un build device. Prototype
> **NON certifié** · données **synthétiques** · **open-loop strict**. Cocher chaque item.

Légende : ✅ ok · ⚠️ ok avec limite documentée · ❌ bloquant.

## 1. Authentification
- [ ] Login patient et clinicien fonctionnels (identifiants démo).
- [ ] Identifiants invalides → message FR non technique.
- [ ] Politique de mot de passe (≥ 12) appliquée côté serveur.

## 2. Refresh
- [ ] Refresh automatique sur 401, dédupliqué.
- [ ] Refresh invalide → effacement secrets + retour Login.

## 3. Logout
- [ ] Logout efface les secrets (même si réseau KO).
- [ ] Aucun jeton résiduel après logout.

## 4. Patient
- [ ] Accueil, données (graphique CGM + listes), risque, XAI, recos, profil OK.
- [ ] Le **graphique CGM** est en lecture seule (aucune action, aucun calcul local).
- [ ] Fallback liste du graphique si < 2 points.

## 5. Clinicien
- [ ] Cohorte, détail patient, estimation, XAI, génération/validation recos OK.
- [ ] Génération → `pending` ; modify revalide la safety ; transitions gardées.

## 6. Recommandations
- [ ] Patient : **approuvées uniquement**.
- [ ] Aucune dose, aucune instruction thérapeutique.
- [ ] Rappel open-loop + validation humaine présents.

## 7. XAI
- [ ] Statut de fiabilité + warnings affichés (texte, pas couleur seule).
- [ ] « Non fiable » → alerte visuelle forte.
- [ ] Aucun langage causal.

## 8. Offline
- [ ] Bannière hors-ligne ; cache mémoire lisible.
- [ ] Aucune action décisionnelle/offline ; aucune file locale de recos.

## 9. Erreurs réseau
- [ ] 400/401/403/404/409/422/429/503/réseau/timeout → messages FR non techniques.
- [ ] `EXPO_PUBLIC_API_BASE_URL` absente → message explicite, pas de crash.

## 10. Accessibilité
- [ ] Rôles/états/labels présents ; cibles ≥ 44 px ; info jamais par couleur seule.
- [ ] (Device) VoiceOver/TalkBack : voir `DEVICE_ACCESSIBILITY_CHECKLIST.md`.

## 11. Sécurité du jeton
- [ ] Jetons en SecureStore (natif) / mémoire volatile (web) ; jamais AsyncStorage/localStorage.
- [ ] Aucun jeton loggé/affiché (garde CI `no-token-leak`).
- [ ] (Device) Keychain/Keystore : voir `DEVICE_TOKEN_STORAGE_VALIDATION.md`.

## 12. Disclaimers
- [ ] Bannière synthétique + open-loop + non certifié visible.
- [ ] « Ne modifiez jamais votre traitement sans avis médical » présent sur recos.
- [ ] Graphique CGM : mention « repère non décisionnel / aucune interprétation clinique ».

## 13. Non-certification
- [ ] Aucune mention de certification/conformité réglementaire affirmée.
- [ ] Mentions « prototype non certifié » visibles.

## 14. Synthetic-only
- [ ] Toutes les données portent `is_synthetic=True` (API).
- [ ] Aucune saisie/import de donnée réelle.

## 15. Open-loop
- [ ] Aucune décision automatique, aucune dose, aucune action déclenchée par l'app.
- [ ] Probabilités/XAI/recos proviennent exclusivement de l'API.

## 16. Configuration / durcissement
- [ ] Aucune URL sensible en dur ; API via env ; secrets via EAS.
- [ ] Logs réduits en build ; aucun secret en clair.

## Synthèse
| Bloc | Résultat | Notes |
|---|---|---|
| 1–3 Auth/refresh/logout | | |
| 4–5 Patient/Clinicien | | |
| 6–7 Recos/XAI | | |
| 8–9 Offline/Erreurs | | |
| 10–11 A11y/Token | | |
| 12–15 Conformité | | |
| 16 Config | | |
