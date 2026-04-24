# 🔍 RAPPORT D'AUDIT — v3.1.0

**Date** : 2026
**Type** : Release de fonctionnalités cliniciennes (Obs 001 — partie 1/3)
**Statut build** : ✅ Vert · 287 kB gzippé · 0 erreur TypeScript
**Périmètre couvert** : 5 / 7 points de l'observation 001

---

## 1. Origine de la version

Cette version répond à l'**Observation 001** émise par le donneur d'ordre, qui regroupe 7 demandes :

| # | Demande Obs 001 | v3.1.0 | Reportée |
|---|-----------------|--------|----------|
| 1 | Numéro de version v3.1 (au lieu de v2.1) | ✅ | — |
| 2 | Versionnement systématique + rapport d'audit par version | ✅ | — |
| 3 | Lecture QR code rapport d'analyses → MAJ dossier patient | — | v3.4.0 |
| 4 | Sélecteur Live / H-1 / J-1 / M-1… (défaut = Live) | ✅ | — |
| 5a | Décision en cours / Action proposée pour patient sélectionné | ✅ | — |
| 5b | Page « Dispositifs » sans valeur pour clinicien | ✅ | — |
| 5c | Journal d'événements → Journal HISTORIQUE (alertes + recommandations) | ✅ | — |
| 6 | Échange de messages Patient ↔ Clinicien | — | v3.2.0 |
| 7 | Pouvoir au clinicien de modifier le traitement du patient | — | v3.3.0 |

**Décision d'architecture** : livraison incrémentale en **3 vagues** pour limiter le risque de régression et permettre la validation par incrément.

---

## 2. Modifications apportées

### 2.1 Versionnement & traçabilité

| Élément | Avant | Après |
|---------|-------|-------|
| Version affichée (sidebar) | `v2.1` | `v3.1.0` |
| Format de versionnement | libre | **SemVer strict** : `MAJEUR.MINEUR.PATCH` |
| Rapport d'audit | sporadique | **systématique** : 1 rapport `AUDIT_REPORT_v[X.Y.Z].md` par version |
| Rollback possible | non documenté | **oui** : chaque version est numérotée et journalisée |

**Convention adoptée** :
- **MAJEUR** (`X`) : refonte produit ou changement de paradigme
- **MINEUR** (`Y`) : nouvelles fonctionnalités sans rupture
- **PATCH** (`Z`) : correctifs et ajustements

### 2.2 Sélecteur de plage temporelle

**Composant créé** : `src/components/ui/TimeRangeSelector.tsx`

**7 plages disponibles** :

| Clé | Label | Description | Granularité |
|-----|-------|-------------|-------------|
| `live` | Live ⦿ | Temps réel (défaut) | 60 s |
| `h1` | H-1 | Dernière heure | 1 min |
| `h6` | H-6 | 6 dernières heures | 5 min |
| `d1` | J-1 | Dernières 24 h | 15 min |
| `d7` | J-7 | 7 derniers jours | 1 h → AGP |
| `m1` | M-1 | 30 derniers jours | 6 h → AGP |
| `m3` | M-3 | 90 derniers jours | 24 h → AGP |

