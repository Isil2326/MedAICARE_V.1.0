Merci pour le rapport Phase 2 complet.

Je valide la Phase 2 sur le plan technique, architectural et méthodologique :

- package ML structuré ;
- anti-leakage by design ;
- labels construits correctement dans le futur `(T, T+h]` ;
- features strictement passées `ts <= T` ;
- split temporel non aléatoire ;
- métriques réellement calculées ;
- aucune métrique inventée ;
- gestion honnête des classes absentes ;
- calibration conditionnelle ;
- EBM opérationnel ;
- registre modèle JSON + DB ;
- endpoint ML open-loop ;
- RBAC + ownership + audit ;
- persistance optionnelle dans `predictions` avec `is_synthetic=True` ;
- 92 tests verts ;
- documentation claire ;
- limites scientifiques correctement assumées.

Cependant, je ne valide pas encore le passage direct à la Phase 3 — XAI clinique.

Raison scientifique bloquante :
les segments de test pour `hypo 30` et `hypo 60` sont mono-classe, avec 0 positif. Les métriques principales ne sont donc pas calculables. C’est honnêtement rapporté, mais cela signifie que les modèles hypo ne peuvent pas encore être considérés comme évalués, même dans le cadre synthétique.

Or la Phase 3 XAI expliquerait les décisions de modèles. Il serait méthodologiquement fragile de produire des explications cliniques pour des modèles hypo dont le comportement test n’a pas été évalué sur des cas positifs.

Je demande donc une phase intermédiaire obligatoire :

## PHASE 2.1 — Remédiation scientifique du benchmark synthétique

Objectif :
Renforcer le benchmark synthétique afin que les quatre tâches soient évaluables sur le jeu de test :

- hypo 30 min ;
- hypo 60 min ;
- hyper 30 min ;
- hyper 60 min.

Cette phase ne doit pas introduire de données réelles, ne doit pas inventer de métriques, ne doit pas produire de XAI clinique, et ne doit pas changer la posture open-loop.

Périmètre attendu Phase 2.1 :

## 1. Dataset synthétique v2

Étendre le seed synthétique pour produire un benchmark plus robuste.

Exigences minimales :

- au moins 7 à 14 jours de données synthétiques ;
- idéalement 8 à 12 profils patients synthétiques ;
- profils variés :
  - stable ;
  - hypo-prone ;
  - hyper-prone ;
  - post-prandial hyper ;
  - nocturnal hypo ;
  - high variability ;
  - sparse CGM / gaps ;
  - insulin-sensitive ;
- CGM régulier ;
- repas ;
- insuline ;
- activité ;
- épisodes hypo et hyper répartis dans train, validation et test ;
- toutes les lignes doivent rester `is_synthetic=True`.

Important :
la génération peut être scénarisée, mais elle doit être documentée comme synthétique. Elle ne doit jamais être présentée comme représentative de patients réels.

## 2. Garantie de classes positives dans le test

Le nouveau dataset doit permettre d’évaluer les 4 couples.

Critère minimal :

Pour chaque couple `(target, horizon)` :

- le train contient au moins une classe positive et une classe négative ;
- la validation contient au moins une classe positive et une classe négative ;
- le test contient au moins une classe positive et une classe négative.

Critère recommandé :

- au moins 10 positifs dans le test pour chaque couple ;
- ou, si impossible, expliquer clairement pourquoi et ne pas activer le modèle correspondant.

Si un couple reste mono-classe en test :
- ses métriques restent `null`;
- le modèle ne doit pas être marqué comme pleinement évalué ;
- le registre doit refléter ce statut.

## 3. Pas de fuite par scénario

Si les profils synthétiques sont scénarisés, ne pas introduire de variable fuiteuse dans les features.

Interdits :
- utiliser directement `profile_type`;
- utiliser un flag explicite `hypo_prone` ou `hyper_prone` comme feature ;
- utiliser un identifiant patient qui encode indirectement le risque ;
- utiliser une variable de scénario non disponible en conditions réelles.

Ajouter un test ou une vérification :
- les colonnes de features ne contiennent aucun champ de scénario ;
- seules les features physiologiques/temporelles prévues sont utilisées.

## 4. Split temporel renforcé

Conserver un split chronologique strict.

Exigences :

- train = passé ;
- validation = période intermédiaire ;
- test = futur ;
- aucun timestamp partagé entre splits ;
- aucune feature ne lit après `T`;
- les événements positifs doivent être présents naturellement dans chaque période par conception du seed, pas par fuite de label.

Documenter :
- périodes train/validation/test ;
- nombre de lignes par split ;
- taux de positifs par split ;
- vérification anti-leakage.

## 5. Réentraînement complet

Relancer le pipeline complet :

