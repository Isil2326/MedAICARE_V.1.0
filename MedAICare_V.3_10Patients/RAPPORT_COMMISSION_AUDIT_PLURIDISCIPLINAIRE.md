# RAPPORT DE LA COMMISSION D'AUDIT PLURIDISCIPLINAIRE

**Objet de l'audit** : Application **MediAI Care v6.0** — Système d'aide à la décision thérapeutique pour le diabète (SaMD prototype académique)
**Périmètre** : Code source `MedAICare_V.3_10Patients/`, ~10 836 lignes TypeScript/React, 32 fichiers source, 23 fichiers de documentation
**Cadre d'évaluation** : Audit indépendant et critique
**Date** : 1ᵉʳ mai 2026
**Statut du document** : Version finale · Constats sans complaisance

---

## Résumé exécutif

L'application MediAI Care présente un **socle technique propre** (TypeScript strict, React 19, hachage PBKDF2 correctement implémenté, refonte UI/UX récente cohérente) **adossé à des défaillances structurelles graves** qui empêchent toute prétention à un déploiement clinique, même expérimental, dans son état actuel.

La commission identifie **trois familles de risques majeurs** :

1. **Décalage critique entre les revendications affichées dans l'interface utilisateur et la réalité technique** (revendications HDS, AES-256, IEC 62304, ISO 13485, chiffrement de bout en bout, conformité RGPD) — risque réputationnel, académique et potentiellement juridique.
2. **Absence totale de garanties de qualité automatisées** : aucun test unitaire, aucun test d'intégration, aucun linter, aucun pipeline CI/CD, aucune mesure de couverture.
3. **Architecture de persistance fondamentalement inadaptée à un dispositif médical** : 100 % des données (utilisateurs, hash de mots de passe, salts, sessions, journal d'audit, messages, prescriptions, décisions cliniques) résident en clair dans le `localStorage` d'un navigateur — manipulable, non chiffré au repos, non sauvegardé, non auditable au sens réglementaire.

**Verdict synthétique** : Prototype académique fonctionnel et soigné dans sa couche présentation, **inacceptable comme dispositif médical en l'état**. Travail considérable requis pour franchir le seuil minimal d'un démonstrateur défendable.

---

## 1. Architecture et Conception

### 1.1. Constats positifs

- **Séparation des couches** correcte : `auth/` (authentification + RBAC), `engine/` (logique métier, simulation, services), `components/` (UI), `types/` (modèles de données), `utils/` (utilitaires). Cette structure démontre une compréhension des bonnes pratiques de modularité.
- **Refactorisation récente du module clinicien** (`components/clinician/`) avec extraction d'un orchestrateur (`ClinicianHub`), de vues spécialisées (`TriageView`, `FocusView`, `CohortView`) et d'un module de helpers (`alertQueue.ts`, `v3DarkTheme.ts`). L'architecture « Triage → Focus » respecte le principe de responsabilité unique.
- **Suppression effective des composants obsolètes** (`AlertCenter.tsx`, `DoctorDashboard.tsx`) après refonte : pas de code mort résiduel détecté pour le module clinicien.
- **Gestion de l'état localisée** au niveau approprié, avec persistance ciblée (`localStorage` keys distinctes : `medai_clinician_mode_v1`, `mediai_session_v2`, `mediai_users_v2`, etc.).

### 1.2. Constats critiques

- **Absence d'architecture client/serveur** : l'application est intégralement statique. Il n'existe **aucun backend**, aucune API, aucune base de données distante. Tout repose sur le `localStorage` du navigateur. Ce choix est **structurellement incompatible** avec :
  - la traçabilité réglementaire d'un dispositif médical,
  - la collaboration multi-utilisateurs (un médecin et son patient ne partagent rigoureusement aucune donnée),
  - la persistance fiable (vidage du cache, navigation privée, panne navigateur = perte totale),
  - toute notion de sécurité au repos.
- **Aucune couche d'abstraction pour la persistance** : `localStorage.setItem`/`getItem` est appelé directement dans 7 modules différents (`App.tsx`, `decisionLog.ts`, `authService.ts`, `prescriptionService.ts`, `labReportService.ts`, `ClinicianHub.tsx`, `Messaging.tsx`). En cas de migration vers un backend, c'est une réécriture transverse, pas un simple swap.
- **Couplage excessif entre UI et logique métier** : les vues clinicien encapsulent un état important (file d'alertes, persistance audit, sync multi-onglets) directement dans des composants React. Une couche de service (`stores`, `hooks` métier dédiés, `Context` typés) ferait défaut. L'utilisation manuelle d'événements `storage` + `CustomEvent` pour synchroniser plusieurs vues compense l'absence d'un store global (Zustand, Redux, Jotai).
- **Aucune injection de dépendance** ni interfaces séparant la logique des sources de données : impossible de mocker la couche `engine/` sans recâbler les imports.
- **Modèle de domaine partiellement spaghetti** : `types/medical.ts` (476 lignes) cumule 30+ types et interfaces. Une décomposition par bounded context (Patient, Décision, Prescription, IoMT, Audit) est manquante.

### 1.3. Patterns et choix techniques

- React 19 et Vite 7 : choix modernes et pertinents.
- Tailwind 4 utilisé dans le shell patient.
- **Coexistence non assumée de deux paradigmes UI** : Tailwind CSS dans la coque patient, **styles inline JavaScript massifs** (95 occurrences de `style={{` dans `FocusView.tsx` seul) dans le hub clinicien. Cette dualité n'est ni documentée ni justifiée. Elle complique la maintenance, désactive le purge CSS pour la moitié de l'app et empêche tout thème global cohérent.
- **Aucun design system partagé** : `v3DarkTheme.ts` (palette + helpers) est un fichier de constantes de 60 lignes — pas un design system. `components/ui/primitives.tsx` (425 lignes) existe mais n'est pas utilisé par le module clinicien.

**Note Architecture : 8/20**

---

## 2. Organisation et Structuration du Projet

### 2.1. Structure des fichiers

- Arborescence raisonnable au niveau de `src/` (auth, components, engine, types, utils).
- **Fichiers monolithiques** : 5 fichiers dépassent 700 lignes, dont `PatientDashboard.tsx` (928 lignes) qui devrait être éclaté en sous-composants. À ce volume, la maintenabilité chute sévèrement.
- **Dossier `components/` plat** (15 fichiers + 1 sous-dossier `clinician/` + 1 sous-dossier `ui/`) : une organisation par domaine fonctionnel (`patient/`, `messaging/`, `audit/`, `devices/`, `lab-reports/`) clarifierait considérablement le projet.

### 2.2. Documentation

**État actuel** : 23 fichiers Markdown à la racine du projet, dont :
- 8 versions différentes d'`AUDIT_REPORT_v3.X.Y.md`,
- 4 fichiers `RECTIFICATION_REPORT*.md`,
- `AUDIT_RAPPORT.md` (français) ET `AUDIT_REPORT.md` (anglais),
- `PROJECT_CHARTER_v1.0.0.md`, `MEMOIRE_CHAPITRE_IMPLEMENTATION.md`, `CHANGELOG.md`, etc.

**Constats** :
- **Inflation documentaire** : la quantité ne fait pas la qualité. La présence de 17 rapports d'audit/rectification successifs versionnés à la racine traduit un manque de discipline de gestion documentaire. Ce qui devrait être un historique git devient un brouillard de fichiers.
- **`replit.md`** est correctement maintenu et fait office de mémoire technique vivante — bon point.
- **`README_PROJECT.md`** annonce une feuille de route avec un objectif **O4 (Évaluation de l'impact de l'explicabilité) à 0 %**, ce qui constitue un trou béant pour un mémoire dont le sujet central est précisément la XAI.
- **Pas de `CONTRIBUTING.md`, pas de `LICENSE`, pas de `CODE_OF_CONDUCT.md`** : invisibles pour un projet académique mono-développeur, mais indispensables pour toute reprise.
- **Pas de schémas d'architecture C4, pas de diagrammes de séquence, pas de modèle de données** : la documentation technique est exclusivement narrative.

### 2.3. Versionnement

- `package.json` : version `0.0.0`.
- `replit.md` : version `v3.3.2`.
- Footer interface utilisateur : version `v6.0.0`.
- `CHANGELOG.md` : entrées datées de 2025 alors que nous sommes en 2026.

**Incohérence triple** : aucune source de vérité pour la version. Pour un dispositif médical, c'est rédhibitoire (la traçabilité version ↔ release ↔ comportement est une exigence IEC 62304).

**Note Organisation : 9/20**

---

## 3. Utilité Fonctionnelle et Pertinence

### 3.1. Pertinence du problème adressé

Le diabète et son aide à la décision thérapeutique sont des sujets **cliniquement pertinents et socialement utiles**. L'angle XAI (explicabilité) est aligné avec les exigences réglementaires émergentes (AI Act européen, MDR pour les SaMD intégrant de l'IA). Le sujet est défendable.

### 3.2. Fonctionnalités effectivement implémentées

| Fonctionnalité | État | Commentaire |
|----------------|------|-------------|
| Authentification + RBAC (patient/clinicien) | ✅ Fonctionnel | PBKDF2 correctement implémenté |
| Tableau de bord patient | ✅ Fonctionnel | Riche mais monolithique |
| Hub clinicien V3-Dark (Triage → Focus) | ✅ Fonctionnel | Récent, bien structuré |
| Messagerie patient ↔ clinicien | ✅ Fonctionnel | Persistance localStorage uniquement |
| Journal d'audit | ⚠️ Partiel | Append-only local, manipulable |
| Scan QR de rapports labo | ⚠️ Démo | Données simulées |
| Recommandations IA + XAI | ⚠️ Démo | Pas de vrai modèle ML, règles + textes pré-écrits |
| Intégration IoMT (CGM, pompe, montre) | ❌ Simulé | Aucun appairage réel |
| Prescriptions avec audit trail | ⚠️ Partiel | Local, sans signature électronique |

### 3.3. Limites fonctionnelles

- **Tout est simulé** : 10 patients fictifs hardcodés (`engine/simulator.ts`, 501 lignes), aucune ingestion réelle. La revendication « IoMT » est purement narrative.
- **Le "moteur IA"** n'est pas un modèle d'apprentissage : c'est un système de règles déterministes générant des recommandations textuelles préformatées. Il n'y a ni EBM, ni XGBoost, ni SHAP, ni LIME effectivement instanciés — contrairement à ce que suggèrent le README et les documents de mémoire.
- **L'objectif académique O4 (évaluation de l'impact de l'explicabilité) est explicitement à 0 %** dans le `README_PROJECT.md`. Or c'est précisément l'apport scientifique attendu d'un mémoire en informatique biomédicale axé XAI.
- **Mode démonstration uniquement** : pas de mode production, pas de configuration multi-environnements, pas de seed différencié dev/prod.

### 3.4. Adéquation au workflow clinicien

La refonte récente « Triage → Focus » est **un vrai progrès** : elle reflète le geste clinique réel (« qu'est-ce qui demande mon attention maintenant ? » → « qu'est-ce que je décide pour ce patient ? »). C'est l'un des points forts authentiques du projet.

**Note Utilité : 10/20**

---

## 4. Fonctionnalité, Performance, UX/UI

### 4.1. Performance

- Bundle non mesuré dans le cadre de cet audit. Vite + React 19 garantissent des bases saines, mais la présence de Recharts, Framer Motion, html5-qrcode, lucide-react entier (1.8.0 — version très ancienne, voir §5) sans tree-shaking vérifié laisse présager un bundle initial significatif.
- **Polling 3 s pour les messages non lus** : remplacé par un événement custom dans le shell patient, mais le mécanisme reste basé sur `localStorage` + intervalle ; un WebSocket ou Server-Sent Events serait plus économe et plus juste.
- Aucune mesure Lighthouse, Web Vitals ou audit de performance documentée.

### 4.2. UX/UI

**Forces** :
- Refonte clinicien V3-Dark cohérente, lisible, immersive.
- Hiérarchie d'information claire dans `TriageView` (KPIs → filtres → cartes triées).
- Compteur d'alertes actif synchronisé avec le journal d'audit (correction récente).
- Empty states explicites pour le cas « patient sans alerte active ».

**Faiblesses** :
- **Incohérence visuelle assumée** : le hub clinicien est sombre pour Triage/Focus/Cohorte, mais clair pour Messages et Audit. La transition est brutale et n'est ni motivée ni masquée par une transition.
- **Mobile** : la barre supérieure du hub clinicien est dense ; le responsive n'a pas été testé sur petits écrans dans le cadre de cet audit, et le dossier `clinician/` n'utilise pas de classes responsive Tailwind (tout en inline style).
- **Pas de mode sombre côté patient** : alors que le clinicien a un mode sombre dédié.
- **Pas d'internationalisation** : tout en français codé en dur. Pour un projet académique, acceptable. Pour un produit, bloquant.
- **Pas de gestion fine du focus clavier** dans la plupart des composants — ajouts récents partiels (dropdown clinicien, strip patient).

### 4.3. Bugs et défauts résiduels

- **Erreurs TypeScript préexistantes non corrigées** : `LandingPage.tsx` (problèmes de typage Framer Motion sur `ease`), `AuditLog.tsx` (import `Clock` non utilisé), `AuthModal.tsx` (import `Shield` non utilisé). Le `tsc --noEmit` n'est pas vert sur le projet entier.
- **Avertissement Recharts** persistant dans la console (`width(-1) and height(-1)`) — non bloquant mais signe d'un container sans dimensions explicites.
- Pas de gestion explicite des erreurs réseau (puisqu'il n'y a pas de réseau).

**Note Fonctionnalité : 11/20**

---

## 5. Modernité Technique et Dette

### 5.1. Stack technique

| Composant | Version | Évaluation |
|-----------|---------|------------|
| React | 19.2.3 | Récent, excellent |
| Vite | 7.2.4 | Récent, excellent |
| TypeScript | 5.9.3 | Récent, excellent |
| Tailwind CSS | 4.1.17 | Récent, excellent |
| Recharts | 3.8.1 | À jour |
| Framer Motion | 12.38.0 | Récent |
| **lucide-react** | **1.8.0** | **CRITIQUE — version ancienne** |
| date-fns | 4.1.0 | À jour |
| uuid | 13.0.0 | À jour |
| html5-qrcode | 2.3.8 | Maintenu |

**Constat majeur** : `lucide-react` est figé en `1.8.0`. La version courante est dans la branche `0.x` (versionnement particulier de cette librairie : la `0.5xx.x` est l'actuelle). La version `1.8.0` correspond à un fork ancien ou à une mauvaise spécification. **À investiguer en priorité** — risque de bugs d'icônes ou de rupture future.

### 5.2. Dette technique identifiée

- **Aucun linter** (pas d'ESLint, pas de Prettier, pas de Biome). Le formatage est inégal entre fichiers.
- **Aucun pipeline CI/CD** : pas de GitHub Actions, pas de pre-commit hook, pas de script `lint`/`test`/`typecheck`.
- **Aucune métrique de qualité** : pas de SonarCloud, pas de CodeClimate, pas de coverage.
- **Pas de séparation `dev`/`build`/`production`** : le seul script de build est `vite build` brut, sans variable d'environnement, sans configuration de logging conditionnel.
- **Pas de gestion des features flags** : tout est binaire, en code dur.
- **Mélange de paradigmes** : Tailwind classes côté patient, inline styles côté clinicien (cf. §1.3).

### 5.3. Conformité aux standards 2026

- **Pas de Server Components** : architecture client-only pure ; alors que React 19 + un framework comme Next.js / Remix permettrait une approche RSC moderne et plus défendable.
- **Pas de PWA** : pas de service worker, pas de manifest, pas de mode offline. Pour une application présentée comme « médicale » destinée à des patients et cliniciens en mobilité, c'est une lacune.
- **Pas d'observabilité** : aucun logging structuré, aucun envoi de télémétrie, aucun tracking d'erreurs côté client (pas de Sentry, Datadog RUM, etc.).

**Note Modernité : 11/20**

---

## 6. Sécurité

### 6.1. Authentification

**Points positifs** :
- **PBKDF2 SHA-256, 100 000 itérations** : algorithme et nombre d'itérations corrects, conformes aux recommandations NIST SP 800-132 (minimum 10 000, recommandé 100 000+).
- **Salt aléatoire 128 bits** par utilisateur, généré via `crypto.getRandomValues` : correct.
- **Token de session 256 bits** aléatoires.
- **Expiration de session 8 h** : raisonnable.
- **Validation de mot de passe** : longueur ≥ 8, exigence min/maj/chiffre.

**Points critiques** :
- **Hash, salt, token et données utilisateur stockés en clair dans `localStorage`**. Le hash PBKDF2 est résistant à l'inversion, mais l'attaquant qui accède au navigateur (XSS, malware, accès physique) **peut tout lire et tout modifier**. Il peut notamment :
  - lister tous les utilisateurs et leurs hashes (et tenter une attaque hors-ligne ciblée),
  - injecter un compte clinicien arbitraire,
  - élever les privilèges en modifiant `role` dans le payload localStorage,
  - usurper une session en réécrivant le `SESSION_KEY`.
- **Aucun mécanisme anti-bruteforce** : pas de rate limiting (impossible côté client pur), pas de captcha, pas de verrouillage de compte.
- **Pas de 2FA**, pas de WebAuthn, pas de magic link.
- **Pas de rotation de session, pas de révocation, pas de session multi-appareils.**
- **Le commentaire d'en-tête de `authService.ts`** revendique une conformité « IEC 62304 Classe C / ISO 27001 ». **Cette mention est trompeuse** : il s'agit de référentiels de processus organisationnels (cycle de vie logiciel pour IEC 62304, système de management de la sécurité de l'information pour ISO 27001) — un fichier de code ne peut pas être « conforme » à ces normes seul.

### 6.2. Données et persistance

- **100 % des données sensibles en `localStorage` en clair** : utilisateurs, sessions, prescriptions, journal d'audit, messages, décisions cliniques, données patient simulées.
- **Aucun chiffrement au repos** (malgré la mention « AES-256 » affichée en bas de la sidebar et dans le bandeau d'accueil).
- **Aucune protection contre la manipulation** : un utilisateur avec accès au navigateur peut éditer le journal d'audit (qui est censé être *append-only et non-répudiable*), supprimer une prescription, modifier des messages reçus.

### 6.3. XSS, CSRF et autres surfaces

- **Pas de `dangerouslySetInnerHTML`**, pas d'`eval`, pas d'`innerHTML` dans le code (vérification ripgrep). Bon point.
- **Pas de CSP** (Content Security Policy) configurée dans `index.html`.
- **Pas de Subresource Integrity** sur les ressources externes (s'il y en a).
- **Pas de protection CSRF** — non applicable car pas de backend, mais à intégrer dès qu'un backend existera.

### 6.4. Revendications de sécurité affichées vs réalité

| Revendication dans l'UI | Réalité technique |
|-------------------------|-------------------|
| « Session sécurisée · AES-256 » (sidebar patient) | Aucune utilisation d'AES dans le code |
| « Chiffrement AES-256 · Hébergement HDS France » (landing page) | Aucun chiffrement, hébergement Replit dev preview |
| « Conforme RGPD & IEC 62304 » | Aucun mécanisme RGPD, aucune procédure 62304 |
| « Chiffré de bout en bout · Conforme HDS · RGPD » (messagerie) | Messages stockés en clair localement |
| « IEC 62304 Classe C / ISO 27001 » (commentaire authService) | Annotation rhétorique sans procédure documentée |
| « HDS, RGPD, HL7 FHIR, IEC 62304, ISO 13485 » (badges landing) | Aucune de ces certifications obtenue ni en cours |
| « Données chiffrées AES-256 en transit, MQTT/TLS 1.3 » (DevicesView) | Aucune communication réelle, aucun MQTT |
| « Dispositif Médical Logiciel — Mode Sécurisé » (ErrorBoundary) | Pas de marquage CE, pas de DM enregistré |

**Ces revendications sont, à minima, déontologiquement problématiques.** Elles peuvent être tolérées dans un prototype académique **à condition d'être explicitement et systématiquement signalées comme « démonstration / non opérationnelles »**. En l'état, elles peuvent induire en erreur un évaluateur, un patient pilote, ou une instance de validation.

**Note Sécurité : 6/20** — le socle cryptographique est correct, mais l'écart entre les revendications affichées et la réalité est inacceptable pour un dispositif médical, même à l'état de prototype.

---

## 7. Maintenabilité

### 7.1. Qualité du code

- TypeScript strict activé (`strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`) : excellent socle.
- Le code récent (`clinician/`) est lisible, commenté en français, bien typé.
- Certains fichiers anciens (`PatientDashboard`, `LandingPage`, `Messaging`) sont longs et monolithiques.
- **Erreurs TypeScript résiduelles** non corrigées (cf. §4.3) : signe que personne n'exécute `tsc --noEmit` régulièrement.

### 7.2. Testabilité

- **Aucun test unitaire écrit.**
- **Aucun framework de test installé** (pas de Vitest, pas de Jest, pas de React Testing Library, pas de Playwright).
- **Aucun script `test`** dans `package.json`.
- Le code n'est pas conçu pour être testable (pas d'injection de dépendance, pas d'interfaces, accès direct à `localStorage` partout).

**Pour un dispositif médical, l'absence totale de tests est rédhibitoire.** IEC 62304 exige une couverture de tests proportionnelle à la classe de risque — une classe C (qui peut causer la mort ou un préjudice grave) exige une couverture exhaustive et documentée.

### 7.3. Évolutivité

- Le projet est un prototype mono-utilisateur de démonstration. Toute évolution vers du multi-utilisateur réel nécessite **une refonte intégrale** de la couche de persistance.
- L'absence de séparation logique/UI rendra difficile l'extraction d'une couche métier réutilisable (par exemple en backend).

**Note Maintenabilité : 9/20**

---

## 8. Accessibilité, Conformité et Éthique

### 8.1. WCAG 2.1 / WCAG 2.2

- **Aucun audit d'accessibilité formalisé.**
- Améliorations récentes : `aria-label`, `aria-current`, `aria-haspopup`, `aria-expanded`, gestion de la touche `Esc` pour le dropdown profil clinicien, restauration du focus.
- **Pas d'audit des contrastes** : la palette V3-Dark utilise des couleurs vives sur fond sombre, à valider sur l'ensemble des combinaisons texte/fond.
- **Pas de gestion globale du focus trap** dans les modaux (`AuthModal`).
- **Pas de skip links**, pas de landmarks ARIA systématiques.
- **Pas de support testé pour lecteurs d'écran** (NVDA, JAWS, VoiceOver).
- **Pas d'option de réduction de mouvement** (`prefers-reduced-motion`) — alors que Framer Motion est utilisé.

### 8.2. RGPD

- **Aucune mention légale / politique de confidentialité.**
- **Aucun bandeau de consentement.**
- **Aucun mécanisme d'exercice des droits** (accès, rectification, effacement, portabilité, opposition).
- **Pas de DPO désigné** dans la documentation.
- **Pas de DPIA / AIPD** réalisée pour ce traitement de données de santé.
- **Pas de registre de traitement.**
- **Affirmer « Conforme RGPD » dans l'UI sans aucun de ces éléments est un manquement déontologique grave.**

### 8.3. Réglementation Dispositif Médical

- L'application revendique le statut de SaMD (Software as a Medical Device).
- **Aucune analyse de risques ISO 14971** documentée.
- **Aucun marquage CE** ; le règlement européen MDR (UE 2017/745) classerait probablement cet outil en classe IIa minimum (recommandation thérapeutique pouvant influencer une prise en charge), avec organisme notifié obligatoire.
- **Aucun cycle de vie IEC 62304 documenté** au sens normatif (planification, architecture, vérification, validation, gestion des configurations, gestion des problèmes).
- **Aucune validation clinique.**

### 8.4. IA Act

- L'IA Act européen (entrée en vigueur progressive 2024-2027) classe les SaMD intégrant de l'IA en système à **haut risque**, avec obligations de :
  - documentation technique exhaustive,
  - gestion des risques continue,
  - transparence et information utilisateur,
  - supervision humaine,
  - robustesse et cybersécurité,
  - traçabilité.
- L'application ne couvre **aucune** de ces exigences au niveau requis.

### 8.5. Éthique académique

L'écart entre les affichages (« Conforme HDS », « AES-256 », « IEC 62304 », « ISO 13485 ») et la réalité technique pose un problème **d'honnêteté intellectuelle** dans un cadre de mémoire universitaire. Il est impératif d'amender l'interface pour ajouter des marqueurs « DÉMO », « PROTOTYPE NON CERTIFIÉ », ou de retirer ces revendications.

**Note Conformité/Accessibilité : 5/20**

---

## 9. Synthèse des notes et axes d'amélioration prioritaires

| Domaine | Note |
|---------|------|
| Architecture et Conception | 8/20 |
| Organisation et Documentation | 9/20 |
| Utilité Fonctionnelle | 10/20 |
| Fonctionnalité et UX | 11/20 |
| Modernité Technique | 11/20 |
| Sécurité | 6/20 |
| Maintenabilité | 9/20 |
| Conformité et Accessibilité | 5/20 |
| **Moyenne pondérée** | **8,6/20** |

### Top 10 des actions prioritaires

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 1 | Retirer ou requalifier explicitement toutes les revendications de conformité affichées (AES-256, HDS, RGPD, IEC 62304, ISO 13485, chiffré E2E) | Faible | Critique |
| 2 | Ajouter un bandeau permanent « PROTOTYPE ACADÉMIQUE — NON DESTINÉ À UN USAGE CLINIQUE » | Faible | Critique |
| 3 | Mettre en place ESLint + Prettier + script `typecheck` + GitHub Actions | Moyen | Élevé |
| 4 | Installer Vitest + React Testing Library, écrire des tests pour `authService`, `decisionLog`, `alertQueue` | Élevé | Élevé |
| 5 | Corriger les erreurs TypeScript résiduelles (`LandingPage`, `AuditLog`, `AuthModal`) | Faible | Moyen |
| 6 | Aligner les 3 versions divergentes (`package.json`, `replit.md`, footer UI) sur une source de vérité | Faible | Moyen |
| 7 | Migrer `lucide-react` vers la version courante (vérifier la branche utilisée) | Faible | Moyen |
| 8 | Éclater `PatientDashboard.tsx` (928 lignes) en sous-composants | Moyen | Moyen |
| 9 | Réaliser l'objectif académique O4 (évaluation de l'impact XAI) — sinon, le projet manque sa contribution scientifique | Élevé | Critique (académique) |
| 10 | Documenter explicitement les limites du prototype dans un fichier `LIMITATIONS.md` à la racine | Faible | Élevé |

---

## 10. Conclusion de la Commission

MediAI Care est, dans son état actuel, **un prototype académique soigné dont la couche de présentation a fait l'objet d'un travail substantiel et récent**. Le module clinicien refondu (V3-Dark, architecture Triage → Focus) démontre une compréhension juste du geste clinique et des principes d'ergonomie d'aide à la décision.

Cependant, la commission **ne peut valider** :
- ni les revendications de conformité affichées dans l'interface,
- ni la qualification de l'application comme « dispositif médical », même à titre démonstratif, sans amendements substantiels,
- ni la maturité technique pour un déploiement, même limité à des utilisateurs pilotes.

Le projet présente un **socle d'apprentissage solide** (TypeScript strict, cryptographie correctement utilisée, refactorisation récente assumée) **mais souffre de défauts structurels** (absence totale de tests, persistance navigateur exclusive, écart entre marketing et réalité) qui, dans tout autre contexte qu'un mémoire de master, seraient disqualifiants.

**Recommandation finale** : avant toute soutenance ou présentation à un jury, exécuter à minima les actions 1, 2, 5, 6 et 10 du tableau ci-dessus. L'effort est faible, l'effet sur la crédibilité du projet est majeur.

---

*Rapport établi le 1ᵉʳ mai 2026 — Commission d'Audit Pluridisciplinaire — Version 1.0*
