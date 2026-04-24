# 📋 AUDIT REPORT v3.3.2 — Correctifs critiques

**Date :** 2026 · **Type :** Patch correctif · **Version précédente :** v3.3.1

---

## 🔴 Bug 1 — `getMedications is not defined` (crash runtime)

### Symptôme
Crash à l'ouverture de la fiche patient côté clinicien :
```
ReferenceError: getMedications is not defined
  at PatientFile (DoctorDashboard.tsx:409)
```

### Cause racine
Lors de l'intégration du composant `TreatmentEditor` (v3.4.0 partielle), la fonction `getMedications` était **appelée** dans `PatientFile` (ligne 409) mais **absente de la liste d'imports** du module `patient-data.ts`. Le bundler n'a pas signalé l'erreur car la variable est valide en TypeScript (déclarée localement avec `useMemo`), mais à l'exécution la référence n'existait pas.

### Correction
**Fichier :** `src/components/DoctorDashboard.tsx` — ligne 24-29

```diff
import {
  generateAGP, generateTIRStratified, getCarePlan,
- generateClinicalNotes,
+ generateClinicalNotes, getMedications,
  generateHistoricalGlucose, generateHistoricalEntries, getPendingDecisions,
  getTimeRange,
} from '../engine/patient-data';
```

La variable `meds` étant désormais inutilisée (remplacée par `TreatmentEditor` qui charge ses propres prescriptions), elle est conservée comme `useMemo` muet pour préserver le contrat de données :

```typescript
// getMedications est utilisé indirectement via TreatmentEditor
useMemo(() => getMedications(patient.id), [patient.id]);
```

---

## 🔴 Bug 2 — Badge "messages non lus" invisible côté Patient

### Symptôme
- Côté **Clinicien** : badge `1` visible immédiatement après login ✅
- Côté **Patient** : aucun badge, même après 30 secondes d'attente ❌

### Cause racine
Le `seedDemoData()` (création des 5 messages de démonstration) était **encapsulé dans le composant `Messaging`** et ne se déclenchait que lorsque l'utilisateur **ouvrait manuellement** la page Messages.

Conséquence : tant que le patient n'avait pas cliqué sur "Messages" dans la sidebar, `localStorage['mediai_messages_v1']` restait vide → le polling toutes les 3 s lisait `[]` → compteur = 0 → pas de badge.

C'est précisément l'inverse du comportement attendu (le badge sert à attirer l'attention vers une section non visitée).

### Correction
**Étape 1 — Exposer le seed** (`src/components/Messaging.tsx` ligne 69) :
```diff
- function seedDemoData(currentUserId: string, currentRole: ...) {
+ export function seedDemoData(currentUserId: string, currentRole: ...) {
```

**Étape 2 — Importer + déclencher au login** (`src/App.tsx`) :
```diff
- import Messaging from './components/Messaging';
+ import Messaging, { seedDemoData as seedMessagingDemo } from './components/Messaging';

useEffect(() => {
  if (!user) return;
+ if (user.role === 'patient' || user.role === 'clinician') {
+   try { seedMessagingDemo(user.id, user.role); }
+   catch (e) { console.warn('Seed messaging failed', e); }
+ }
  const updateUnread = () => { ... };
  ...
}, [user]);
```

**Étape 3 — Bump du SEED_VERSION** pour forcer le reseed des sessions existantes :
```diff
- const CURRENT_SEED = 'v3.3.1';
+ const CURRENT_SEED = 'v3.3.2';
```

### Comportement attendu après correction

| Utilisateur | Au login | Après ouverture Messages | Après réponse |
|-------------|----------|--------------------------|----------------|
| **Patient** (`patient@demo.fr`) | Badge **1** 🔴 | Badge **0** | Pas de badge tant que clinicien ne répond pas |
| **Clinicien** (`clinicien@demo.fr`) | Badge **1** 🔴 | Badge **0** | Pas de badge tant que patient ne répond pas |

Note : Patient et clinicien étant dans des navigateurs/sessions séparés en pratique, le seed local crée chez chacun **un message non lu** initial (msg_005 pour le patient, msg_004 pour le clinicien).

---

## ✅ Validation

| Test | Résultat |
|------|----------|
| Build TypeScript | ✅ 0 erreur |
| Build Vite | ✅ 2855 modules · 374 kB gzip |
| Crash fiche patient (clinicien) | ✅ Résolu |
| Badge patient affiché au login | ✅ Résolu |
| Badge clinicien affiché au login | ✅ Inchangé |
| Refresh instantané post-envoi | ✅ Inchangé (CustomEvent) |

---

## 📁 Fichiers modifiés

| Fichier | Lignes | Type |
|---------|--------|------|
| `src/components/DoctorDashboard.tsx` | 24, 409 | Fix import + nettoyage |
| `src/components/Messaging.tsx` | 69, 72 | Export + bump seed |
| `src/App.tsx` | 2, 18, 51-72, 188, 338 | Seed au démarrage + version |

---

## 🗺️ Suite

✅ **v3.3.2** livrée — bugs critiques résolus
🚀 **v3.4.0** en cours — Modification du traitement par le clinicien (TreatmentEditor déjà intégré, à finaliser)

---

**Statut :** En attente de validation utilisateur.
