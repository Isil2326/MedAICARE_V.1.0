# 🔍 AUDIT REPORT v3.3.1 — Réserves de validation v3.3.0

**Date :** 2026
**Statut :** Réserves identifiées suite à validation utilisateur
**Type :** Patch correctif (3.3.0 → 3.3.1)

---

## 📋 Réserves utilisateur

> *"v3.3.0 VALIDE avec réserves : manque l'indicateur badge "1" (message non lu) coté patient/clinicien; le design n'est pas vraiment pro et haute class !"*

---

## 🐛 Anomalies identifiées

### A1 — Badge non-lus invisible côté Patient 🔴 BLOQUANT

**Constat :**
Le badge "non-lus" fonctionne uniquement côté Clinicien car les **4 messages démo pré-chargés** ont tous `senderRole: 'patient'` → le patient n'a jamais aucun message entrant au démarrage.

**Cause racine :**
```typescript
// messageService.ts — initDemoMessages()
{ senderRole: 'patient', receiverRole: 'doctor', ... } // ❌ Tous unidirectionnels
```

**Impact :**
- Patient ne voit jamais de notification
- Démo asymétrique → impression que la messagerie est cassée

---

### A2 — Pas de refresh immédiat après envoi 🟡 MOYEN

**Constat :**
Polling unique toutes les 3 secondes → délai visible entre envoi et apparition du badge côté destinataire.

**Cause racine :**
```typescript
const interval = setInterval(refreshUnread, 3000);
// ❌ Pas de trigger immédiat sur envoi
```

**Impact :**
- UX dégradée
- Sentiment de lenteur

---

### A3 — Design messagerie générique 🟡 MOYEN

**Constat utilisateur :** *"le design n'est pas vraiment pro et haute class"*

**Anomalies visuelles identifiées :**

| # | Élément | Problème actuel | Référence cible |
|---|---------|----------------|-----------------|
| D1 | Bulles messages | Coins arrondis simples, pas de queue | Telegram, iMessage |
| D2 | Avatars | Initiales sur cercle plat | Gradient + ring + status dot |
| D3 | Liste threads | Items basiques sans hiérarchie | Slack, Linear |
| D4 | Header conversation | Statique, pas d'infos contextuelles | Specialty, statut online, dernière vue |
| D5 | Zone composition | Textarea brut | Toolbar + raccourcis + auto-resize |
| D6 | Empty state | Texte simple | Illustration + CTA + onboarding |
| D7 | Timestamps | Format brut "14:32" | Smart format ("Il y a 2 min", "Hier") |
| D8 | Accusés lecture | ✓✓ basique | Tooltip + animation |
| D9 | Séparateurs jours | Absents | "Aujourd'hui", "Hier", "12 mars" |
| D10 | Densité visuelle | Plate | Élévations, micro-interactions |

---

## 🎯 Plan de correction v3.3.1

### Lot 1 — Bugs (15 min)

1. ✅ **Messages démo bidirectionnels** : ajouter 2 messages du clinicien vers patient
2. ✅ **Refresh immédiat** : trigger custom event après `sendMessage()`
3. ✅ **Polling réduit** : 3s → 2s pour réactivité

### Lot 2 — Refonte design premium (30 min)

1. ✅ **Bulles iMessage-like** : coins asymétriques + queue subtile
2. ✅ **Avatars gradient** : couleurs hash sur nom + ring + status dot animé
3. ✅ **Liste threads enrichie** : preview message + heure + badge + unread dot
4. ✅ **Header contextuel** : avatar + nom + statut + spécialité + actions
5. ✅ **Composer pro** : auto-resize + bouton attachment (placeholder) + raccourcis
6. ✅ **Empty state premium** : illustration SVG + CTA explicatif
7. ✅ **Smart timestamps** : utility `formatSmartTime()`
8. ✅ **Séparateurs de jours** : "Aujourd'hui", "Hier", date complète
9. ✅ **Animations** : entrée messages, hover threads, transitions fluides
10. ✅ **Mode sombre cohérent** : palette unifiée avec le reste de l'app

---

## ✅ Critères d'acceptation

- [ ] Badge "1" visible côté patient au login (1 message clinicien non lu)
- [ ] Badge "1" visible côté clinicien au login (3 messages patient non lus)
- [ ] Envoi message → badge destinataire apparaît en <500ms
- [ ] Design comparable à Telegram/iMessage en qualité visuelle
- [ ] Animations fluides (60fps)
- [ ] 0 erreur TypeScript
- [ ] Build < 350 kB gzip

---

**Validation requise après application : test bidirectionnel patient ↔ clinicien**
