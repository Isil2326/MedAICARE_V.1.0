# 📋 CHARTE DE PROJET — MediAI Care
## Document Fondateur de Référence — Version 1.0.0

> **Statut :** ACTIF · **Date :** 2026 · **Maladie chronique cible :** DIABÈTE
> **Ce document est la source de vérité unique du projet. Toute modification doit s'y référer.**

---

## 1. CONTEXTE GÉNÉRAL

### 1.1 Problématique médicale

Les patients atteints de **maladies chroniques (diabète en priorité)** nécessitent un suivi thérapeutique régulier ajusté à l'évolution de leur état. Les professionnels de santé font face à :

- Une **surcharge informationnelle** issue des capteurs IoMT et DME
- Une **analyse manuelle impossible** sans outils d'aide à la décision
- Des systèmes IA actuels en **"boîte noire"** générant méfiance et faible adoption

### 1.2 Hypothèse de recherche

> *L'intégration de mécanismes XAI (SHAP/LIME) dans un système de recommandation thérapeutique basé sur des données IoMT améliore significativement la confiance clinique, l'acceptation par les patients et la qualité du suivi thérapeutique.*

---

## 2. OBJECTIF PRINCIPAL DU PROJET

**Concevoir et évaluer un système de recommandation thérapeutique pour patients chroniques (diabète), fondé sur des données IoMT, intégrant des techniques d'IA Explicable (XAI), assurant performance ET transparence.**

### 2.1 Objectifs spécifiques (alignés sur le mémoire)

| # | Objectif | Statut Projet | Composants concernés |
|---|----------|---------------|---------------------|
| O1 | Identifier les variables physiologiques IoMT pertinentes pour le diabète | ✅ Implémenté | `simulator.ts`, `types/medical.ts` |
| O2 | Développer un modèle IA de recommandation (ajustement traitement, médicaments, conseils nutrition/activité) | ⚠️ Partiel | `ai-engine.ts` |
| O3 | Intégrer des mécanismes d'explicabilité (SHAP, LIME) | ⚠️ Partiel | `ai-engine.ts`, `PatientDashboard.tsx` |
| O4 | Évaluer l'impact de l'explicabilité sur confiance, acceptation et qualité de suivi | ❌ Non implémenté | À créer : module évaluation |

---

## 3. SCOPE FONCTIONNEL DÉLIMITÉ

### 3.1 ✅ DANS LE SCOPE

#### Maladie cible : **DIABÈTE** (Type 1 et Type 2)
- Surveillance glycémie continue (CGM)
- Pression artérielle (comorbidité fréquente)
- Activité physique
- Apports glucidiques

#### Variables physiologiques IoMT retenues (O1)
| Variable | Source IoMT | Rôle clinique |
|----------|-------------|---------------|
| Glycémie (mg/dL) | CGM (FreeStyle Libre, Dexcom) | Variable principale |
| Tendance glycémique | CGM (calcul dérivé) | Anticipation |
| Fréquence cardiaque | Smartwatch | Stress, hypoglycémie |
| Pression artérielle | Tensiomètre connecté | Comorbidité diabète |
| SpO₂ | Oxymètre | État général |
| Pas / Activité | Smartwatch | Consommation glucose |
| Glucides ingérés | Saisie manuelle / app | Contexte alimentaire |
| Insuline injectée | Pompe / stylo connecté | Contexte thérapeutique |

#### Types de recommandations (O2)
1. **Ajustement de traitement** (ex: dose insuline)
2. **Rappel de prise de médicaments**
3. **Conseil nutritionnel** (limiter sucres rapides, prise glucides)
4. **Conseil d'activité physique** (marche, repos)
5. **Alerte clinique** (consulter médecin)

#### Mécanismes XAI (O3)
- **SHAP local** : explication d'une prédiction individuelle
- **SHAP global** : comportement général du modèle
- **Explication de tendance** : pourquoi la glycémie va monter/descendre
- **Rationnel de recommandation** : chaîne donnée → décision → action

#### Évaluation (O4) — À IMPLÉMENTER
- Échelle de confiance utilisateur (Likert 1-5)
- Mesure d'acceptation (suivi des recommandations appliquées)
- Indicateurs cliniques (Time In Range, variabilité glycémique)

