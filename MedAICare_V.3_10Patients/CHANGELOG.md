# 📝 CHANGELOG — MediAI Care

> Format inspiré de [Keep a Changelog](https://keepachangelog.com/) · Versionnement [SemVer](https://semver.org/)
>
> **Règle Obs 001** : chaque version est accompagnée d'un fichier `AUDIT_REPORT_v[X.Y.Z].md` détaillant les modifications, justifications et plan de tests.

---

## [v3.3.0] — 2025-07-10 — 💬 MESSAGERIE + AUDIT PRODUIT
> 📄 Audit : [`AUDIT_REPORT_v3.3.0.md`](./AUDIT_REPORT_v3.3.0.md) · Rectifications : [`RECTIFICATION_REPORT_v3.3.0.md`](./RECTIFICATION_REPORT_v3.3.0.md)

### ✨ Ajouté
- `Messaging.tsx` : messagerie bidirectionnelle Patient ↔ Clinicien
  - Threads, accusés de lecture (✓ / ✓✓ bleu), groupement par jour
  - Persistance localStorage (`mediai_messages_v1`)
  - 4 messages démo pré-chargés (conversation Dr. Martin / Marc Dupont)
  - Mode compact (panneau) + mode plein écran
  - Mention "Chiffré · HDS" visible dans l'interface
- Badge non-lus dynamique (polling 3s) dans sidebar + topbar
- Bouton raccourci Messages dans la topbar avec badge
- `ViewMode 'messages'` : route accessible aux deux rôles (RBAC partagé)

### 🔧 Modifié
- `App.tsx` : navigation refondée (5 items + badge), version v3.2.3 → **v3.3.0**
- `types/medical.ts` : ViewMode étendu avec `'messages'`
- Import ViewMode centralisé (suppression du doublon dans App.tsx)

### 🐛 Corrigé
- Import `Bell` inutilisé supprimé (App.tsx)
- Doublon export `ViewMode` éliminé

### 📋 Reporté → v3.4.0
- Modification du traitement patient par le clinicien
- XAI visible par défaut (panneau ouvert au chargement)
- Export CSV fonctionnel
- Journal patient enrichi (alertes + recos + actions fusionnés)

---

## [v3.1.0] — 2026 — 🩺 OUTILLAGE CLINICIEN (Obs 001 — vague 1/3)

> 📄 Audit complet : [`AUDIT_REPORT_v3.1.0.md`](./AUDIT_REPORT_v3.1.0.md)

### 🔢 Versionnement
- Bascule officielle en **SemVer strict** (`MAJEUR.MINEUR.PATCH`)
- Numéro affiché en sidebar : `v2.1` → **`v3.1.0`**
- Engagement : 1 rapport d'audit par version désormais

### ✨ Ajouté — Sélecteur de plage temporelle
- Composant `TimeRangeSelector` (Live · H-1 · H-6 · J-1 · J-7 · M-1 · M-3)
- Défaut = **Live** (temps réel) avec pulse animé
- Bascule auto : courbe glycémique pour H-1→J-1, AGP pour J-7+
- Badge « Vue rétrospective » quand mode historique
- Données déterministes par patient (`generateHistoricalGlucose`)

### ✨ Ajouté — Décisions en cours / Actions proposées
- Panneau `PendingDecisionsPanel` en haut de la fiche patient (clinicien)
- Carte `DecisionCard` par décision avec :
  - Niveau de risque + score de confiance IA
  - Action proposée explicite
  - Snapshot contextuel (4 chips : glycémie, tendance, insuline active, TIR)
  - Raisonnement IA (puces) + Alternatives évaluées (risque ↓ ↔ ↑)
  - 3 actions cliniciennes : **Accepter & Tracer** / **Modifier** / **Rejeter**
- Conformité **IEC 62304 § 5.1** : décision finale = clinicien
- Section pliable « décisions déjà traitées »

### ✨ Ajouté — Journal historique
- Refonte complète de l'ancien « journal d'événements »
- Composant `HistoricalJournal` agrégeant : Alertes (CGM/IoMT) + Recommandations (AI) + Décisions (clinicien) + Événements (patient)
- 4 filtres avec compteurs (Alertes / Recommandations / Décisions / Événements)
- Groupement par jour avec en-têtes sticky
- Affichage par entrée : titre · résumé · action recommandée · acquittement · statut · **trace ID auditable**
- Fenêtre adaptative : J-7 → 7j d'historique, M-1 → 14j, M-3 → 30j
- Pied : « Journal signé · Conforme IEC 62304 »

### 🗑️ Supprimé / restreint
- Onglet **« Dispositifs »** masqué pour le clinicien (sans valeur opérationnelle)
- Section « Activité récente patient » de la fiche clinicien (intégrée au journal historique)

### 🆕 Types ajoutés
- `TimeRangeKey`, `TimeRangeOption`
- `HistoricalEntryType`, `HistoricalEntry`
- `PendingClinicalDecision` (avec `contextSnapshot`, `reasoning`, `alternativeOptions`)

### 🆕 Données simulées (engine)
- `TIME_RANGES`, `getTimeRange`
- `generateHistoricalGlucose(rangeKey, seed)` — série déterministe seedée
- `generateHistoricalEntries(patientId, daysBack)` — agrégation alertes/recommandations/événements
- `getPendingDecisions(patientId)` — 2 décisions exemples

### 📦 Build
- Bundle : 287 kB gzippé (+25 kB vs v1.1.0)
- Modules : 2 797
- Erreurs TS : 0

### 🗺️ Reste à faire (Obs 001)
- v3.2.0 → Messagerie Patient ↔ Clinicien
- v3.3.0 → Modification du traitement par clinicien
- v3.4.0 → Lecture QR code rapport d'analyses

---

## [v1.1.0] — 2026 — 🎨 REFONTE PRODUIT (Patient & Clinicien)

### 🗑️ Supprimé (effet "démo" éliminé)
- Sélecteur de scénarios cliniques visible côté patient ("Stable / Hypo / Hyper / Critique")
- Bouton Pause/Reprendre du flux IoMT
- Badge "Live · 4s" et noms de modèles ML côté patient
- Vocabulaire technique exposé au patient ("Score IA 75/100", IDs de décision)

### ✨ Ajouté — Patient (4 onglets)
- **Aujourd'hui** : Hero personnalisé "Bonjour [prénom]" + glycémie + 4 actions rapides + recommandation IA expliquée
- **Journal** : Timeline d'évènements avec saisie (Repas / Insuline / Activité / Note)
- **Tendances** : 4 KPIs cliniques + TIR stratifié 5 zones + AGP 14j (standard ATTD)
- **Mon traitement** : Cibles glycémiques + médicaments + note du médecin
- XAI patient-friendly : "Dans 30 minutes" + "Pourquoi cette recommandation"

### ✨ Ajouté — Clinicien (3 onglets)
- **Cohorte** : Liste enrichie (HbA1c, TIR, statut) + filtres rapides + stratification du risque
- **Fiche patient** : Composant `PatientFile` complet (header, 5 KPIs, AGP, TIR stratifié, notes annotables, plan de soins, médicaments, activité patient)
- **Performance IA** : 3 modèles avec gauges F1 et métriques détaillées
- Boutons : Téléconsulter, Rapport ATTD, Export CSV, Annoter, Prescrire

### 🎨 Différenciation visuelle
- Patient : palette **teal/cyan**, ton chaleureux/personnel
- Clinicien : palette **bleu/violet**, densité élevée, ton clinique pro

### 🆕 Nouveau module
- `src/engine/patient-data.ts` : génération réaliste (évènements, AGP, TIR, plan de soins, notes, médicaments)

### 🆕 Types ajoutés
- `PatientEvent`, `AGPDataPoint`, `TIRStratified`, `CarePlan`, `ClinicalNote`, `Medication`

### 📊 Métriques de couverture (charte)
- O2 (modèle IA recommandation) : 60% → **80%**
- O3 (XAI compréhensible) : 70% → **85%**

### 📄 Documentation
- `AUDIT_PRODUCT_v1.1.0.md` — Audit produit détaillé
- `REPORT_v1.1.0.md` — Rapport de livraison + métriques avant/après

---

## [v1.0.0] — 2026 — 🎯 ALIGNEMENT SUR LA CHARTE

### 📋 Documents fondateurs créés
- `PROJECT_CHARTER_v1.0.0.md` — Charte de référence absolue (scope diabète + XAI + IoMT)
- `CHANGELOG.md` — Historique structuré des versions
- `AUDIT_ALIGNMENT_v1.0.0.md` — Audit d'alignement entre l'existant et la charte

### 🎯 Décisions structurantes
- **Maladie cible recentrée :** DIABÈTE (Type 1 et Type 2) uniquement
- **Variables IoMT figées** : 8 variables physiologiques validées
- **5 types de recommandations** définis et délimités
- **Scope évaluation (O4)** ajouté comme manque critique à combler

---

## [v0.9.x] — Versions Pré-Charte (ARCHIVÉ)

### v0.9.5 — Refonte XAI
- Ajout prédiction glycémique 30 min
- Ajout rationnel de recommandation
- Types `GlycemicTrend`, `RecommendationRationale`

### v0.9.4 — Authentification réelle
- PBKDF2-SHA256 (100k itérations)
- RBAC strict Patient ≠ Clinicien
- Comptes démo

### v0.9.3 — Refonte Design System
- Primitives UI partagées (`primitives.tsx`)
- Dark theme premium unifié
- Suppression "Analytiques IA" (redondant avec Médecin)

### v0.9.2 — Pipeline Landing Page
- Refontes successives du pipeline visuel
- Adoption design Tidepool-inspired

### v0.9.1 — Authentification fictive (déprécié)
- Boutons "Créer mon espace" et "Demande d'accès Pro"
- Modal d'authentification simple

### v0.9.0 — Base initiale
- Architecture initiale : Patient/Médecin dashboards
- Simulateur IoMT
- Premier moteur IA + XAI
