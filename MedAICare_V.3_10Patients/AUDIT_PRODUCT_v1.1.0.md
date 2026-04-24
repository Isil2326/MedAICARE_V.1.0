# 🔍 AUDIT PRODUIT — v1.1.0

**Date** : 2026
**Périmètre** : Expérience utilisateur réelle (pas la documentation)
**Référence** : Tidepool · Dexcom Clarity · Medtronic CareLink · LibreView

---

## 1. Constats critiques

### 1.1 Effet "diapo de présentation" (BLOQUANT)

| Symptôme | Cause | Impact |
|----------|-------|--------|
| Sélecteur "Stable / Hypo / Hyper / Critique" en haut du dashboard patient | Reliquat du mode démo académique | Le patient comprend que les données sont fausses → perte totale de crédibilité |
| Bouton "Pause / Reprendre" du flux de données | Comportement non médical | Aucun vrai produit n'a ce contrôle |
| Badge "Live · 4s" affiché en permanence | Trop technique | Aucun patient n'a besoin de connaître la fréquence d'échantillonnage |
| Modèles IA "Random Forest / XGBoost / Règles expertes" exposés au patient | Confusion entre vue patient et vue technique | Un patient ne doit jamais voir le moteur ML |

### 1.2 Confusion Patient / Clinicien (BLOQUANT)

| Élément | Patient actuel | Clinicien actuel | Problème |
|---------|----------------|------------------|----------|
| Chrome (sidebar, header) | Identique | Identique | Aucun signal visuel de "où je suis" |
| Cards (glass dark) | Identiques | Identiques | Pas de hiérarchie produit |
| Onglets / sections | Tout sur une page | 2 onglets (Cohorte, Performance) | Pas de workflow réel |
| Actions disponibles | "Acquitter" alerte (1 seule) | "Exporter / Rapport" (2) | Un patient n'a aucune action à faire ! |

### 1.3 Manque de fonctionnalités produit réelles

**Côté Patient — Manque :**
- ❌ Logger un repas (carbs/grammes)
- ❌ Logger une dose d'insuline (rapide/basale)
- ❌ Logger une activité physique
- ❌ Ajouter une note libre
- ❌ Voir son journal du jour
- ❌ Voir ses tendances (AGP — Ambulatory Glucose Profile)
- ❌ Voir ses médicaments / traitement
- ❌ Voir son profil / paramètres cibles
- ❌ Partager ses données avec son médecin

**Côté Clinicien — Manque :**
- ❌ Fiche patient complète (AGP, statistiques, journal)
- ❌ Rapport ATTD standard (Time in Range stratifié 5 zones)
- ❌ Annotations cliniques (commentaires sur un patient)
- ❌ Plan de soins (objectifs, ajustements)
- ❌ Téléconsultation rapide
- ❌ Prescription électronique

### 1.4 Vocabulaire et registre

| Actuel | Doit devenir |
|--------|--------------|
| "Scénario clinique" | (supprimé) |
| "Score IA 75/100" (côté patient) | "Recommandation du jour" |
| "Modèle Random Forest" (côté patient) | (caché — uniquement côté clinicien dans onglet performance) |
| "Décision tracée: rec_xyz" | (supprimé côté patient — visible uniquement dans audit) |
| "Niveau de confiance du modèle" | "Fiabilité de la recommandation" |

---

## 2. Plan de refonte v1.1.0

### 2.1 Suppression des éléments "démo"

| Action | Composant |
|--------|-----------|
| Supprimer sélecteur de scénarios | `PatientDashboard.tsx` |
| Supprimer bouton Pause/Live | `PatientDashboard.tsx` |
| Cacher noms de modèles ML côté patient | `PatientDashboard.tsx` |
| Retirer ID techniques visibles côté patient | `PatientDashboard.tsx` |

### 2.2 Refonte Patient — Vraie app

**Structure 4 onglets :**

1. **Aujourd'hui** — Vue active (glycémie temps réel + dernier repas + dernière dose + recommandation IA)
2. **Journal** — Timeline d'évènements (repas, insuline, activité, notes)
3. **Tendances** — AGP 14 jours + statistiques (TIR, GMI, variabilité)
4. **Mon traitement** — Médicaments, cibles glycémiques, profil

**Actions rapides (toujours visibles) :**
- 🍽️ Logger repas
- 💉 Logger insuline
- 🏃 Logger activité
- 📝 Ajouter note

**Différenciation visuelle Patient :**
- Accent **teal/cyan** (couleur santé/bien-être)
- Cards plus chaleureuses (pas dark complet)
- Fonts plus grandes, icônes plus grandes
- Langage personnel ("Votre glycémie", "Votre prochaine dose")

### 2.3 Refonte Clinicien — Vrai portail pro

**Structure 3 onglets :**

1. **Cohorte** — Liste patients triable + filtrable + recherche
2. **Fiche patient** (sélection) — AGP standard + TIR stratifié + journal + plan de soins
3. **Performance modèles** — (masqué par défaut, accordéon)

**Actions cliniciens :**
- ✏️ Annoter le patient
- 📋 Ajuster le plan de soins
- 💊 Prescription électronique
- 📞 Téléconsulter
- 📤 Exporter rapport ATTD

**Différenciation visuelle Clinicien :**
- Accent **bleu/violet** (couleur médical pro)
- Densité d'information élevée (tableaux, multi-colonnes)
- Fonts plus petites, plus de data
- Langage clinique ("Patient stratifié", "TIR stratifié 5 zones")

### 2.4 Nouveau contenu requis

| Contenu | Type | Localisation |
|---------|------|--------------|
| Journal d'évènements simulé | Données | Patient → Journal |
| AGP 14 jours simulé | Données | Patient → Tendances + Clinicien → Fiche |
| TIR stratifié (Very Low / Low / In Range / High / Very High) | Composant | Patient + Clinicien |
| Plan de soins template | Composant | Clinicien → Fiche patient |
| Annotations cliniques | Composant + données | Clinicien → Fiche patient |

---

## 3. Métriques de succès

| KPI | Avant | Après (cible) |
|-----|-------|---------------|
| Effet "démo" perceptible | OUI | NON |
| Différenciation Patient/Clinicien visuelle | 2/10 | 9/10 |
| Actions patient disponibles | 1 | 4+ |
| Actions clinicien disponibles | 2 | 5+ |
| Onglets Patient | 0 | 4 |
| Onglets Clinicien | 2 | 3 |
| Vocabulaire patient-friendly | 4/10 | 9/10 |

---

**Validation requise** : ce plan correspond-il à votre attente ?
Si oui, je procède aux modifications dans cet ordre :
1. Types + simulateur d'évènements
2. Refonte PatientDashboard (4 onglets + actions)
3. Refonte DoctorDashboard (3 onglets + fiche patient)
4. Différenciation visuelle (palettes distinctes)
5. Build + rapport de livraison
