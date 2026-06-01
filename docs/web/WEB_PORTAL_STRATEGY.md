# Stratégie portail web — MediAI Care (Phase 8.5.1)

> **Posture inchangée.** Aucun changement backend / ML / XAI / recommandation /
> seuil / données. Prototype académique **non certifié**, **open-loop strict**,
> **données 100 % synthétiques**. Phase 9 non démarrée.

## 1. Recadrage produit

| Couche | Rôle **avant** | Rôle **cible (post-8.5.1)** |
|--------|----------------|------------------------------|
| **Web** (`MedAICare_V.3_10Patients/`, port 5000) | Landing + login patient/clinicien, dashboards web | **Portail institutionnel** : présentation, posture, architecture, limites, accès mobile, documentation |
| **Mobile** (`mobile/`, port 5173, Expo Web) | App mobile | **Application principale** patient & clinicien (login, dashboards, données, risque, XAI, recommandations) |
| **Backend** (`backend/`, port 8000) | Source de vérité | Inchangé — **source de vérité** API / sécurité / ML / XAI / recommandations |

Le web **n'est plus** le point d'accès principal patient/clinicien. L'application
réelle est l'app **mobile**.

## 2. Pourquoi les changements UI n'étaient pas visibles (diagnostic 8.5.1)

- Le preview Replit **principal** est le workflow **« Start application »**
  (`MedAICare_V.3_10Patients`, **port 5000**, `externalPort 80`,
  `outputType = webview`). C'est l'**app web** qui s'affiche par défaut.
- Le workflow **« Mobile App »** (Expo Web, **port 5173**) a `outputType = console` :
  il n'apparaît **pas** dans le preview principal.
- Conséquence : les modifications de la Phase 8.5 (UI **mobile**) étaient bien
  livrées mais **invisibles** dans le preview principal, qui montrait l'app web.

**Correction 8.5.1 :** l'app web (port 5000) devient un **portail** qui présente
le projet et **renvoie explicitement vers l'app mobile** (port 5173). Le bon
rendu attendu est donc clair, quel que soit le port ouvert.

## 3. Comment ouvrir chaque preview

| Workflow | Port | Ce qu'on voit | Comment ouvrir |
|----------|------|---------------|----------------|
| **Start application** | 5000 | Portail web institutionnel | Preview principal (webview) |
| **Mobile App** | 5173 | App mobile Expo Web (patient/clinicien) | `https://<REPLIT_DEV_DOMAIN>:5173` (lien « Ouvrir l'app mobile » du portail) |
| **Backend API** | 8000 | API FastAPI (console) | `https://<REPLIT_DEV_DOMAIN>:8000/docs` |

Le portail construit le lien mobile dynamiquement à partir de l'hôte courant
(`window.location.hostname` + `:5173`), donc il reste valable quel que soit le
domaine de preview Replit.

## 4. Contenu du portail (`src/components/PortalPage.tsx`)

1. **Hero** — « MediAI Care » + sous-titre « Prototype académique IoMT + IA
   explicable pour le suivi du diabète » + badges **Données synthétiques /
   Open-loop / Non certifié** + CTA **« Ouvrir l'app mobile »**.
2. **Application mobile** — espaces patient & clinicien (décrits), instructions
   d'accès (Expo Web port 5173, limites device/QR/EAS sur Replit).
3. **Ce que démontre le prototype** — backend sécurisé, pipeline temporel, ML
   synthétique, XAI (support d'affichage), recommandations open-loop, mobile sécurisé.
4. **Limites** — pas d'usage clinique, pas de données réelles, pas un dispositif
   médical, pas de validation clinique, scores non transférables.
5. **Architecture & sécurité** — API = source de vérité, sécurité, audit + flux
   simple (Mobile → API → ML+XAI → PostgreSQL synthétique).
6. **Documentation / Soutenance** — pointeurs vers `docs/`.
7. **Footer** — version, posture, et lien secondaire **« Démo web (legacy) »**.

## 5. Login web : démotion (legacy)

- Le login web patient/clinicien **n'est plus** l'action principale.
- Il reste accessible **uniquement** via le lien secondaire **« Démo web
  (legacy) »** du footer du portail (`onNavigate('landing')`), clairement marqué.
- Après déconnexion, l'app revient au **portail** (et non à la page de login).
- Aucune fonctionnalité web n'a été supprimée : la démo web reste disponible pour
  la soutenance, mais **requalifiée** comme secondaire.

## 6. Garde-fous éditoriaux (aucune fausse revendication)

Le portail **n'affiche pas** : « validé cliniquement », certification (MDR, IEC
62304, ISO 13485, HDS), statistiques de performance non prouvées, ni promesse
clinique. Les seules métriques citées sont **techniques** (ex. hachage des mots de
passe) et la posture est répétée (synthétique / open-loop / non certifié).

## 7. Checklist de validation (manuelle, web)

- [x] Le portail **ne présente plus** le login patient/clinicien comme action principale.
- [x] Les **disclaimers** (synthétique, open-loop, non certifié, pas d'usage clinique) sont visibles.
- [x] Un **CTA mobile** (« Ouvrir l'app mobile ») est présent (hero + nav + section mobile).
- [x] Le **mobile** conserve son login et sépare patient/clinicien.
- [x] **Aucun texte web** ne prétend à une certification ou un usage clinique.
- [x] Le lien legacy de login est **secondaire** et marqué « legacy ».

## 8. Fichiers concernés

- **Créés :** `src/components/PortalPage.tsx`, `docs/web/WEB_PORTAL_STRATEGY.md`.
- **Modifiés :** `src/App.tsx` (route `portal` par défaut, logout → portal),
  `src/types/medical.ts` (ajout `'portal'` à `ViewMode`).
- **Inchangés :** `LandingPage.tsx`, `AuthModal`, dashboards web, backend, mobile métier.
