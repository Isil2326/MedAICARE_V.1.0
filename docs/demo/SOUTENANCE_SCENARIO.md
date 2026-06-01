# Scénario de soutenance — MediAI Care

> **Phase 7 — préparation soutenance.** Mémoire de Master en Informatique Biomédicale.
> Prototype académique **non certifié**, données **100 % synthétiques**, **open-loop
> strict**, **XAI support-only**. Durée indicative : 20–25 min + démo.

## 1. Objectif du projet
Démontrer un **système d'aide à la décision** pour le suivi de patients diabétiques
intégrant données IoMT (CGM, insuline, repas, activité) + **IA explicable (XAI)**, avec
une chaîne complète backend → ML → XAI → recommandations → application mobile, **en
restant open-loop** (jamais de dose ni de décision automatique). La contribution est
**méthodologique et architecturale**, pas une preuve d'efficacité clinique.

## 2. Limites (à énoncer d'emblée — posture honnête)
- Non certifié (MDR, IEC 62304, ISO 13485, HDS, RGPD opérationnel).
- Données **simulées** uniquement — aucune donnée patient réelle.
- Scores ML élevés = **benchmark synthétique séparable** (cohérence du pipeline), **non
  transférable au clinique**.
- XAI ≠ causalité ; XAI ≠ justification clinique (support d'affichage/audit).
- Recommandations **non prescriptives**, soumises à validation clinicien.

## 3. Architecture (vue d'ensemble)
Trois couches : **app web React** (dashboard historique), **backend FastAPI +
PostgreSQL** (sécurité, pipeline, ML, XAI, recommandations), **app mobile Expo/React
Native** (patient/clinicien). Détail : `docs/architecture/FINAL_ARCHITECTURE.md`.

## 4. Backend
FastAPI · SQLAlchemy 2 · Alembic · PostgreSQL réel · migrations additives rejouables.
RBAC serveur, JWT access court + refresh opaque (rotation + détection de réutilisation),
argon2, audit append-only chaîné SHA-256, rate-limiting, en-têtes de sécurité, CORS par
env, sonde `/ready`.

## 5. ML
Cibles `hypo`(<70)/`hyper`(>180), horizons 30/60 min. 4 couples actifs (un modèle par
couple : EBM/RF/XGBoost). Split **temporel anti-leakage** (60/20/20 aligné sur les
frontières de timestamps), registre garantissant **un seul modèle actif** par
(cible, horizon). **Aucune métrique inventée** (calcul réel ou « non calculable »).

## 6. XAI
SHAP / LIME / EBM natif (+ repli occlusion documenté). Statut de fiabilité sémantique
(`reliable` / `caution` / `not_reliable`), warnings jamais masqués, termes interdits
testés, dissociation calibration (l'attribution explique le modèle non calibré, la
probabilité affichée est calibrée).

## 7. Recommandations open-loop
Prédictions + XAI → **suggestions non prescriptives** créées en `pending`, soumises à
validation clinicien (`approved`/`rejected`/`modified`). Safety : termes interdits +
regex anti-dose. La XAI n'est **jamais** une justification clinique
(`clinical_justification_allowed=false`). Probabilités verrouillées côté serveur
(anti-spoof, `extra=forbid`).

## 8. Sécurité (transverse)
Backend : voir §4. Mobile : jetons en SecureStore (mémoire volatile sur web), jamais
loggés, logout/refresh échoué effacent ; RBAC serveur ; messages d'erreur non
techniques. Détail : `docs/security/MOBILE_SECURITY_REVIEW.md`,
`docs/security/RBAC_MATRIX.md`, `docs/security/AUDIT_COVERAGE.md`.

## 9. Démonstration patient (live)
Login patient → profil → données temporelles → estimation de risque (`ml/predict`) →
XAI locale (warnings/fiabilité) → recommandations **approuvées uniquement** → logout.
Script détaillé : `docs/demo/E2E_DEMO_SCRIPT.md` §1.

## 10. Démonstration clinicien (live)
Login clinicien → cohorte → détail patient → estimation + XAI → génération d'une
recommandation (`pending`) → modification/approbation → **vérification côté patient**
que seule l'approuvée est visible → logout. Script : `E2E_DEMO_SCRIPT.md` §2.

## 11. Ce qui est simulé
Tous les signaux IoMT et les profils patients (10 profils scénarisés, 14 jours, CGM 5
min). Le benchmark ML est volontairement séparable. Aucune donnée réelle, aucun device
physique connecté.

## 12. Ce qui n'est pas certifié
Aucune certification réglementaire ; aucune validation clinique ; pas d'usage médical.
Le journal de décision de l'app web est un `localStorage` non-autoritaire (démo).

## 13. Ce qui serait nécessaire pour des données réelles
- Cadre éthique/réglementaire (consentement, RGPD opérationnel, hébergement HDS).
- Validation clinique prospective + métriques sur données réelles.
- Démarche qualité logiciel médical (IEC 62304), gestion des risques (ISO 14971).
- Sécurisation device réelle (EAS, Keychain/Keystore, TLS pinning), audit a11y complet.
- Surveillance, traçabilité et gouvernance des modèles (drift, recalibration).

## Questions anticipées (préparer les réponses)
- *« Pourquoi des scores aussi élevés ? »* → benchmark synthétique séparable, non
  clinique ; preuve de cohérence du pipeline.
- *« La XAI justifie-t-elle la reco ? »* → non, support d'affichage/audit uniquement.
- *« Le système peut-il agir seul ? »* → non, open-loop strict, validation humaine
  obligatoire.
- *« Pourquoi session volatile sur web ? »* → choix sécurité (jamais de token en
  localStorage), validé.
