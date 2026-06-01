# MediAI Care — Contrats API pour un futur client mobile (PRÉPARATION SEULEMENT)

> **Aucun mobile n'est implémenté ni prévu dans ce périmètre.** Ce document
> *prépare* la consommation de l'API v1 par un éventuel client mobile, sans écrire
> de code mobile, conformément au cadre Phase 5 (« préparer, ne pas implémenter »).
> Prototype non certifié · open-loop · données synthétiques.

## Ce qui rend l'API déjà « mobile-ready »
- **REST/JSON** stable sous `/api/v1`, documenté (`/openapi.json`, `/docs`).
- **Auth standard** : JWT Bearer (access court) + **refresh opaque** (rotation + détection de réutilisation) → adapté au stockage sécurisé mobile (Keychain/Keystore).
- **RBAC + ownership serveur** : un client mobile ne peut pas contourner les droits côté app.
- **CORS par environnement** (pas de `*`), **headers de sécurité**, **rate limiting**.
- **Contrats d'erreur** documentés (`docs/api/ERROR_CATALOG.md`).

## Parcours type (patient mobile)
1. `POST /auth/login` → `{access_token, refresh_token}`. Stocker le refresh en stockage sécurisé.
2. `Authorization: Bearer <access>` sur chaque appel ; sur 401, `POST /auth/refresh`.
3. `GET /patients/me` → profil.
4. `POST /timeseries/cgm|insulin|meals|activity` → ingestion idempotente (201/200).
5. `POST /ml/predict` (son propre dossier) → **probabilité uniquement** (open-loop).
6. `GET /recommendations/mine` → suggestions **approuvées** par un clinicien (jamais auto-appliquées).

## Parcours type (clinicien mobile)
1. Login → `GET /patients` (cohorte).
2. `POST /ml/predict` / `POST /xai/explain` avec `patient_id`.
3. `GET /xai/global` (lecture globale).
4. `POST /recommendations/generate` → revue → `approve|reject|modify`.

## Contraintes à respecter côté futur client
- **Open-loop strict** : afficher probabilités/suggestions, **jamais** déclencher de dose/action automatique.
- **XAI = affichage/audit** : présenter comme « le modèle a pondéré… », jamais « la cause est… » ; ne pas utiliser la XAI comme justification clinique.
- **Validation clinicien obligatoire** : un patient ne voit que les recommandations approuvées.
- **Données synthétiques** : bannières honnêtes ; ne pas suggérer un usage clinique réel.
- **Refresh sécurisé** : sur réutilisation détectée, toutes les sessions sont révoquées → re-login.

## Recommandations d'évolution (non bloquantes, Phase 6+)
- Enveloppe d'erreur uniforme (`docs/api/ERROR_CATALOG.md`) pour simplifier le parsing mobile.
- Versionnement explicite des schémas pour la rétro-compatibilité d'app.
- Rate limit par-utilisateur derrière proxy de confiance.
- Pagination par curseur sur les séries volumineuses.

> Hors-scope explicite : Expo/React Native, push notifications, build mobile, store. Rien de tout cela n'est livré.
