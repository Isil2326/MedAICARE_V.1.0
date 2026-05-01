# LIMITATIONS — MediAI Care (Prototype Académique)

> **Statut officiel** : prototype de mémoire de Master en Informatique Biomédicale.
> **Version** : v1.0.0-prototype.
> **Usage destiné** : démonstration pédagogique uniquement.
> **Usage interdit** : toute prise de décision clinique réelle, toute manipulation de données patient réelles, toute mise en production.

Ce document liste **explicitement et sans complaisance** ce que le prototype **ne fait pas**, **ne peut pas faire**, et **ne prétend pas faire** — afin d'éviter toute ambiguïté avec un dispositif médical certifié.

Il est complémentaire des deux rapports d'évaluation (`RAPPORT_COMMISSION_AUDIT_PLURIDISCIPLINAIRE.md` et `RAPPORT_JURY_ACADEMIQUE_EXPERTS.md`) qui en détaillent la justification et les axes de remédiation.

---

## 1. Architecture & infrastructure

| Limite | Réalité actuelle | Cible d'un produit certifié |
|--------|------------------|------------------------------|
| Backend | **Aucun** (application 100 % cliente) | API REST/gRPC, base de données chiffrée, observabilité |
| Persistance | `localStorage` du navigateur uniquement | PostgreSQL chiffré, sauvegardes, réplication |
| Multi-utilisateurs | **Impossible** (chaque navigateur est isolé) | Synchronisation centralisée, permissions serveur |
| Hébergement | Replit dev preview, statique | Hébergeur certifié HDS (France) ou équivalent |
| Sauvegarde | **Aucune** (vidage du cache = perte totale) | Politique de rétention, RTO/RPO documentés |

## 2. Sécurité

| Limite | Réalité actuelle | Cible |
|--------|------------------|-------|
| Hachage mots de passe | PBKDF2-SHA256 100 000 itérations (correct) | Idem, à confirmer côté backend |
| Stockage des hashes | localStorage en clair (lisible via DevTools) | Base sécurisée, jamais exposée au client |
| Chiffrement au repos | **AUCUN** | AES-256-GCM minimum |
| Chiffrement en transit | Sans objet (pas de réseau applicatif) | TLS 1.3 partout, mTLS pour services internes |
| 2FA / MFA | **Aucun** | TOTP / WebAuthn obligatoire pour cliniciens |
| Anti-bruteforce | **Aucun** | Rate limiting, captcha, verrouillage |
| Audit trail | localStorage non immuable, **éditable manuellement** | Append-only signé, archivage long terme |
| Content Security Policy | **Aucune** | CSP stricte, SRI, headers HSTS |
| Gestion des secrets | Sans objet (aucun secret réel) | Vault, rotation, scope minimal |

## 3. Données

| Limite | Réalité |
|--------|---------|
| Patients | **10 patients fictifs hardcodés** dans `engine/simulator.ts` |
| Mesures CGM | Générées algorithmiquement, jamais réelles |
| Capteurs IoMT | **Aucun appairage réel** (Dexcom, Omnipod, etc. sont mimés) |
| Rapports labo | Scan QR fonctionnel, mais contenu démo |
| Données importables | **Aucune** ingestion réelle prévue |
| Anonymisation | Sans objet (pas de vraies données) |
| Consentement RGPD | **Non implémenté** |
| Droits RGPD (accès, rectification, effacement, portabilité) | **Aucun mécanisme** |

## 4. IA & XAI

| Limite | Réalité |
|--------|---------|
| Modèle ML | **Aucun modèle entraîné**. Système de règles déterministes. |
| Bibliothèques ML | Aucune (pas de TensorFlow.js, ONNX Runtime, etc.) |
| SHAP | **Non implémenté**. Les "explications" sont des chaînes pré-rédigées. |
| LIME | **Non implémenté** |
| EBM, XGBoost, Random Forest | **Non implémentés** |
| Validation croisée, métriques | Sans objet (pas de modèle) |
| Versioning de modèle (MLflow, etc.) | Sans objet |
| Évaluation utilisateur de l'impact XAI (objectif O4) | **0 % réalisé** |

## 5. Conformité réglementaire

Le prototype **ne possède aucune** des certifications suivantes — pourtant historiquement référencées dans son interface, désormais retirées ou requalifiées :

