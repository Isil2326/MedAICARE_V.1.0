# Rapport Phase 7 — QA mobile, validation E2E, accessibilité, soutenance

> **MediAI Care** — prototype académique **NON certifié** · données **100 %
> synthétiques** · **open-loop strict** · **XAI support-only** · **API = source de
> vérité**. Phase 7 = phase de **validation/documentation**, sans nouvelle
> fonctionnalité métier majeure, sans changement ML/XAI/seuils. Tous les tests
> existants restent verts.

## 1. Fichiers ajoutés / modifiés
**Ajoutés**
- `docs/demo/E2E_DEMO_SCRIPT.md` — script démo E2E backend + mobile.
- `docs/qa/MOBILE_QA_CHECKLIST.md` — checklist QA manuelle (16 blocs).
- `docs/demo/SCREEN_WALKTHROUGH.md` — walkthrough textuel écran par écran.
- `docs/security/MOBILE_SECURITY_REVIEW.md` — revue sécurité mobile.
- `docs/qa/ACCESSIBILITY_REVIEW.md` — revue d'accessibilité.
- `docs/demo/SOUTENANCE_SCENARIO.md` — scénario de soutenance.
- `docs/architecture/FINAL_ARCHITECTURE.md` — architecture finale + schéma Mermaid.
- `docs/qa/TRACEABILITY_MATRIX.md` — matrice Exigence→Implémentation→Test→Document→Limite.
- `docs/migration/RAPPORT_PHASE_7.md` — ce rapport.
- Dossiers créés : `docs/demo/`, `docs/qa/`, `docs/security/`, `docs/architecture/`,
  `docs/demo/screenshots/` (prêt pour captures manuelles).

**Modifiés**
- `replit.md` — Phase 6 → **validée**, Phase 7 → **livré, à valider**, prochaine phase
  → Phase 8 ; ajout des références documentaires Phase 7.

**Code applicatif** : **aucune modification** (open-loop, RBAC, ML, XAI, sécurité
inchangés ; la revue a11y a confirmé la conformité existante sans correction de code
nécessaire).

## 2. Script démo E2E
`docs/demo/E2E_DEMO_SCRIPT.md` : pré-requis + lancement (workflows, migrations, seed) ;
**parcours patient** (login → profil → séries → `ml/predict` → `xai/explain` → recos
**approuvées uniquement** → logout) ; **parcours clinicien** (login → cohorte → détail →
séries → predict → XAI → `generate` (pending) → `modify` (safety revalidée) →
`approve`/`reject` → **vérification côté patient** que seule l'approuvée est visible →
audit chaîné → logout) ; points de validation transverses.

## 3. Checklist QA
`docs/qa/MOBILE_QA_CHECKLIST.md` : 16 blocs — auth, refresh, logout, RBAC patient/
clinicien, erreurs (400/401/403/404/409/422/429/503/réseau), offline, disclaimers, XAI
warnings, recommandations, accessibilité, responsive, navigation, absence de données
réelles, absence de dose, absence de token dans les logs. Tableau de synthèse à cocher.

