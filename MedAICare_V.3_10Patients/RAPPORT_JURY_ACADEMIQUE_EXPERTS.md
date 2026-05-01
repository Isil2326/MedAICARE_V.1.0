# RAPPORT D'ÉVALUATION DU JURY ACADÉMIQUE ET D'EXPERTS

**Mémoire évalué** : MediAI Care — Système de recommandation thérapeutique pour patients diabétiques basé sur IoMT et IA explicable
**Niveau** : Master en Informatique Biomédicale
**Artéfact évalué** : Application web v6.0, ~10 800 LOC TypeScript/React
**Date de la session** : 1ᵉʳ mai 2026
**Composition du jury** : Expert en génie logiciel, expert en sécurité des dispositifs médicaux, expert en intelligence artificielle explicable, expert en ergonomie clinique, rapporteur académique
**Régime d'évaluation** : Sévère, exigence de niveau international, attente d'un travail défendable face à un comité MDR / AI Act / NIH

---

## Préambule

Le jury salue d'emblée **l'ambition du sujet** (XAI appliquée à l'aide à la décision diabétologique), **la cohérence de la vision produit** (workflow clinicien Triage → Focus, transparence des recommandations IA), et **le sérieux de l'investissement dans la couche présentation**. Ces éléments traduisent une réelle compréhension des enjeux par le candidat.

Le jury évaluera cependant l'artéfact selon des critères **rigoureux et non négociables**, comparables à ceux qu'appliquerait un comité d'éthique de la recherche, un organisme notifié pour le marquage CE, ou un reviewer de revue *peer-reviewed* en informatique médicale.

---

## I. Notation détaillée par critère

Chaque critère est noté sur 20 points, accompagné d'une justification factuelle.

### Critère 1 — Pertinence scientifique du sujet et originalité (12/20)

**Forces** :
- Le sujet (XAI dans l'aide à la décision en diabétologie) est cliniquement pertinent et académiquement actif. Plusieurs travaux récents (Caruana, 2015 ; Lundberg & Lee, 2017 ; Holzinger, 2019 ; Tonekaboni et al., 2019) constituent une assise théorique solide.
- L'angle « médecin comme utilisateur final de l'IA » est défendable et différencie le travail de la majorité des publications centrées modèle.

**Faiblesses** :
- L'originalité réelle du travail réalisé est limitée : aucun nouveau modèle, aucune nouvelle méthode XAI, aucune nouvelle métrique d'évaluation. L'apport est essentiellement de **conception d'interface**, ce qui est légitime mais doit être assumé comme tel dans le mémoire.
- L'absence d'évaluation utilisateur (objectif O4 explicitement à 0 % dans `README_PROJECT.md`) prive le travail de sa contribution scientifique principale attendue.

### Critère 2 — Rigueur méthodologique (8/20)

**Constats** :
- **Aucun protocole expérimental documenté** dans les fichiers techniques consultés.
- **Aucun jeu de données réel** : 10 patients fictifs hardcodés (`engine/simulator.ts`).
- **Aucune validation croisée**, aucune métrique de performance (AUC, sensibilité, spécificité, valeur prédictive) — pour une bonne raison : **aucun modèle d'apprentissage n'est effectivement entraîné**. Le « moteur IA » est un système de règles déterministes générant des recommandations textuelles.
- **Décalage entre le discours et la réalité** : `README_PROJECT.md` mentionne « SHAP, LIME, EBM, XGBoost » comme objectifs O3 à 70 %. Le code livré ne contient ni implémentation SHAP, ni LIME, ni EBM, ni XGBoost. Aucune librairie ML (TensorFlow.js, ONNX Runtime Web, scikit-learn-equivalent) n'est dans `package.json`.
- Les « explications » affichées dans `FocusView` sont des chaînes de caractères pré-générées dans `engine/simulator.ts` ou `engine/patient-data.ts`, non issues d'un calcul d'attribution de features.

**Cette confusion entre prototype d'interface XAI et implémentation effective de XAI est, du point de vue d'un jury exigeant, l'écueil le plus grave du travail.**

### Critère 3 — Qualité de l'implémentation logicielle (11/20)

**Forces** :
- Stack moderne et cohérente : React 19, TypeScript 5.9 strict, Vite 7, Tailwind 4.
- Cryptographie d'authentification correctement implémentée (PBKDF2 / 100 000 itérations / SHA-256, salt 128 bits, token 256 bits via `crypto.getRandomValues`).
- Refactorisation récente du module clinicien : extraction d'un orchestrateur, séparation des vues, helper d'agrégation (`alertQueue.ts`), gestion fine des événements de synchronisation multi-onglets (`storage` + `CustomEvent`).
- ErrorBoundary présent au niveau racine.
- TypeScript strict avec options sévères (`noUnusedLocals`, `noUnusedParameters`).

**Faiblesses** :
- **Aucun test automatisé** (zéro fichier `.test.*` ou `.spec.*`, aucun framework installé). Pour un projet revendiquant la classe IEC 62304 « C », c'est une non-conformité majeure.
- **Aucun linter** (pas d'ESLint, pas de Biome). Pas de Prettier.
- **Aucun pipeline CI/CD.**
- **Architecture client-only** : tout repose sur `localStorage`. Aucune persistance distante, aucune synchronisation réelle entre utilisateurs.
- **Erreurs TypeScript résiduelles non corrigées** (`LandingPage.tsx`, `AuditLog.tsx`, `AuthModal.tsx`).
- **Coexistence de paradigmes UI** : Tailwind dans le shell patient, **inline styles massifs** (95 occurrences `style={{` dans `FocusView.tsx`) dans le hub clinicien — non documentée.
- **Fichiers monolithiques** : `PatientDashboard.tsx` à 928 lignes, plusieurs autres au-delà de 700 lignes.
- **Versions divergentes** : `package.json` annonce `0.0.0`, `replit.md` annonce `v3.3.2`, l'UI affiche `v6.0.0`. Aucune source de vérité.
- **Dépendance `lucide-react` figée en `1.8.0`** — branche/version anormale, à investiguer.

### Critère 4 — Sécurité et confidentialité (5/20)

**Constats** :
- **Multiples revendications de conformité non étayées** dans l'interface utilisateur : « AES-256 », « HDS », « RGPD », « IEC 62304 », « ISO 13485 », « HL7 FHIR », « Chiffré de bout en bout », « MQTT/TLS 1.3 ». **Aucune** de ces revendications n'a de réalité technique correspondante dans le code.
- **Données sensibles (utilisateurs, hashes, sessions, prescriptions, journal d'audit, messages, décisions cliniques) stockées en clair dans `localStorage`**. Manipulables, non chiffrées, non sauvegardées, non auditables au sens réglementaire.
- **Le journal d'audit revendique l'append-only et la non-répudiation** mais peut être édité ou supprimé manuellement par tout utilisateur ayant accès au navigateur. La mention « note SaMD : journal local non-autoritaire (démo) » dans `replit.md` reconnaît cette limite — elle doit également être affichée à l'utilisateur, pas seulement consignée en interne.
- **Pas de Content Security Policy**, pas de Subresource Integrity, pas de gestion CSRF (non applicable en l'absence de backend, mais à intégrer).
- **Aucun mécanisme anti-bruteforce, pas de 2FA, pas de verrouillage de compte.**
- **Annotation rhétorique « IEC 62304 Classe C / ISO 27001 »** dans l'en-tête de `authService.ts` : ces normes désignent des processus organisationnels et systèmes de management, pas des fichiers sources.

**Le jury considère ce point comme l'axe d'amélioration le plus urgent.** Dans une soutenance face à un jury sensibilisé aux enjeux réglementaires, ces revendications non étayées constitueraient un motif de demande de reformulation immédiate.

### Critère 5 — Conformité réglementaire (Dispositif Médical, RGPD, AI Act) (3/20)

- **Aucune analyse de risques ISO 14971** documentée.
- **Aucun dossier technique IEC 62304** (planification, architecture détaillée, vérification, validation, gestion de configuration, gestion des problèmes — au sens normatif).
- **Aucune validation clinique.**
- **Aucun marquage CE** ; le règlement UE 2017/745 (MDR) classerait probablement cet outil en classe IIa au minimum.
- **Aucun mécanisme RGPD opérationnel** : pas de mention légale, pas de bandeau de consentement, pas d'exercice des droits, pas de DPO désigné, pas de DPIA.
- **Aucune des obligations AI Act** (gestion des risques, transparence, supervision humaine, robustesse, traçabilité, cybersécurité) couverte au niveau requis pour un système à haut risque.

Le jury rappelle qu'un mémoire de master en informatique biomédicale **n'est pas tenu de produire un dispositif certifié**. Mais il **est tenu** :
- de connaître ces référentiels,
- de les citer correctement,
- et **de ne pas revendiquer leur conformité dans l'artéfact livré sans avoir engagé les démarches afférentes**.

### Critère 6 — Ergonomie clinique et UX (14/20)

**Forces** :
- La refonte « Triage → Focus » reflète **fidèlement le geste clinicien réel** : « qu'est-ce qui demande mon attention ? » → « que décide-je pour ce patient ? ». C'est l'un des points forts authentiques du travail.
- Hiérarchie d'information dans `TriageView` lucide : KPIs → filtres → cartes triées par risque puis par expiration imminente.
- Compteur d'alertes effectivement décrémenté après action (correction récente assumée — pré-correction le compteur mentait au clinicien).
- Empty states explicites pour le cas « patient sans alerte active » (correction récente — pré-correction, le système basculait silencieusement sur un autre patient, ce qui aurait été une **rupture de confiance clinique majeure**).
- Améliorations d'accessibilité partielles : `aria-label`, `aria-current`, gestion `Esc` dropdown, restauration du focus.

**Faiblesses** :
- **Incohérence visuelle assumée** entre vues sombres (Triage / Focus / Cohorte) et vues claires (Messages / Audit) au sein du même hub. La transition est brutale et compromet la cohérence perçue.
- **Pas d'audit ergonomique formalisé** : aucune session avec utilisateur cible (médecin, infirmier, patient diabétique), aucun test SUS (System Usability Scale), aucune métrique d'usabilité quantifiée.
- **Pas de validation par un clinicien indépendant** des libellés, du flux décisionnel, des seuils d'alerte affichés.
- Responsive non testé sur petits écrans dans le cadre de cet audit.

### Critère 7 — Documentation (8/20)

- **23 fichiers Markdown à la racine** dont 8 versions différentes d'`AUDIT_REPORT_v3.X.Y.md`, 4 fichiers `RECTIFICATION_REPORT*.md`, doublon `AUDIT_RAPPORT.md` (FR) et `AUDIT_REPORT.md` (EN). Cette inflation **n'est pas une qualité** : elle traduit un défaut de gestion documentaire.
- `replit.md` est correctement maintenu — bon point.
- **Pas de schémas d'architecture (C4, UML), pas de modèle de données formalisé, pas de diagrammes de séquence.**
- **Pas de documentation utilisateur**, pas de manuel clinicien, pas de notice patient.
- Le `README_PROJECT.md` annonce **explicitement** O4 (évaluation impact XAI) à 0 % et O3 (intégration SHAP/LIME) à 70 % — ce dernier chiffre apparaît surévalué au regard de l'absence d'implémentation effective.

### Critère 8 — Reproductibilité (10/20)

- Le projet se lance via `npm run dev` après `npm install` — bon point.
- Pas de Dockerfile, pas de `docker-compose.yml`, pas de devcontainer.
- Pas de jeu de données réutilisable (les patients sont hardcodés).
- Pas de protocole expérimental documenté permettant à un tiers de reproduire les résultats annoncés (puisqu'il n'y a pas de résultats expérimentaux à reproduire).

### Critère 9 — Honnêteté intellectuelle (7/20)

Le jury insiste sur ce critère, qu'il considère comme **structurant** pour un travail académique en biomédical.

- **L'écart entre les revendications affichées dans l'UI et la réalité technique constitue un manquement.** Il peut résulter d'une intention marketing du candidat (rendre la démo « impressionnante ») ; ce n'est pas acceptable dans un travail destiné à un jury universitaire.
- L'absence de mention « PROTOTYPE — NON CERTIFIÉ — USAGE NON CLINIQUE » dans l'application est, à elle seule, un motif de demande de correction immédiate.
- La revendication d'implémentation de SHAP / LIME / EBM / XGBoost dans la documentation alors que le code n'en contient aucune trace est **un point qu'un membre du jury technique relèvera systématiquement**.
- La date des entrées du `CHANGELOG.md` (2025) alors que nous sommes en 2026 et que le footer affiche v6.0.0 (au lieu du `0.0.0` de `package.json`) traduit un défaut de rigueur.

### Critère 10 — Présentation et soutenabilité (13/20)

- L'application est **présentable** : la refonte clinicien V3-Dark a un impact visuel fort et démontre une maîtrise technique des composants React, des animations Framer Motion, des palettes de couleur.
- La démonstration peut convaincre un public non technique.
- Face à un jury technique exigeant, la démonstration **résistera mal** à des questions du type :
  - « Montrez-moi le code SHAP qui produit ces explications. »
  - « Comment garantissez-vous l'intégrité du journal d'audit que vous présentez à l'écran ? »
  - « Sur quelle base affirmez-vous "Conforme RGPD" en bas de votre landing page ? »
  - « Quels sont les résultats de votre évaluation utilisateur de l'objectif O4 ? »
  - « Combien de tests unitaires couvrent votre service d'authentification critique ? »

---

## II. Tableau récapitulatif des notes

| # | Critère | Pondération | Note /20 | Note pondérée |
|---|---------|-------------|----------|---------------|
| 1 | Pertinence scientifique et originalité | 10 % | 12 | 1,20 |
| 2 | Rigueur méthodologique | 15 % | 8 | 1,20 |
| 3 | Qualité de l'implémentation logicielle | 15 % | 11 | 1,65 |
| 4 | Sécurité et confidentialité | 15 % | 5 | 0,75 |
| 5 | Conformité réglementaire | 10 % | 3 | 0,30 |
| 6 | Ergonomie clinique et UX | 10 % | 14 | 1,40 |
| 7 | Documentation | 5 % | 8 | 0,40 |
| 8 | Reproductibilité | 5 % | 10 | 0,50 |
| 9 | Honnêteté intellectuelle | 10 % | 7 | 0,70 |
| 10 | Présentation et soutenabilité | 5 % | 13 | 0,65 |
| | **TOTAL** | **100 %** | | **8,75 / 20** |

**Mention envisagée en l'état** : *Passable* — admis sous réserve de corrections substantielles.

**Mention envisageable après actions prioritaires** (voir section III) : *Bien* — voire *Très bien* si l'objectif O4 est effectivement réalisé.

---

## III. Critiques techniques approfondies

### III.1. Sur la couche IA / XAI

Le jury, dans sa composante « expert IA », formule trois critiques structurantes :

1. **Confondre interface XAI et XAI effective**. L'application présente des cartes d'explication visuellement convaincantes, mais ces explications sont produites par concaténation de chaînes pré-rédigées dans le simulateur, pas par un algorithme d'attribution de features. C'est de la **maquette d'XAI**, pas de l'XAI. Cette distinction doit être assumée explicitement dans le mémoire écrit.
2. **Absence de modèle baseline reproductible**. Sans modèle entraîné sur un jeu de données documenté, il est impossible d'évaluer la fidélité des explications, leur stabilité, leur consistance ou leur utilité clinique réelle.
3. **Absence de protocole d'évaluation utilisateur**. C'est précisément le manque qui prive le travail de sa contribution scientifique principale (objectif O4).

### III.2. Sur la sécurité

Le jury, dans sa composante « expert sécurité DM », rappelle que :

- Hacher correctement un mot de passe (PBKDF2 100k it. SHA-256) est **nécessaire mais insuffisant** dès lors que tout le reste — y compris le hash lui-même — est stocké en clair dans un environnement contrôlé par l'utilisateur final.
- Une revendication « AES-256 » dans l'interface est un mensonge documentaire si AES n'est utilisé nulle part dans le code. Ce point seul justifierait, dans un audit ANSSI ou un examen d'organisme notifié, une non-conformité critique.
- Le journal d'audit, pour mériter ce nom, doit être :
  - immuable (ce qui implique un backend, une base append-only au sens fort, ou un système de horodatage/chaînage cryptographique),
  - signé (chaque entrée doit pouvoir être attribuée à un acteur authentifié de manière non répudiable),
  - exporté et archivé (durée de conservation aligned avec le cadre légal applicable — 20 ans pour un dossier médical en France),
  - accessible à un auditeur tiers de manière contrôlée.
- Aucun de ces critères n'est rempli par l'implémentation actuelle.

### III.3. Sur l'architecture

Le jury, dans sa composante « expert génie logiciel », souligne :

- L'**absence de couche de service clairement séparée** rend le code difficilement testable (et donc, de fait, non testé). Une architecture hexagonale ou en clean architecture aurait isolé la logique métier des préoccupations d'IO (`localStorage`, événements navigateur), permettant une couverture de test substantielle sans monter de DOM React.
- L'**utilisation d'inline styles dans le module clinicien** désactive plusieurs avantages de Tailwind (purge CSS, design tokens centralisés, responsive utilities), introduit une duplication de propriétés de style, et complique tout futur thème global. Cette dette doit être tracée et planifiée.
- La **synchronisation multi-onglets via `storage` + `CustomEvent`** est ingénieuse mais reste un workaround : un store global (Zustand pesant ~3 KB est suffisant) résoudrait le problème de manière plus propre et testable.

### III.4. Sur la conformité

Le jury, dans sa composante « expert réglementaire », souligne l'écart entre le travail livré et le cadre réglementaire que le travail revendique. **Cet écart n'est pas en soi rédhibitoire pour un mémoire académique** — un master n'a pas vocation à produire un dispositif certifié — mais il **doit être assumé explicitement et discuté dans le mémoire écrit** : quelles seraient les démarches nécessaires pour passer du prototype au dispositif certifié ? Quelle classification MDR ? Quel dossier IEC 62304 ? Quels coûts, quels délais ? Cette discussion, manquante ici, est précisément ce qu'attend un jury.

### III.5. Sur l'ergonomie

La composante « ergonomie clinique » du jury reconnaît que :

- La refonte récente Triage → Focus témoigne d'une **vraie compréhension du workflow clinicien** et constitue le point fort le plus authentique du travail.
- Néanmoins, **aucune validation par un clinicien indépendant** n'est documentée. Sans cette validation, l'argumentaire ergonomique reste subjectif.
- Une session pilote, même brève (2 à 3 médecins, protocole think-aloud, échelle SUS), produirait des résultats exploitables et défendables qui changeraient substantiellement la note de ce critère.

---

## IV. Comparaison avec les standards de l'industrie

| Aspect | Pratique standard industrie | MediAI Care | Écart |
|--------|----------------------------|-------------|-------|
| Couverture de tests | ≥ 70 % pour SaMD critique | 0 % | Critique |
| Linter / formateur | ESLint + Prettier obligatoires | Aucun | Élevé |
| CI/CD | Pipelines automatisés sur chaque commit | Aucun | Élevé |
| Architecture | Backend + frontend séparés, BDD chiffrée | Frontend pur, localStorage | Critique |
| Authentification | OAuth 2.0 / OIDC, 2FA, gestion centralisée | PBKDF2 local, sans 2FA | Élevé |
| Cryptographie au repos | AES-GCM minimum | Aucune | Critique |
| Audit trail | Append-only DB, signature cryptographique, archivage | localStorage non immuable | Critique |
| Conformité RGPD | Consentement, droits, DPIA, registre | Aucun mécanisme | Critique |
| Conformité MDR | Dossier technique, marquage CE, surveillance post-marché | Aucun | Hors périmètre |
| Modèle IA | Versionné, tracé, évalué (MLflow / Weights&Biases) | Pas de modèle | Critique |
| Observabilité | Logs structurés, télémétrie, alerting | Aucune | Élevé |
| Documentation | Architecture C4, ADR, spec API, runbooks | Markdown narratif | Moyen |
| Tests d'accessibilité | axe-core en CI, audit lecteur d'écran | Améliorations partielles récentes | Élevé |

---

## V. Recommandations d'amélioration prioritaires

Le jury distingue trois horizons.

### V.1. Avant soutenance (effort < 2 jours-personne)

1. **Corriger ou retirer toutes les revendications de conformité affichées dans l'UI** (badges « AES-256 », « HDS », « RGPD », « IEC 62304 », « ISO 13485 », mentions « Chiffré de bout en bout »).
2. **Ajouter un bandeau permanent et visible** : « Prototype académique — Démonstration non destinée à un usage clinique — Données simulées ».
3. **Aligner les versions** : choisir une source de vérité (`package.json`), aligner `replit.md`, le footer UI et le `CHANGELOG.md`.
4. **Corriger les erreurs TypeScript résiduelles** : `tsc --noEmit` doit retourner 0.
5. **Créer un fichier `LIMITATIONS.md`** à la racine listant explicitement ce que le prototype ne fait PAS, les revendications qu'il NE peut PAS étayer, et les démarches qui seraient nécessaires pour franchir chaque seuil de maturité.
6. **Réécrire les commentaires d'en-tête trompeurs** (`authService.ts` : retirer la mention « IEC 62304 Classe C / ISO 27001 » ou la requalifier en « inspiré de »).

### V.2. Court terme (1 à 4 semaines)

7. **Mettre en place ESLint + Prettier**, et des scripts `npm run lint`, `npm run typecheck`, `npm run format`.
8. **Mettre en place GitHub Actions** : workflow CI exécutant lint, typecheck et build sur chaque PR.
9. **Installer Vitest + React Testing Library**. Écrire au minimum :
   - 100 % de couverture de `authService.ts`,
   - 100 % de couverture de `decisionLog.ts`,
   - 100 % de couverture de `alertQueue.ts`,
   - tests d'intégration des transitions d'état du `ClinicianHub`.
10. **Réaliser une session d'évaluation utilisateur** pour l'objectif O4 : 3 à 5 cliniciens, protocole think-aloud, questionnaire SUS, mesure du temps de prise de décision avec/sans XAI. Documenter le protocole, les résultats bruts et les enseignements dans le mémoire.
11. **Investiguer la version `lucide-react` 1.8.0** : version anormale, à migrer vers la branche officielle courante.

### V.3. Moyen terme (1 à 3 mois)

12. **Migrer vers une architecture backend** : a minima un service Node/Fastify ou un Postgres hébergé, avec API REST ou tRPC. Migrer la persistance depuis `localStorage` vers ce backend.
13. **Implémenter un modèle ML réel**, même simple (régression logistique sur un jeu de données ouvert tel que UCI Diabetes ou Pima Indians), entraîné, évalué (AUC, F1, calibration), versionné. Connecter ce modèle au pipeline d'explications (SHAP via `kernelshap` ou équivalent web compatible).
14. **Documenter formellement l'architecture** avec des diagrammes C4 niveau 1 (System Context), niveau 2 (Containers), niveau 3 (Components).
15. **Réaliser une analyse de risques ISO 14971 simplifiée** sur les fonctions principales (recommandation thérapeutique, alerte, journal d'audit), même si non destinée au marquage CE — l'exercice est formateur et défendable.

---

## VI. Verdict final

Le jury, statuant à l'issue de l'évaluation, formule le verdict suivant :

**Le travail présenté traduit une compétence technique réelle, une vision produit cohérente, et une capacité d'exécution avérée sur la couche présentation.** La refonte récente du module clinicien (architecture Triage → Focus, hub V3-Dark, gestion correcte des cas limites cliniques après corrections récentes) démontre que le candidat est capable, sous pression et avec un esprit critique, de produire du code propre et défendable.

**Le travail présente cependant des lacunes structurelles graves** qui empêchent une évaluation positive en l'état :

- l'écart entre les revendications affichées et la réalité technique pose un problème **d'honnêteté intellectuelle** que le jury ne peut ignorer ;
- l'absence totale de tests automatisés sur un artéfact qui revendique le statut de SaMD est **rédhibitoire** au regard des standards normatifs cités par le candidat lui-même ;
- l'objectif académique principal (O4 — évaluation de l'impact de l'explicabilité), à 0 % par l'aveu même du candidat, **prive le travail de sa contribution scientifique attendue**.

**Note finale globale** : **8,75 / 20** — *Passable*, sous réserve de corrections.

**Le jury formule trois conditions explicites pour une évaluation supérieure** :

1. Exécution intégrale des actions prioritaires « avant soutenance » (V.1) — **non négociable**.
2. Réalisation effective de l'objectif O4 — sans cela, le mémoire perd sa colonne vertébrale scientifique.
3. Discussion lucide, dans le mémoire écrit, de l'écart entre le prototype livré et un dispositif certifié — quelles démarches, quels coûts, quels délais ? Cette discussion, **assumée et documentée**, transforme une faiblesse perçue en démonstration de maturité.

Le jury **encourage le candidat** : le socle est sérieux, la trajectoire est crédible, et les corrections demandées sont à sa portée. Le potentiel d'une mention *Bien* à l'issue d'une révision substantielle est réel.

---

*Rapport délibéré et arrêté en séance plénière le 1ᵉʳ mai 2026.*
*Jury Académique et d'Experts — Composition pluridisciplinaire — Décision unanime.*
