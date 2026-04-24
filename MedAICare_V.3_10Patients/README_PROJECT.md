# 🏥 MediAI Care — Documentation Centrale

> **Système de Recommandation Thérapeutique pour Patients Diabétiques**
> Basé sur IoMT + IA Explicable (XAI)
> **Mémoire de Master en Informatique Biomédicale**

---

## 📚 NAVIGATION DE LA DOCUMENTATION

### 🎯 Documents Fondateurs (à consulter en premier)
| Document | Description | Version |
|----------|-------------|---------|
| **[PROJECT_CHARTER_v1.0.0.md](./PROJECT_CHARTER_v1.0.0.md)** | Charte de référence absolue du projet | v1.0.0 ACTIF |
| **[CHANGELOG.md](./CHANGELOG.md)** | Historique structuré des versions | — |
| **[AUDIT_ALIGNMENT_v1.0.0.md](./AUDIT_ALIGNMENT_v1.0.0.md)** | Audit d'alignement avec la charte | v1.0.0 |

### 📋 Rapports Actifs (post-charte)
| Document | Description | Version |
|----------|-------------|---------|
| [XAI_IMPROVEMENTS_REPORT.md](./XAI_IMPROVEMENTS_REPORT.md) | Améliorations XAI (tendance + rationnel) | v0.9.5 |
| [AUTHENTIFICATION_REELLE.md](./AUTHENTIFICATION_REELLE.md) | Authentification PBKDF2 + RBAC | v0.9.4 |

### 🗄️ Documents Archivés (pré-charte)
- `AUDIT_REPORT.md`
- `AUDIT_RAPPORT.md`
- `AUDIT_DEVICES_REPORT.md`
- `RECTIFICATION_REPORT.md`
- `RECTIFICATION_DEVICES_REPORT.md`
- `VERIFICATION_FINALE.md`

---

## 🎯 OBJECTIFS DU PROJET (selon Charte)

| ID | Objectif | Statut |
|----|----------|--------|
| **O1** | Identifier les variables physiologiques IoMT pertinentes | ✅ 90% |
| **O2** | Développer un modèle IA de recommandation | ⚠️ 60% |
| **O3** | Intégrer des mécanismes XAI (SHAP, LIME) | ⚠️ 70% |
| **O4** | Évaluer l'impact de l'explicabilité | ❌ 0% |

---

## 🗺️ FEUILLE DE ROUTE

### v1.1.0 — Évaluation + Recommandations Typées (PROCHAIN)
**Objectif :** Combler O4 + R1.2 + R1.3

- [ ] Module d'évaluation utilisateur (Likert)
- [ ] Suivi des recommandations appliquées
- [ ] Indicateurs cliniques évolutifs (TIR, variabilité)
- [ ] Recommandations typées (insuline / médicament / nutrition / activité / alerte)
- [ ] Intervalle de confiance explicite

### v1.2.0 — XAI Avancé
**Objectif :** Renforcer O3

- [ ] Isolation moteur XAI (`engine/xai-engine.ts`)
- [ ] Visualisation SHAP globale (médecin)
- [ ] Méthode LIME complémentaire
- [ ] Documentation dataset simulé

### v1.3.0 — Architecture & Documentation
**Objectif :** Polir l'ensemble

- [ ] Module versioning des modèles
- [ ] Export PDF recommandations + XAI
- [ ] Comparaison modèles (RF vs léger vs règles)
- [ ] Nettoyage documentation

---

## 🏗️ ARCHITECTURE TECHNIQUE

```
src/
├── auth/                    # Authentification PBKDF2 + RBAC
│   ├── authService.ts
│   └── AuthContext.tsx
├── engine/                  # Couches 2-4 (Pipeline + IA + XAI)
│   ├── simulator.ts        # IoMT + Pipeline données
│   └── ai-engine.ts        # IA + XAI (à séparer en v1.2.0)
├── components/              # Couche 5 (Interfaces)
│   ├── ui/primitives.tsx   # Design system partagé
│   ├── LandingPage.tsx
│   ├── PatientDashboard.tsx
│   ├── DoctorDashboard.tsx
│   ├── DevicesView.tsx
│   ├── AuditLog.tsx
│   ├── AuthModal.tsx
│   └── ErrorBoundary.tsx
├── types/medical.ts         # Types TypeScript
└── App.tsx                  # Point d'entrée + routing
```

---

## 🔐 PROCESSUS DE MODIFICATION

> **Tout changement DOIT suivre ce processus pour maintenir la cohérence.**

```
1. CONSULTER  → PROJECT_CHARTER_v1.0.0.md
2. AUDITER    → Créer AUDIT_v[X.Y.Z].md
3. PLANIFIER  → Créer PLAN_v[X.Y.Z].md
4. VALIDER    → ⏸️ ATTENDRE accord utilisateur
5. IMPLÉMENTER → Code + commits atomiques
6. RAPPORTER  → Créer REPORT_v[X.Y.Z].md
7. VERSIONNER → Mettre à jour CHANGELOG.md
```

---

## 🎓 ALIGNEMENT MÉMOIRE DE MASTER

Le projet est calibré pour répondre aux exigences d'un **mémoire de Master en Informatique Biomédicale** avec :

- ✅ Problématique médicale claire (diabète chronique)
- ✅ Hypothèse de recherche formulée (XAI → confiance)
- ✅ Variables justifiées scientifiquement
- ⚠️ Modèle IA à comparer (en cours)
- ⚠️ XAI à renforcer (SHAP + LIME)
- ❌ Évaluation expérimentale **à implémenter** (v1.1.0)
- ✅ Architecture quasi-certifiable (IEC 62304, ISO 13485)
- ✅ Authentification conforme RGPD

---

## 🚀 PROCHAINE ACTION

**EN ATTENTE DE VALIDATION UTILISATEUR** pour démarrer **v1.1.0**.

Voir [AUDIT_ALIGNMENT_v1.0.0.md](./AUDIT_ALIGNMENT_v1.0.0.md) section "Plan de Rectification".
