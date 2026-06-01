# Walkthrough des écrans — application mobile MediAI Care

> **Phase 7 — documentation visuelle.** Capture d'écran automatisée d'Expo Web
> indisponible dans l'environnement Replit (l'outil de capture cible l'app React du
> port 5000, pas Expo Web 5173). Cette documentation décrit donc **textuellement** la
> structure de chaque écran. Des captures manuelles peuvent être déposées sous
> `docs/demo/screenshots/` (optionnel).
>
> Tous les écrans portent une bannière conformité (synthétique / non certifié /
> open-loop) et n'affichent **jamais** de dose ni d'instruction thérapeutique.

Routes : `expo-router` file-based sous `mobile/src/app/`.

---

## 1. Login — `app/login.tsx` (public)
- En-tête : logo + nom du produit + sous-titre.
- Bannière conformité (prototype académique, données simulées, non certifié).
- Formulaire : champ e-mail, champ mot de passe (masqué), bouton **Se connecter**.
- Note : inscription clinicien désactivée **dans l'app mobile de démo** (pas de flux
  exposé ; l'endpoint backend existe toujours).
- États : chargement (bouton `busy`), erreur (message FR non technique).
- API : `POST /auth/login` → `GET /auth/me`.

## 2. Aiguillage racine — `app/index.tsx`
- Aucun rendu visible durable : redirige selon `status`/`role`
  (non authentifié → Login ; patient → `(patient)` ; clinicien/admin → `(clinician)`).

---

## Espace PATIENT — groupe `app/(patient)/`

## 3. Accueil patient — `(patient)/index.tsx`
- Salutation + identité courte.
- Carte « dernière glycémie (CGM) » (valeur + horodatage, badge synthétique).
- Indicateur d'état réseau/API (bannière hors-ligne si applicable).
- Accès rapides vers Données / Risque / XAI / Recommandations.
- API : `GET /patients/me`, `GET /timeseries/cgm`.

## 4. Données patient — `(patient)/data.tsx`
- Onglets/sections : CGM · Insuline · Repas · Activité.
- Listes horodatées (valeurs, unités), badges « données simulées ».
- États vides/chargement/erreur dédiés.
- API : `GET /timeseries/{cgm,insulin,meals,activity}`.

## 5. Risque patient — `(patient)/risk.tsx`
- Sélecteur cible (hypo/hyper) + horizon (30/60 min).
- Résultat : **probabilité** + cible + horizon + modèle utilisé.
- `open_loop_notice` explicite + mention `is_synthetic`.
- **Aucun** conseil/dose : uniquement une estimation probabiliste.
- API : `POST /ml/predict`.

## 6. XAI patient — `(patient)/xai.tsx`
- Liste des principales variables pondérées par le modèle (top features).
- Bloc fiabilité : `xai_reliability_status`, `xai_warnings`, `semantic_limitations`.
- **Alerte visuelle forte** (bordure épaisse + préfixe ⚠) si
  `not_reliable_for_clinical_interpretation`.
- Texte patient non causal (« Le modèle a surtout utilisé… ») + disclaimer.
- API : `POST /xai/explain`.

## 7. Recommandations patient — `(patient)/recommendations.tsx`
- **Uniquement** les recommandations `approved`.
- Carte : catégorie (non prescriptive), message, rappel open-loop + validation humaine,
  disclaimer « Ne modifiez jamais votre traitement sans avis médical ».
- État vide explicite si aucune reco approuvée.
- API : `GET /recommendations/mine`.

## 8. Profil patient — `(patient)/profile.tsx`
- Identité + rappels de conformité.
- Bouton **Déconnexion** (efface les secrets).
- API : `GET /patients/me`, `POST /auth/logout`.

---

## Espace CLINICIEN — groupe `app/(clinician)/`

## 9. Patients (cohorte) — `(clinician)/index.tsx`
- Liste de cartes patients + recherche.
- Badges synthétiques ; accès au détail au clic.
- API : `GET /patients`.

## 10. Détail patient — `app/patient-detail.tsx` (gardé clinicien/admin)
- Profil + séries temporelles du patient ciblé.
- Section estimation (`POST /ml/predict`, `patient_id`).
- Section XAI locale (`POST /xai/explain`).
- Génération de recommandation (`POST /recommendations/generate` → `pending`).
- Liste des recommandations du patient + actions (modifier/approuver/rejeter).
- API : `GET /patients/{id}`, `GET /timeseries/*`, `POST /ml/predict`,
  `POST /xai/explain`, `GET`/`POST /recommendations/*`.

## 11. Recommandations clinicien — `(clinician)/recommendations.tsx`
- File de validation : filtres par statut (`pending`/`approved`/`rejected`/`modified`).
- Actions : générer, modifier (safety revalidée), approuver, rejeter.
- Rappel open-loop + validation humaine obligatoire.
- API : `GET /recommendations`, actions `approve`/`reject`/`modify`/`generate`.

## 12. XAI clinicien (global) — `(clinician)/xai.tsx`
- Importance globale des variables (agrégée, sans donnée patient).
- Fiabilité / warnings / limites ; sémantique de direction clarifiée (EBM
  non globalisable, SHAP effet signé agrégé).
- API : `GET /xai/global`.

## 13. Profil clinicien — `(clinician)/profile.tsx`
- Compte + rappels de conformité + **Déconnexion**.
- API : `POST /auth/logout`.

---

## Captures d'écran
- **Statut** : non générées automatiquement (limite Replit/Expo Web ci-dessus).
- **Procédure manuelle** : depuis le preview Expo Web (port 5173), capturer chaque
  écran ci-dessus et déposer les fichiers sous `docs/demo/screenshots/` en suivant la
  numérotation (`01-login.png`, `03-patient-home.png`, …). Le dossier existe et est
  prêt à recevoir les images.