## 4. Walkthrough écrans
`docs/demo/SCREEN_WALKTHROUGH.md` : structure textuelle des 13 écrans (login,
aiguillage, patient ×6, clinicien ×5 dont détail). Capture automatisée Expo Web
**indisponible sur Replit** (l'outil cible le port 5000 React, pas Expo Web 5173) →
documentation textuelle + procédure de captures manuelles vers `docs/demo/screenshots/`.

## 5. Sécurité mobile
`docs/security/MOBILE_SECURITY_REVIEW.md` : jetons (SecureStore natif / **mémoire
volatile** sur web, plus strict que `localStorage`), jamais d'`AsyncStorage`, jamais
loggés (tests statiques), API base URL via env uniquement, refresh 401 dédupliqué,
logout effaçant les secrets même en cas d'échec réseau, RBAC serveur respecté, cache de
données sensibles en mémoire uniquement (données synthétiques). **Aucun écart bloquant.**

## 6. Accessibilité
`docs/qa/ACCESSIBILITY_REVIEW.md` : tailles de texte ≥ 16 px, contrastes AA visés,
labels/rôles a11y, `MIN_TOUCH_TARGET = 44`, **non-dépendance à la couleur** (badges +
libellés ; XAI non fiable = bordure + préfixe ⚠ + texte). Conformité de base
**confirmée sans correction de code**. Limite : VoiceOver/TalkBack et contraste mesuré
non testables sur preview Expo Web.

## 7. Scénario de soutenance
`docs/demo/SOUTENANCE_SCENARIO.md` : 13 sections (objectif, limites, architecture,
backend, ML, XAI, recos open-loop, sécurité, démo patient, démo clinicien, ce qui est
simulé, ce qui n'est pas certifié, ce qu'il faudrait pour des données réelles) +
questions anticipées.

## 8. Architecture finale
`docs/architecture/FINAL_ARCHITECTURE.md` : schéma **Mermaid** (3 couches autour de
l'API source-de-vérité) + détail backend/PostgreSQL/pipeline anti-leakage/ML/XAI/recos/
mobile/sécurité/audit + flux séquentiel d'une recommandation + limites Replit.

## 9. Matrice de traçabilité
`docs/qa/TRACEABILITY_MATRIX.md` : 14 lignes Exigence → Implémentation → Test →
Document → Limite (open-loop, synthetic-only, RBAC, audit chaîné, refresh rotation/
reuse, anti-leakage, ML metrics, XAI warnings, reco safety, mobile token security,
accessibilité, API source-of-truth, anti-spoof probabilité, durcissement API).

## 10. Tests exécutés
| Périmètre | Commande | Résultat |
|---|---|---|
| Mobile typecheck | `cd mobile && npx tsc --noEmit` | **rc=0** |
| Mobile tests | `cd mobile && npx jest --ci --runInBand` | **7 suites / 29 tests verts** |
| Backend smoke contractuel | `cd backend && python scripts/validate_backend.py` | **OK** (OpenAPI/BearerAuth/open-loop/endpoints/health/ready/safety XAI) |
| Backend tests (inventaire) | `cd backend && bash scripts/run_test_batches.sh` (par lots, anti-OOM) | **172 fonctions de test** réparties sur 16 fichiers |

**Décision T005 (E2E/smoke) — Option B retenue, justifiée.** Playwright **non ajouté** :
sur l'environnement Replit, Expo Web + backend seedé + auth vivante rendent un E2E
navigateur **fragile** et imposeraient une dépendance lourde (contraire aux
non-négociables « aucune fonctionnalité lourde hors QA/doc »). La couverture smoke E2E
est assurée par : (a) la suite **jest mobile** qui exerce login/refresh/logout, mapping
d'erreurs, RBAC et anti-fuite de token (mocks de service) ; (b) le **smoke contractuel
backend** (`validate_backend.py`) ; (c) les **tests e2e backend** (`test_e2e_workflows.py`,
`test_phase5.py`). Le script `docs/demo/E2E_DEMO_SCRIPT.md` fournit l'E2E **manuel**
reproductible.

## 11. Corrections éventuelles
- **Aucune correction de code applicatif** nécessaire : la revue a11y et la revue
  sécurité ont confirmé la conformité existante (Phase 6).
- Documentation : `replit.md` mis à jour (statuts de phase + références Phase 7) ;
  cohérence documentaire vérifiée (aucun claim de certification/performance clinique/
  données réelles ; « la cause est » présent **uniquement** comme terme interdit cité ;
  XAI ≠ causalité ≠ justification clinique respecté partout).

## 12. Limites restantes
- **Captures Expo Web automatisées indisponibles** sur Replit → walkthrough textuel +
  captures manuelles.
- **VoiceOver/TalkBack, SecureStore réel, build EAS, caméra/push natifs, TLS pinning**
  non exerçables en preview Expo Web (à valider sur device réel).
- **Contraste mesuré instrumenté** et zones tactiles au doigt à revalider sur device.
- **Rate-limit par IP** (idéal par-utilisateur derrière proxy — documenté).
- **Enveloppe d'erreur uniforme** proposée, non implémentée (préserve `{"detail"}` +
  tests existants).
- Scores ML élevés = **benchmark synthétique séparable**, non transférable au clinique.
- Journal de décision de l'app web = `localStorage` non-autoritaire (démo).

## 13. Recommandation pour Phase 8
**Ne PAS démarrer la Phase 8 sans validation explicite du superviseur.** Pistes
proposées (open-loop, synthétiques, **sans changement ML/XAI/seuils**) :
1. **Build device réel via EAS** pour exercer Keychain/Keystore réels, SecureStore sous
   verrouillage/biométrie, et audit lecteur d'écran (VoiceOver/TalkBack).
2. **TLS certificate pinning** mobile → API (hors prototype).
3. **Graphiques séries temporelles mobiles en lecture seule** (visualisation, sans
   nouveau calcul métier côté client).
4. **Audit d'accessibilité complet** sur device (focus, annonces, contraste mesuré,
   agrandissement 200 %).
5. (Si cadre réglementaire ultérieur) démarche données réelles : éthique/RGPD/HDS,
   validation clinique prospective, IEC 62304 / ISO 14971, gouvernance des modèles.

---

**Conclusion.** Phase 7 livrée (QA mobile, validation E2E documentée, revue sécurité &
accessibilité, architecture finale, matrice de traçabilité, scénario de soutenance),
tests existants **verts**, **aucune** régression de posture (non certifié, synthétique,
open-loop, XAI support-only, API source de vérité). **En attente de validation du
superviseur. Phase 8 non démarrée.**