### 3.2 ❌ HORS SCOPE (à mentionner mais ne pas développer)

- Hypertension primaire (uniquement comme comorbidité du diabète)
- Insuffisance cardiaque (mention seulement)
- Obésité (uniquement comme facteur de risque)
- Intégration FHIR réelle (architecture prévue, pas d'implémentation)
- Certification SaMD réelle (conformité visée mais non certifiée)

---

## 4. ARCHITECTURE LOGIQUE DE RÉFÉRENCE

```
┌─────────────────────────────────────────────────────────────┐
│  COUCHE 1 : ACQUISITION IoMT                                 │
│  CGM · Smartwatch · Tensiomètre · Pompe · Saisie manuelle   │
└────────────────────┬────────────────────────────────────────┘
                     │ Streaming temps réel
┌────────────────────▼────────────────────────────────────────┐
│  COUCHE 2 : PIPELINE DE DONNÉES                              │
│  Ingestion · Normalisation · Validation · Stockage versionné │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│  COUCHE 3 : MOTEUR IA DE RECOMMANDATION                      │
│  Modèle principal (Random Forest) + Modèles comparatifs      │
│  Score de confiance · Gestion incertitudes                   │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│  COUCHE 4 : MOTEUR XAI                                       │
│  SHAP local · SHAP global · Tendance · Rationnel             │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│  COUCHE 5 : INTERFACES                                       │
│  Patient (recommandations + XAI)                             │
│  Médecin (cohorte + XAI + rapports)                          │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│  COUCHE 6 : ÉVALUATION (À IMPLÉMENTER)                       │
│  Confiance utilisateur · Acceptation · Métriques cliniques   │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. STRATÉGIE DE VERSIONNEMENT

### 5.1 Convention SemVer adaptée

**Format : `vMAJOR.MINOR.PATCH`**

- **MAJOR** : Refonte architecturale ou changement de scope
- **MINOR** : Nouvelle fonctionnalité alignée sur la charte
- **PATCH** : Correction de bug ou raffinement UI

### 5.2 Versions du projet

| Version | Date | Description | Statut |
|---------|------|-------------|--------|
| v1.0.0 | 2026 | Charte fondatrice + scope diabète | ACTIF |
| v0.9.x | 2026 | Versions précédentes (pré-charte) | ARCHIVÉ |

### 5.3 Process de modification

1. **Avant toute modification** : se référer à cette charte
2. **Audit préalable** : créer `AUDIT_v[X.Y.Z].md`
3. **Plan de rectification** : créer `PLAN_v[X.Y.Z].md`
4. **Validation utilisateur** : attendre accord
5. **Implémentation** : commits atomiques
6. **Rapport final** : créer `REPORT_v[X.Y.Z].md`
7. **Tag de version** : noter dans CHANGELOG

---

## 6. CRITÈRES DE QUALITÉ ACADÉMIQUE

Pour qu'une fonctionnalité soit considérée comme **conforme à un mémoire de Master**, elle doit :

- [ ] Être **alignée** sur un objectif (O1-O4) de la charte
- [ ] Être **justifiée** scientifiquement (référence ADA, étude clinique)
- [ ] Être **mesurable** (métrique quantifiable)
- [ ] Être **explicable** (transparence du raisonnement)
- [ ] Être **reproductible** (pseudo-code ou implémentation)
- [ ] Être **traçable** (journalisée pour audit)

---

## 7. LIVRABLES ATTENDUS (alignés sur le prompt initial)

| # | Livrable | Statut |
|---|----------|--------|
| L1 | Architecture détaillée (diagrammes) | ✅ Section 4 |
| L2 | Description modulaire complète | ✅ Section 4 |
| L3 | Implémentation des composants critiques | ⚠️ En cours |
| L4 | Scénarios d'usage réels (patients simulés) | ✅ `simulator.ts` |
| L5 | Démonstration du pipeline complet | ⚠️ Partiel |
| L6 | Intégration visible du XAI dans l'interface | ⚠️ À renforcer |
| L7 | Stratégie de test et validation | ❌ À créer |

---

## 8. SIGNATURE DU DOCUMENT

**Hash de référence :** `CHARTER-v1.0.0-DIABETES-XAI-IoMT`
**À utiliser dans tous les commits et rapports d'audit ultérieurs.**
