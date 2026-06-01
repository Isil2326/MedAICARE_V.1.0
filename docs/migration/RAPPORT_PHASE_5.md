# Rapport Phase 5 — Consolidation backend/API/sécurité/contrats

> Prototype non certifié · open-loop · données synthétiques. Mémoire de Master.
> Rapport structuré destiné à la validation du superviseur.

## 1. Contexte et objectif
Après les Phases 0–4.1 (socle FastAPI+PostgreSQL, sécurité, ML, XAI, moteur de
recommandation open-loop, verrouillage sémantique), la Phase 5 **consolide** l'existant :
durcissement mesuré, contrats documentés, tests E2E, préparation mobile **sans
implémentation**. Aucune nouvelle capacité métier, aucun changement de comportement clinique.

## 2. Périmètre tenu (non-négociables)
| Non-négociable | Statut |
|---|---|
| Pas de mobile (Expo/RN/build) | ✅ tenu (uniquement documentation de préparation) |
| Pas de données réelles (`is_synthetic=True`) | ✅ tenu |
| Pas de réentraînement / nouveau modèle / seuil modifié | ✅ tenu |
| Open-loop strict | ✅ tenu |
| XAI support-only (`clinical_justification_allowed` jamais `true`) | ✅ tenu (+ test) |
| Validation clinicien obligatoire | ✅ inchangé |
| Migrations additives rejouables | ✅ aucune migration ajoutée |
| Tous les tests antérieurs verts | ✅ 158 → 172 |

## 3. Durcissement de sécurité (mesuré)
- Rate-limit ajouté sur les endpoints **coûteux** (predict/xai/generate), configurable,
  `429` au-delà, garde-fou exécuté avant l'auth.
- OpenAPI enrichi : `BearerAuth`, description open-loop/synthetic, tags, `x-open-loop`,
  exemples de schémas critiques.
- Confirmé déjà présent : CORS par env, en-têtes de sécurité, `/ready`→503, rate-limit
  login/refresh, JWT secret obligatoire hors test, refresh hashé + rotation + reuse-detection.

## 4. Tests
- **172 tests verts** (158 antérieurs + 14 Phase 5), exécutés par lots (contrainte mémoire).
- Nouveaux : `test_e2e_workflows.py` (patient/clinicien/sécurité), `test_phase5.py`
  (OpenAPI, headers, `/ready`, rate-limit 429, no-secrets, spoof 422, verrou XAI safety).

## 5. Contrats & documentation produits
- API : `docs/api/API_V1_CONTRACTS.md`, `docs/api/ERROR_CATALOG.md`.
- Sécurité : `docs/security/RBAC_MATRIX.md`, `docs/security/AUDIT_COVERAGE.md`.
- Ops : `docs/ops/PERFORMANCE_NOTES.md`, `TEST_STRATEGY.md`, `VALIDATION_COMMANDS.md`.
- Mobile (préparation) : `docs/mobile/MOBILE_API_CONTRACTS.md`.
- Conformité : `docs/compliance/COMPLIANCE_SCOPE.md`, `SYNTHETIC_DATA_POLICY.md`.
- Migration : `docs/migration/PHASE_5_CONSOLIDATION.md` + ce rapport.

## 6. Outillage
- `backend/scripts/run_test_batches.sh` (exécution par lots, anti-OOM).
- `backend/scripts/validate_backend.py` (smoke contractuel sans serveur — vert).

## 7. Performance (indicatif, in-process)
`/health` ~16 ms · `/ready` ~22 ms (2 requêtes DB) · `/ml/predict` (sans artefact) ~47 ms.
Méthode reproductible : `docs/ops/PERFORMANCE_NOTES.md`. Pas un benchmark de production.

## 8. Décisions argumentées
- **Enveloppe d'erreur uniforme : proposée, non implémentée** — l'implémenter casserait
  le format `{"detail"}` (défaut FastAPI) et les 158 tests/contrats. Conforme à « proposer
  ou implémenter ». Voie d'implémentation décrite dans `ERROR_CATALOG.md`.
- **Rate limit par IP** (généreux, configurable) ; limite documentée (idéal par-utilisateur
  derrière proxy de confiance).

## 9. Conformité / posture honnête
Aucune certification (MDR, IEC 62304, ISO 13485, HDS, RGPD opérationnel). Données
synthétiques exclusivement. Détail : `docs/compliance/COMPLIANCE_SCOPE.md`,
`SYNTHETIC_DATA_POLICY.md`, `MedAICare_V.3_10Patients/LIMITATIONS.md`.

## 10. Invariants vérifiés par test (sélection)
- `clinical_justification_allowed` jamais `true` (garde-fou safety).
- Spoof de `probability`/`model_name`/`xai_status` → `422` (`extra="forbid"`).
- Aucun secret (mot de passe/jeton) dans l'audit.
- `429` au-delà du rate-limit sur endpoint coûteux.
- OpenAPI expose BearerAuth + marqueur open-loop.

## 11. Risques résiduels / reste à faire (hors périmètre)
Client mobile, enveloppe d'erreur uniforme, versionnement de schéma, rate limit
par-utilisateur, warm-up des artefacts, pagination par curseur, conformité réglementaire
opérationnelle. À traiter en Phase 6+ uniquement après validation.

## 12. Conclusion
La Phase 5 livre une consolidation **conservatrice et documentée** : sécurité durcie de
façon mesurée, contrats et posture explicités, tests de bout en bout, préparation mobile
sans code mobile. **Aucun comportement clinique modifié.** **Phase 6 NON démarrée** —
en attente de validation du superviseur.