```bash
cd backend && python -m app.seed
cd backend && python -m app.ml.build_dataset
cd backend && python -m app.ml.train
cd backend && python -m app.ml.evaluate
cd backend && python -m pytest -q

Adapter les commandes si nécessaire, mais documenter les commandes exactes.

Réentraîner les 4 couples :

    hypo 30 ;
    hypo 60 ;
    hyper 30 ;
    hyper 60.

## 6. Métriques recalculées

Pour chaque couple, fournir :

    modèle sélectionné ;
    taille train/validation/test ;
    taux de positifs train/validation/test ;
    AUROC ;
    AUPRC ;
    précision ;
    rappel / sensibilité ;
    spécificité ;
    F1 ;
    Brier Score ;
    ECE ;
    matrice de confusion ;
    calibration appliquée ou non ;
    justification du choix du modèle actif.

Toutes les métriques doivent être issues du calcul réel.

Aucune valeur ne doit être inventée.

## 7. Intervalles d’incertitude

Ajouter si possible une estimation simple d’incertitude sur les métriques principales.

Option recommandée :

    bootstrap sur le test, par exemple 100 ou 200 répétitions si compatible Replit.

À appliquer au minimum à :

    AUROC ;
    AUPRC ;
    F1 ;
    Brier Score.

Si le bootstrap est trop coûteux :

    documenter la limite ;
    fournir au minimum une note sur la variance attendue du petit dataset.

## 8. Registre modèle renforcé

Ajouter ou documenter un champ de statut d’évaluation, par exemple :

    evaluation_status :
        evaluated;
        not_evaluable_mono_class_test;
        insufficient_test_positives;
        candidate_only.

Règle :
un modèle ne peut être active que si son couple (target, horizon) est évaluable sur le test, sauf justification explicitement documentée.

Le registre doit continuer à garantir :

    un seul modèle actif par (target, horizon);
    synthetic_only=True;
    dataset_version ;
    features_version ;
    metrics ;
    artifact_path.

Mettre à jour dataset_version vers une nouvelle version, par exemple 1.1.0, si la définition du dataset ou du seed change significativement.

## 9. Endpoint ML

Vérifier que l’endpoint /api/v1/ml/predict continue de fonctionner après réentraînement.

Tests attendus :

    patient propriétaire : 200 ;
    patient non propriétaire : 403 ;
    clinicien avec patient_id : 200 ;
    clinicien sans patient_id : 400 ;
    non authentifié : 401 ;
    horizon invalide : 400 ;
    persist=true : écrit predictions avec is_synthetic=True;
    audit créé.

La réponse doit rester open-loop :

    probabilité ;
    risque indicatif ;
    modèle ;
    version ;
    notice open-loop ;
    aucun conseil thérapeutique ;
    aucune dose ;
    aucune notification automatique.

## 10. Tests Phase 2.1

Ajouter ou mettre à jour des tests pour :

    seed synthétique v2 ;
    présence de positifs/négatifs dans train/validation/test pour les 4 couples ;
    absence de colonnes scénario dans les features ;
    split temporel sans overlap ;
    anti-leakage features ;
    génération dataset v2 ;
    registry evaluation_status;
    modèle actif uniquement si évaluable ;
    endpoint ML après réentraînement.

Tous les tests existants Phase 0, 0.1, 1 et 2 doivent rester verts.

## 11. Documentation Phase 2.1

Créer :

docs/migration/AMENDEMENT_PHASE_2_1_BENCHMARK_SYNTHETIQUE.md

Inclure :

    objectif ;
    raison de l’amendement ;
    problème du test mono-classe hypo ;
    stratégie dataset synthétique v2 ;
    profils synthétiques ;
    split temporel ;
    distribution des classes ;
    métriques recalculées ;
    limites scientifiques ;
    statut des modèles ;
    commandes ;
    tests ;
    conclusion.

Mettre à jour si nécessaire :

    docs/migration/PHASE_2_MODELISATION_ML.md;
    backend/README.md;
    replit.md.

## 12. Livrable final Phase 2.1 attendu

À la fin, fournir un rapport avec :

    fichiers ajoutés/modifiés ;
    changements du seed ;
    nouvelle fenêtre temporelle ;
    nombre de patients synthétiques ;
    taille dataset ;
    distribution train/val/test ;
    taux de positifs par couple ;
    modèles réentraînés ;
    métriques réelles recalculées ;
    calibration ;
    statut registry ;
    endpoint ML vérifié ;
    sortie pytest ;
    limites scientifiques ;
    décision proposée pour passage Phase 3.

Ne pas démarrer la Phase 3 tant que ce rapport Phase 2.1 n’est pas validé.

Conclusion :
Phase 2 est validée techniquement, mais la clôture scientifique de la modélisation nécessite cette Phase 2.1, afin d’éviter de construire une XAI clinique sur des modèles hypo non évaluables.