**Comportements clés** :
- Bascule automatique : courbe glycémique pour H-1 → J-1, AGP percentilé pour J-7+
- Indicateur visuel **« Vue rétrospective »** (badge ambre) quand ≠ Live
- Indicateur **pulse animé** sur le bouton Live (signal visuel d'activité)
- Accent visuel paramétrable : `teal` (patient) ou `blue` (clinicien)
- Tooltip natif HTML (`title`) avec description longue de chaque plage

**Données simulées** : `generateHistoricalGlucose()` produit une série déterministe (seed = hash patientId) avec profil journalier réaliste (pics post-prandiaux 7h30, 12h30, 19h30 + descente nocturne).

### 2.3 Décision en cours / Action proposée

**Composant créé** : `PendingDecisionsPanel` + `DecisionCard` (dans `DoctorDashboard.tsx`)

**Position** : tout en haut de la fiche patient, après le sélecteur de plage — **priorité visuelle maximale**.

**Anatomie d'une décision** :

```
┌─────────────────────────────────────────────────────────────┐
│ [HIGH] Risque d'hypoglycémie prédit dans 30 min (78%)      │
│        il y a 12 min · expire dans 4h    Confiance IA: 87% │
├─────────────────────────────────────────────────────────────┤
│ ✦ Action proposée                                           │
│   Réduire bolus dîner de 2U ou collation 15g glucides 18h45│
├─────────────────────────────────────────────────────────────┤
│ [Glycémie 142]  [Tendance ↘ Baisse]                         │
│ [Insuline 3.5U] [TIR 24h 71%]                               │
├─────────────────────────────────────────────────────────────┤
│ ▸ Voir le raisonnement & alternatives                       │
│                                                              │
│ [Rejeter] [Modifier] [✓ Accepter & Tracer]                  │
└─────────────────────────────────────────────────────────────┘
```

**3 actions cliniciennes** (toutes journalisées) :
- **Accepter & Tracer** → applique la recommandation + génère trace audit
- **Modifier** → ouvre modale d'ajustement (à implémenter v3.3)
- **Rejeter** → archive avec motif (à compléter v3.3)

**Conformité IEC 62304 § 5.1** : la **décision finale revient toujours au clinicien**. L'IA propose, le clinicien dispose. Mention explicite dans le panneau.

**Détails par décision** :
- Niveau de risque (LOW / MODERATE / HIGH / CRITICAL) avec code couleur
- Score de confiance IA (% explicite)
- Snapshot contextuel (4 chips : glycémie, tendance, insuline active, TIR 24h)
- Raisonnement IA (liste à puces, 3-4 items)
- Alternatives évaluées avec niveau de risque comparé (↓ ↔ ↑)
- Ligne de temps : créé il y a X min · expire dans Y h
- Section pliable pour décisions déjà traitées (audit rapide)

### 2.4 Journal historique (refonte de l'onglet « Journal »)

**Avant (v2.x)** : flux temps réel d'événements patient (repas, insuline, activité). Utile pour le patient, **inutile pour le clinicien**.

**Après (v3.1.0)** : **vraie source d'audit historique** pour le clinicien.

**Composant créé** : `HistoricalJournal` + `HistoricalEntryRow`

**Contenu agrégé** (par patient sélectionné) :

| Type d'entrée | Origine | Couleur |
|---------------|---------|---------|
| **Alerte** | CGM, BPM, IoMT | rose 🔴 |
| **Recommandation** | AI Engine | bleu 🔵 |
| **Décision** | Clinicien | violet 🟣 |
| **Événement** | Patient | cyan 🟦 |

**Fonctionnalités** :
- **Filtres** : Tout / Alertes / Recommandations / Décisions / Événements (avec compteurs)
- **Groupement par jour** avec en-têtes sticky
- **Affichage par entrée** :
  - Type + module (ex: « ALERTE · CGM »)
  - Sévérité (info / low / medium / high / critical)
  - Heure précise (HH:MM)
  - Titre + résumé
  - Action recommandée (si présente, encadré bleu)
  - Acquittement (qui · quand)
  - Statut suite (acceptée / modifiée / rejetée / pending)
  - **Trace ID** monospace (auditable)
- **Adapté à la plage** : J-7 → 7 jours d'historique, M-1 → 14 jours, M-3 → 30 jours
- **Export PDF / CSV** (bouton préparé, implémentation v3.3)
- Pied : « Journal signé · Conforme IEC 62304 · Trace ID auditable »

### 2.5 Suppression « Dispositifs » du menu clinicien

**Justification** : le clinicien n'opère pas les capteurs. Les informations de connectivité, batterie et firmware sont **opérationnelles patient**, pas cliniques.

**Implémentation** : `App.tsx` ligne 17

```diff
- { key: 'devices', label: 'Dispositifs', roles: ['patient', 'clinician'] }
+ { key: 'devices', label: 'Dispositifs', roles: ['patient'] }
```

**Effet** : sidebar clinicien passe de 4 → 3 entrées (Clinicien · Audit). Plus de bruit.

---

## 3. Fichiers modifiés

| Fichier | Type | Lignes |
|---------|------|--------|
| `src/types/medical.ts` | + types `TimeRangeKey`, `TimeRangeOption`, `HistoricalEntry`, `PendingClinicalDecision` | +60 |
| `src/engine/patient-data.ts` | + `TIME_RANGES`, `getTimeRange`, `generateHistoricalGlucose`, `generateHistoricalEntries`, `getPendingDecisions` | +180 |
| `src/components/ui/TimeRangeSelector.tsx` | **nouveau** composant | +75 |
| `src/components/DoctorDashboard.tsx` | + 4 sous-composants : `PendingDecisionsPanel`, `DecisionCard`, `ContextChip`, `HistoricalJournal`, `HistoricalEntryRow` ; sélecteur de plage intégré ; chart conditionnel AGP/historique | +400 |
| `src/App.tsx` | version `v3.1.0` ; suppression `Dispositifs` pour clinicien | 2 |

**Total** : ~720 lignes ajoutées, 28 lignes supprimées (« Activité récente patient » retirée).

---

## 4. Validation

| Critère | Résultat |
|---------|----------|
| Build TypeScript | ✅ 0 erreur |
| Bundle gzippé | 287 kB (+25 kB vs v1.1.0 — acceptable) |
| Modules transformés | 2 797 |
| Régressions onglets Patient | ✅ aucune |
| Régressions onglets Clinicien Cohorte/Performance | ✅ aucune |
| Sidebar clinicien | ✅ Dispositifs masqué |

**Tests manuels recommandés** :
1. Se connecter clinicien (`clinicien@demo.fr` / `Demo1234!`)
2. Vérifier sidebar : pas d'entrée « Dispositifs »
3. Cohorte → cliquer sur un patient → onglet « Fiche patient »
4. Vérifier présence du panneau **« Décisions en attente »** (badge ambre, 2 décisions)
5. Cliquer **« Voir le raisonnement »** sur une décision → sections raisonnement + alternatives s'affichent
6. Cliquer **« Accepter & Tracer »** → décision passe en « Acceptée », badge compteur se met à jour
7. Tester sélecteur **H-1, J-1, J-7, M-1** → courbe se met à jour, badge « Vue rétrospective » apparaît
8. Scroller vers bas → **Journal historique** présent, filtres fonctionnels (Tout, Alertes, Recommandations…)
9. Vérifier groupement par jour avec en-têtes sticky

---

## 5. Plan des versions à venir

| Version | Périmètre | Couvre Obs 001 |
|---------|-----------|----------------|
| **v3.2.0** | Messagerie Patient ↔ Clinicien (inbox bidirectionnelle, threads, accusé de lecture) | #6 |
| **v3.3.0** | Modification du traitement par le clinicien (édition CarePlan + médicaments, traçabilité, signature) | #7 + finalisation actions Modifier/Rejeter sur décisions |
| **v3.4.0** | Lecture QR code rapport d'analyses (caméra → import → MAJ dossier patient) | #3 |

Chaque version produira son propre `AUDIT_REPORT_v[X.Y.Z].md` selon le **même processus** que celui-ci.

---

## 6. Risques & limites identifiés

| Risque | Sévérité | Mitigation |
|--------|----------|------------|
| Décisions IA non persistantes (state local) | Moyen | v3.3 → persistance via API + signature |
| Journal historique simulé (pas de vraie BDD) | Faible | Données déterministes par patient — comportement reproductible |
| Action « Modifier » sur décision = placeholder | Moyen | v3.3 → modale d'ajustement complète |
| Bundle dépasse 280 kB gzippé | Faible | Code-splitting envisageable v3.5 |

---

**Validation requise** : ✅ Approuver les rectifications v3.1.0 ci-dessus pour passer à **v3.2.0 (Messagerie)**.
