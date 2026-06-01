Merci pour le rapport Phase 4.

Je valide la Phase 4 sur le plan technique, architectural et fonctionnel :

- moteur de recommandation open-loop ;
- suggestions uniquement `pending` ;
- validation clinicien obligatoire ;
- catégories non prescriptives ;
- safety layer défensive ;
- blocage des termes interdits et doses chiffrées ;
- workflow `pending → approved/rejected` et `pending → modified → approved/rejected` ;
- RBAC serveur ;
- patient limité aux recommandations approuvées ;
- audit systématique ;
- `is_synthetic=True` ;
- migration additive ;
- aucun réentraînement ML ;
- aucun mobile ;
- aucune donnée réelle ;
- tests verts par lots ;
- documentation produite.

Cependant, je ne valide pas encore le passage direct à la Phase 5.

Raison bloquante :
le rapport mentionne encore que la XAI fiable peut être “utilisée comme justification” et expose un champ de type `used_as_clinical_justification`.

Cela est incompatible avec la Phase 3.1, qui a explicitement établi que :

- la XAI n’est pas une justification clinique ;
- la XAI ne décide pas ;
- la XAI ne doit pas déterminer une recommandation ;
- la XAI peut seulement être affichée comme support de compréhension du modèle ou élément d’audit ;
- même fiable, la XAI reste une explication du comportement du modèle, pas une causalité médicale.

Je demande donc un amendement court obligatoire avant Phase 5 :

PHASE 4.1 — Verrouillage sémantique et source-of-truth du moteur de recommandation

Objectif :
Supprimer toute ambiguïté selon laquelle la XAI pourrait constituer une justification clinique, et verrouiller la source des probabilités utilisées par le moteur de recommandation.

Cette phase ne doit pas :
- modifier les modèles ML ;
- réentraîner ;
- modifier le benchmark ;
- créer de mobile ;
- introduire de données réelles ;
- produire de recommandation prescriptive.

## 1. Supprimer la notion de “justification clinique XAI”

Remplacer partout la sémantique :

- `used_as_clinical_justification`
- “XAI utilisée comme justification”
- “justification clinique”

par une terminologie non clinique :

- `xai_displayed_as_model_explanation`
- `xai_used_for_display`
- `xai_support_context`
- `xai_audit_context`
- `xai_clinical_justification_allowed = false`

Règle obligatoire :
même si `xai_reliability_status = reliable_for_model_debug`, la XAI ne peut jamais être marquée comme justification clinique.

Elle peut seulement être :

- affichée comme explication du modèle ;
- jointe au rationale technique ;
- utilisée comme contexte d’audit ;
- utilisée pour ajouter un warning si non fiable.

## 2. Règle de consommation XAI par le moteur

Documenter et implémenter clairement :

- la probabilité ML déclenche les règles de risque ;
- les règles expertes génèrent une suggestion pending ;
- la XAI enrichit l’explication affichée ;
- la XAI ne déclenche pas une recommandation thérapeutique ;
- la XAI ne justifie pas cliniquement la recommandation ;
- une XAI non fiable peut seulement ajouter un warning ou une suggestion de revue humaine.

Le cas `XAI_LOW_RELIABILITY` est acceptable uniquement comme garde-fou de prudence, pas comme recommandation clinique.

## 3. Verrouiller la source des probabilités

Clarifier et sécuriser `/api/v1/recommendations/generate`.

Le moteur ne doit pas accepter une probabilité arbitraire fournie par le client comme vérité.

Source acceptable :

Option A — recommandée :
- `prediction_id` obligatoire ou optionnel ;
- la probabilité est lue depuis la table `predictions`;
- la prediction doit appartenir au patient ;
- `is_synthetic=True`;
- modèle actif connu.

Option B :
- le backend appelle lui-même `ml.predict`;
- la probabilité est calculée côté serveur ;
- le client ne fournit que `patient_id`, `target`, `horizon_min`, `at`.

Interdit :
- accepter `probability` directement depuis le client sur un endpoint normal ;
- accepter `model_name`, `model_version`, `xai_status` depuis le client comme données de confiance.

Si un mode démo avec probabilités fabriquées existe :
- le réserver à la CLI `generate_demo`;
- ne pas l’exposer comme endpoint API normal ;
- le documenter explicitement comme démonstration non persistante.

## 4. Adapter le modèle de données / rationale

Dans `rationale`, remplacer tout champ ambigu.

Exemple attendu :

```json
{
  "xai": {
    "included": true,
    "usage": "model_explanation_display_only",
    "clinical_justification_allowed": false,
    "reliability_status": "caution_semantic_limits",
    "warnings": [],
    "limitations": [
      "XAI describes model behavior, not medical causality.",
      "XAI must not be used as a treatment justification."
    ]
  }
}

Si l’ancien champ used_as_clinical_justification existe déjà :

    soit le supprimer si possible sans casser ;
    soit le maintenir temporairement mais toujours à false, avec dépréciation documentée ;
    ne jamais le mettre à true.

## 5. Renforcer les tests safety/XAI

Ajouter ou modifier les tests pour garantir :

    aucun champ used_as_clinical_justification=true ;
    aucun message ne contient “justification clinique” ;
    XAI fiable → affichage comme explication du modèle uniquement ;
    XAI non fiable → warning/revue humaine, jamais justification ;
    génération via endpoint n’accepte pas de probabilité client non fiable ;
    génération par prediction_id vérifie ownership et is_synthetic=True;
    patient ne peut pas générer ;
    clinicien peut générer à partir d’une prediction valide ;
    tentative de spoof probability → rejet 400/422 ou champ ignoré ;
    CLI generate_demo reste non persistante ;
    tous les tests antérieurs restent verts.

## 6. Safety layer — précision importante

Vérifier que la safety layer :

    bloque bien les instructions prescriptives ;
    bloque les doses ;
    bloque les formulations d’action thérapeutique ;
    mais n’empêche pas les disclaimers négatifs du type :
        “Ne modifiez jamais votre traitement sans avis médical.”

Ajouter un test de non-régression :

    “Ne modifiez jamais votre traitement sans avis médical” doit être autorisé comme disclaimer ;
    “Modifiez votre traitement” doit être bloqué comme instruction.

## 7. Documentation

Créer :

docs/migration/AMENDEMENT_PHASE_4_1_VERROUILLAGE_RECOMMANDATION.md

Inclure :

    raison de l’amendement ;
    suppression de la notion de justification clinique XAI ;
    nouvelle terminologie ;
    source-of-truth des probabilités ;
    règles de consommation XAI ;
    exemples JSON avant/après ;
    tests ajoutés ;
    limites ;
    impact sur Phase 5.

Mettre à jour :

    docs/migration/PHASE_4_RECOMMENDATION_ENGINE.md;
    backend/README.md;
    replit.md;
    OpenAPI si le schéma change.

## 8. Livrable attendu Phase 4.1

Fournir un amendement court avec :

    fichiers modifiés ;
    champs renommés ou dépréciés ;
    nouvelle structure rationale.xai;
    comportement de /recommendations/generate;
    source-of-truth des probabilités ;
    tests ajoutés ;
    sortie pytest ou sortie des lots de tests ;
    confirmation qu’aucune XAI n’est utilisée comme justification clinique ;
    confirmation que la CLI démo ne persiste rien ;
    décision proposée pour Phase 5.

Conclusion :
Phase 4 est validée techniquement, mais le passage à Phase 5 reste suspendu jusqu’à la Phase 4.1, afin d’éliminer toute ambiguïté entre support explicatif XAI et justification clinique.