| Référentiel | Statut prototype | Pour atteindre la cible |
|-------------|------------------|--------------------------|
| MDR (UE 2017/745) — marquage CE | **Non engagé** | Classification, organisme notifié, dossier technique |
| IEC 62304 — cycle de vie logiciel SaMD | **Non engagé** | Plan, architecture, V&V, gestion config & problèmes |
| ISO 13485 — management qualité DM | **Non engagé** | SMQ documenté, audits internes, surveillance |
| ISO 14971 — gestion des risques | **Non réalisée** | AMDEC, matrice risque/probabilité/sévérité |
| RGPD (opérationnel) | **Non implémenté** | Consentement, registre, DPO, DPIA, droits |
| HDS (Hébergeur de Données de Santé) | **Sans objet** (pas d'hébergement) | Contrat HDS avec hébergeur certifié |
| HL7 FHIR | **Non implémenté** | Profils FHIR, IPS, IHE, intégrations DPI |
| AI Act (UE) — système haut risque | **Non couvert** | Toutes les obligations Annexe III |

## 6. Qualité logicielle

| Limite | État actuel | Cible |
|--------|-------------|-------|
| Tests unitaires | **0** (aucun framework installé) | ≥ 70 % couverture, classe C IEC 62304 |
| Tests d'intégration | **0** | Couverture des flows critiques |
| Tests end-to-end | **0** | Playwright / Cypress sur parcours clinicien |
| Linter | **Aucun** | ESLint + Prettier en CI |
| Pipeline CI/CD | **Aucun** | GitHub Actions : lint + typecheck + test + build |
| Métriques de qualité | **Aucune** | SonarCloud / CodeClimate |
| Observabilité | **Aucune** | Sentry, télémétrie, logs structurés |

## 7. Accessibilité

| Limite | État actuel | Cible |
|--------|-------------|-------|
| Audit WCAG | **Aucun audit formalisé** | WCAG 2.2 AA minimum |
| Lecteurs d'écran | **Non testé** | NVDA, JAWS, VoiceOver |
| Contraste | **Non audité** systématiquement | Outils axe-core en CI |
| Navigation clavier | Améliorations partielles récentes (Esc, focus, aria) | Focus trap modaux, skip links |
| `prefers-reduced-motion` | **Non géré** | Désactivation Framer Motion conditionnelle |
| Internationalisation | **Français en dur** | i18n complet (au moins FR + EN) |

## 8. Cohérence & honnêteté de l'interface

À la suite de l'audit pluridisciplinaire du 1er mai 2026, **toutes les revendications de conformité antérieurement affichées dans l'UI ont été retirées ou explicitement requalifiées en "cible non atteinte"** :

- ❌ Anciennes mentions retirées : "AES-256", "Hébergement HDS France", "Conforme RGPD & IEC 62304", "Chiffré de bout en bout · Conforme HDS", "ISO 13485 · IEC 62304", "Conformité 100%".
- ✅ Mentions actuelles : "Prototype académique", "Démo non destinée à un usage clinique", "Données simulées · Stockage local", "PBKDF2-SHA256 (mots de passe)", "Démo locale".
- ✅ Bandeau permanent "PROTOTYPE ACADÉMIQUE" affiché en haut de chaque écran (peut être masqué localement par l'utilisateur).
- ✅ Section "Référentiels visés (cible)" dans le journal d'audit — explicitement étiquetée "Non implémenté".

## 9. Roadmap pour passer du prototype au dispositif

L'effort minimal estimé pour transformer ce prototype en SaMD défendable face à un organisme notifié dépasse largement le cadre d'un mémoire de master. À titre indicatif :

- **Phase 1 — Fondations techniques (3-6 mois)** : backend, base chiffrée, CI/CD, tests, observabilité.
- **Phase 2 — Modèle ML réel (3-6 mois)** : dataset documenté, entraînement, évaluation, XAI effective, versioning.
- **Phase 3 — Conformité (6-12 mois)** : ISO 14971, IEC 62304, ISO 13485, dossier MDR, RGPD opérationnel, validation clinique.
- **Phase 4 — Marquage CE et mise en marché (3-6 mois)** : organisme notifié, surveillance post-marché, vigilance.

**Total réaliste : 15 à 30 mois-équipe**, hors validation clinique multicentrique.

---

## 10. Engagements du prototype

Ce que le prototype **fait honnêtement** :

✅ Démontrer une vision produit cohérente d'aide à la décision en diabétologie.
✅ Proposer une architecture clinicien Triage → Focus alignée sur le geste clinique réel.
✅ Implémenter une authentification PBKDF2 correcte (algorithme, itérations, salt).
✅ Maintenir un journal d'activité local avec trace ID et synchronisation multi-onglets.
✅ Servir de base pédagogique pour discuter des écarts entre prototype et produit certifié.

Ce que le prototype **n'assume plus de prétendre faire** (correctifs du 1er mai 2026) :

❌ Être conforme HDS / RGPD / IEC 62304 / ISO 13485.
❌ Chiffrer les données au repos ou en transit.
❌ Garantir l'intégrité du journal d'audit.
❌ Implémenter SHAP, LIME, ou tout autre algorithme XAI réel.
❌ Manipuler de vraies données patient.

---

*Document maintenu en synchronisation avec les rapports d'audit. Dernière mise à jour : 1er mai 2026.*
