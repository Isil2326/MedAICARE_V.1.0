# MediAI Care — Politique de données synthétiques

> Prototype non certifié · open-loop. Phase 5.

## Principe fondamental
**Aucune donnée de patient réel.** Toutes les données manipulées sont **générées
synthétiquement** et marquées `is_synthetic=True` en base. C'est un invariant de sécurité
et d'éthique, pas une option de configuration.

## Origine des données
- **Générateur** : `backend/app/seed*.py` (dont `seed_timeseries.py`, dataset synthétique v2).
- **Dataset v2** : 10 profils scénarisés (stable×2, hypo_prone, hyper_prone, post_prandial_hyper,
  nocturnal_hypo, high_variability, sparse_cgm, insulin_sensitive, mixed), 14 jours, CGM 5 min,
  épisodes hypo(<70)/hyper(>180) quotidiens. `DATASET_VERSION=1.1.0`.
- **Anti-fuite** : la clé de scénario pilote la **génération**, jamais une **feature**.

## Marquage et propagation
- Tout enregistrement persisté (séries, prédictions, explications, recommandations) porte `is_synthetic=True`.
- Les réponses ML/XAI/recommandations incluent une **notice explicite** (open-loop + données synthétiques).
- La génération de recommandations **refuse** une prédiction source non synthétique (`prediction_id` non `is_synthetic` → 400).

## Conséquences sur l'interprétation
- **Scores volontairement élevés** (benchmark scénarisé séparable) = cohérence du **pipeline**,
  **non transférable** à une performance clinique réelle.
- Aucune métrique inventée : non calculable → `null` (jamais fabriquée).
- La congruence physiologique XAI est **heuristique**, **pas** une validation clinique.

## Interdits
- Importer, coller ou ingérer des données issues de patients réels.
- Retirer ou falsifier le marqueur `is_synthetic`.
- Présenter les résultats comme cliniquement valides.

## Vérification
- Tests de non-régression sur `is_synthetic` et sur l'absence de secrets dans l'audit.
- `python scripts/validate_backend.py` rappelle la posture synthétique/open-loop dans l'OpenAPI.
