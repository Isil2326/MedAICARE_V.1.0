# AUDIT REPORT v3.3.0
## MediAI Care — Audit Complet Interface & UX
**Date :** 2025-07-10  
**Auditeur :** Architecte Senior Full-Stack + Ingénieur ML Santé  
**URL auditée :** https://019da72a-3575-756d-aa69-03eff6d73301.arena.site/  
**Version auditée :** v3.2.3  
**Version cible :** v3.3.0  

---

## CONSTATS CRITIQUES PAR PAGE

### PAGE 1 — Landing Page
| ID | Sévérité | Constat | Fichier |
|----|----------|---------|---------|
| LP-01 | 🔴 BLOQUANT | Boutons CTA incohérents : "Se connecter" ouvre modal patient, "Demande d'accès Pro" n'est pas clairement différencié | LandingPage.tsx:46-57 |
| LP-02 | 🟡 MOYEN | Aucun aperçu visuel de l'application (screenshot/mockup) — pas crédible comme produit | LandingPage.tsx |
| LP-03 | 🟡 MOYEN | Section "Pour qui ?" absente — pas de différenciation Patient/Clinicien visible | LandingPage.tsx |
| LP-04 | 🟢 MINEUR | Navigation anchors (#plateforme, #utilisateurs, #citation) ne scrollent pas vers les bonnes sections | LandingPage.tsx:40-42 |

### PAGE 2 — Dashboard Patient
| ID | Sévérité | Constat | Fichier |
|----|----------|---------|---------|
| PD-01 | 🔴 BLOQUANT | Onglet "Journal" = liste d'événements simulés sans utilité réelle. Le patient ne peut pas comprendre ni filtrer | PatientDashboard.tsx:392-418 |
| PD-02 | 🔴 BLOQUANT | XAI masqué derrière un bouton "Pourquoi ?" — pas visible par défaut. C'est la valeur principale du système | PatientDashboard.tsx:326 |
| PD-03 | 🔴 BLOQUANT | Pas de différenciation visuelle entre alerte système vs recommandation IA vs événement patient | PatientDashboard.tsx |
| PD-04 | 🟡 MOYEN | Sélecteur de plage temporelle (Live/H-1/J-1) absent côté patient — demandé dans Obs 001 | PatientDashboard.tsx |
| PD-05 | 🟡 MOYEN | Onglet "Mon traitement" vide si pas de données — pas de message clair | PatientDashboard.tsx |
| PD-06 | 🟡 MOYEN | Actions rapides (repas/insuline/activité) : modal s'ouvre mais aucune donnée n'est réellement enregistrée de manière persistante | PatientDashboard.tsx:148-157 |
| PD-07 | 🟢 MINEUR | "Bonjour {prénom} 👋" — emoji non professionnel pour un contexte médical clinique | PatientDashboard.tsx:180 |

### PAGE 3 — Dashboard Clinicien
| ID | Sévérité | Constat | Fichier |
|----|----------|---------|---------|
| DC-01 | 🔴 BLOQUANT | Onglet "Fiche patient" grisé tant qu'aucun patient n'est sélectionné — UX confuse, le clinicien ne sait pas quoi faire | DoctorDashboard.tsx:85 |
| DC-02 | 🔴 BLOQUANT | "Décision en cours" vide si aucune décision simulée — panneau vide non géré | DoctorDashboard.tsx |
| DC-03 | 🔴 BLOQUANT | Messagerie absente — demandée dans Obs 001 v3.3.0 | — |
| DC-04 | 🔴 BLOQUANT | Modification du traitement patient absente — demandée dans Obs 001 v3.4.0 | — |
| DC-05 | 🟡 MOYEN | Journal historique : filtres présents mais "Tout" affiche trop d'éléments sans regroupement par date | DoctorDashboard.tsx:429-430 |
| DC-06 | 🟡 MOYEN | Export CSV et Rapport ATTD : boutons présents mais non fonctionnels | DoctorDashboard.tsx:89-93 |
| DC-07 | 🟢 MINEUR | "Alertes 24h" dans les KPIs = nombre de patients en alerte, pas le nombre réel d'alertes | DoctorDashboard.tsx:78 |

### PAGE 4 — Dispositifs IoMT
| ID | Sévérité | Constat | Fichier |
|----|----------|---------|---------|
| DV-01 | 🟡 MOYEN | Accessible uniquement au patient (correct per spec) mais visuellement pas intégré dans le parcours patient | App.tsx:18 |
| DV-02 | 🟡 MOYEN | Bouton "Sync tout" non fonctionnel — simulation sans retour utilisateur clair | DevicesView.tsx |
| DV-03 | 🟢 MINEUR | Données des dispositifs ne sont pas utilisées dans le dashboard patient (déconnexion IoMT → patient) | — |

### PAGE 5 — Audit & Traçabilité
| ID | Sévérité | Constat | Fichier |
|----|----------|---------|---------|
| AU-01 | 🟡 MOYEN | Journal d'audit ne reflète pas les vraies actions utilisateur (authentification, logs) | AuditLog.tsx |
| AU-02 | 🟢 MINEUR | Section conformité : références normatives affichées mais non cliquables | AuditLog.tsx |

---

## PRIORITÉS DE RECTIFICATION v3.3.0

### LOT 1 — Corrections bloquantes UX (à faire maintenant)
1. **PD-02** : XAI visible par défaut (ouvert au chargement) + restructuration panneau XAI
2. **PD-01** : Journal patient → remplacé par "Mes alertes & recommandations" avec timeline claire
3. **DC-01** : Fiche patient accessible avec message guide si aucun patient sélectionné
4. **DC-03** : Messagerie Patient ↔ Clinicien (texte simple)
5. **PD-04** : Sélecteur temporel côté patient
6. **LP-03** : Section "Pour qui ?" sur la landing

### LOT 2 — Fonctionnalités (v3.4.0)
1. **DC-04** : Modification du traitement par clinicien
2. **DC-06** : Export CSV fonctionnel
3. **DV-02** : Sync dispositifs avec feedback

---

## SCORE D'AUDIT

| Dimension | Score | Objectif |
|-----------|-------|----------|
| Fonctionnalité | 58% | ≥ 85% |
| UX / Ergonomie | 52% | ≥ 80% |
| Cohérence visuelle | 74% | ≥ 85% |
| Conformité spec Obs 001 | 61% | ≥ 90% |
| **GLOBAL** | **61%** | **≥ 85%** |

---

**Prochaine étape :** Implémentation v3.3.0 — LOT 1 (corrections bloquantes)
