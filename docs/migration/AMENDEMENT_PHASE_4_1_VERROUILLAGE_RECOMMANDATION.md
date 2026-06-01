# Amendement Phase 4.1 — Verrouillage sémantique & source-of-truth du moteur de recommandation

> Prototype de thèse · **non certifié** · **données 100 % synthétiques** (`is_synthetic=True`) ·
> **open-loop strict** · **aucune dose / décision / action automatique**. Amendement **obligatoire**
> demandé par le superviseur **avant** la Phase 5. Aucun réentraînement, aucun nouveau modèle,
> aucune modification du benchmark, aucun mobile, aucune donnée réelle, aucune recommandation
> prescriptive.

---

## 1. Raison de l'amendement

La Phase 4 a été **validée techniquement, architecturalement et fonctionnellement**. Un point
**bloquant** subsistait néanmoins : le rapport et le code laissaient entendre qu'une **XAI fiable
pouvait être « utilisée comme justification »** (champ `used_as_clinical_justification`,
formulation « justification clinique »).

C'est **incompatible avec la Phase 3.1**, qui a explicitement établi que la XAI :

- **n'est pas** une justification clinique ;
- **ne décide pas** et **ne détermine pas** une recommandation ;
- ne peut être qu'**affichée** comme support de compréhension du modèle ou élément d'**audit** ;
- **même fiable**, reste une explication du **comportement du modèle**, pas une **causalité
  médicale**.

La Phase 4.1 supprime cette ambiguïté et verrouille la **source des probabilités** consommées par
le moteur.

## 2. Suppression de la notion de « justification clinique XAI »

**Verrou central** : même si `xai_reliability_status == reliable_for_model_debug`, la XAI **ne peut
jamais** être marquée comme justification clinique. Elle peut uniquement :

- être **affichée** comme explication du modèle ;
- être **jointe** au rationale technique (audit) ;
- **ajouter un avertissement** ou un **renvoi en revue humaine** si elle est non fiable.

### Terminologie — avant → après

| Avant (Phase 4) | Après (Phase 4.1) |
|---|---|
| `used_as_clinical_justification: bool` | **supprimé** du bloc `rationale.xai` |
| (implicite : fiable ⇒ justification) | `clinical_justification_allowed: false` (toujours) |
| — | `usage: "model_explanation_display_only"` \| `"not_available"` |
| `available` | `included` |
| « XAI utilisée comme justification clinique » | « XAI affichée comme explication du modèle uniquement » |

Le champ legacy `used_as_clinical_justification` n'est **plus émis**. La couche `safety` ajoute en
plus un garde-fou **strict** : tout bloc `rationale.xai` présent **doit** porter explicitement
`clinical_justification_allowed == false` (jamais absent, jamais `true`), sinon la recommandation
est **bloquée** (`xai_clinical_justification_not_allowed`) ; l'ancien
`used_as_clinical_justification == true` est également bloqué
(`xai_legacy_clinical_justification_flag_true`).

## 3. Règle de consommation de la XAI par le moteur

1. La **probabilité ML** (modèle actif Phase 2.1) déclenche les **règles de risque**.
2. Les **règles expertes** génèrent une **suggestion `pending`** (jamais une décision).
3. La **XAI enrichit** l'explication **affichée** (top-features = contribution au score, jamais une
   cause).
4. La XAI **ne déclenche pas** de recommandation thérapeutique et **ne justifie pas** cliniquement
   une recommandation.
5. Une **XAI non fiable** peut seulement **ajouter un avertissement** ou une **suggestion de revue
   humaine**.

Le cas `XAI_LOW_RELIABILITY` reste accepté **uniquement comme garde-fou de prudence**
(renvoi `CLINICAL_REFERRAL`), **jamais** comme recommandation clinique. Il **s'ajoute** à la règle
de risque fondée sur la probabilité, sans la remplacer.

## 4. Verrouillage de la source des probabilités (source-of-truth)

`POST /api/v1/recommendations/generate` n'accepte **jamais** une probabilité fournie par le client
comme vérité. Sources **autorisées** :

- **Option A (par défaut)** — `prediction_id` : la probabilité est **lue depuis la table
  `predictions`**. La prédiction doit **appartenir au patient** ciblé **et** être **synthétique**
  (`is_synthetic=True`) — sinon `400`.
- **Option B** — sans `prediction_id` : le backend appelle lui-même `ml.predict` (probabilité
  **calculée côté serveur**). Le client ne fournit que `patient_id`, `target`, `horizon_min`, `at`.

**Interdit / neutralisé** : le schéma `GenerateRequest` est désormais `extra="forbid"`. Toute
tentative d'injecter `probability`, `model_name`, `model_version`, `xai_status`, etc. est
**rejetée en `422`**. Le mode à probabilités fabriquées existe **uniquement** dans la CLI
`generate_demo` (démonstration **non persistante**, jamais exposée comme endpoint).

## 5. Structure `rationale.xai` — avant / après

**Avant (Phase 4) :**

```json
{
  "xai": {
    "available": true,
    "reliability_status": "reliable_for_model_debug",
    "used_as_clinical_justification": true,
    "principal_features": [{ "feature": "cgm_slope_30", "contribution": -0.41 }],
    "warnings": []
  }
}
```

**Après (Phase 4.1) :**

```json
{
  "xai": {
    "included": true,
    "usage": "model_explanation_display_only",
    "clinical_justification_allowed": false,
    "reliability_status": "reliable_for_model_debug",
    "principal_features": [{ "feature": "cgm_slope_30", "contribution": -0.41 }],
    "warnings": [],
    "limitations": [
      "XAI describes model behavior, not medical causality.",
      "XAI must not be used as a treatment justification."
    ]
  }
}
```

`clinical_justification_allowed` reste `false` **quelle que soit** la fiabilité (y compris
`reliable_for_model_debug`).

## 6. Fichiers modifiés

| Fichier | Modification |
|---|---|
| `backend/app/recommendations/utils.py` | nouvelle structure `rationale.xai` ; suppression du paramètre `clinical_justification` ; `clinical_justification_allowed=False` constant |
| `backend/app/recommendations/engine.py` | suppression de la logique `clinical_just` ; XAI = affichage/audit quelle que soit la fiabilité ; avertissement reformulé |
| `backend/app/recommendations/templates.py` | message clinicien `xai_low_reliability` reformulé (support de compréhension, jamais justification) |
| `backend/app/recommendations/safety.py` | invariant : `clinical_justification_allowed` ne doit jamais être `true` (+ garde sur l'ancien flag) |
| `backend/app/recommendations/service.py` | `prediction_id` → exige `is_synthetic=True` (sinon `400`) ; `is_synthetic` porté dans la prédiction normalisée |
| `backend/app/schemas/recommendation.py` | `GenerateRequest` passe en `extra="forbid"` (spoof `probability`/`model_name`/`xai_status` → `422`) |
| `backend/tests/test_recommendations_engine.py` | tests adaptés + ajoutés (voir §7) |

## 7. Tests ajoutés / modifiés

- `test_xai_not_reliable_adds_referral_and_never_clinical_justification` — `clinical_justification_allowed=False`, ancien champ absent ;
- `test_xai_reliable_is_display_only_never_justification` — XAI **fiable** ⇒ affichage uniquement, jamais justification ;
- `test_no_candidate_ever_allows_clinical_justification` — **invariant** sur toutes les combinaisons (fiable/caution/non fiable/absente) ;
- `test_safety_allows_negative_disclaimer_but_blocks_instruction` — « Ne modifiez jamais votre traitement sans avis médical » **autorisé** ; « Modifiez votre traitement » **bloqué** ;
- `test_safety_blocks_explicit_clinical_justification_flag` — l'invariant safety rejette toute reco marquée justification ;
- `test_generate_rejects_client_supplied_probability` — spoof `probability` → `422` ;
- `test_generate_rejects_client_supplied_model_fields` — spoof `model_name`/`xai_status` → `422` ;
- `test_generate_rejects_non_synthetic_prediction` — prédiction non synthétique → `400`.

**Résultat : 158 tests verts** (152 antérieurs + 6 nets), exécutés par lots (limite mémoire de
l'environnement avec les workflows ML/XAI actifs) :

```
tests/test_recommendations_engine.py + tests/test_rbac.py      → 31 passed
tests (hors ml_pipeline/xai/recommendations/rbac)              → 81 passed
tests/test_ml_pipeline.py + tests/test_xai.py                  → 46 passed
collect-only TOTAL                                             → 158
```

La CLI `python -m app.recommendations.generate_demo` reste **non persistante** (n'écrit rien en
base) et illustre la nouvelle formulation (« explication du modèle uniquement, jamais une
justification clinique »).

## 8. Limites assumées

- Seuils de probabilité = **choix de prototype synthétique**, non validés cliniquement.
- Scores d'actionnabilité = **heuristiques** de priorisation/documentation, jamais une décision.
- Aucune validation clinique des messages ni des règles.
- La XAI reste un **support** d'affichage/audit : aucune causalité, aucune décision.

## 9. Confirmations explicites

- ✅ **Aucune** XAI utilisée comme justification clinique (`clinical_justification_allowed=false`
  partout, même fiable) ; champ legacy supprimé et gardé `false` par la safety.
- ✅ La probabilité provient **uniquement** d'une prédiction synthétique en base ou de `ml.predict`
  serveur ; **aucune** probabilité/`model_name`/`xai_status` acceptée du client (`422`).
- ✅ Prédiction **non synthétique** refusée (`400`).
- ✅ La CLI `generate_demo` **ne persiste rien**.
- ✅ Disclaimer négatif autorisé ; instruction thérapeutique bloquée.
- ✅ Aucun réentraînement, aucun nouveau modèle, aucune donnée réelle, aucun mobile.
- ✅ Tous les tests antérieurs restent verts (158 au total).

## 10. Impact sur la Phase 5 / décision proposée

La Phase 4.1 lève le point bloquant : l'ambiguïté entre **support explicatif XAI** et
**justification clinique** est éliminée, et la **source des probabilités** est verrouillée. Le
moteur reste **open-loop strict** et **non prescriptif**.

**Décision proposée** : sous réserve de validation de cet amendement par le superviseur, la
**Phase 5** pourra démarrer en conservant les mêmes non-négociables (open-loop strict, synthétique
uniquement, XAI support only, pas de mobile, pas de réentraînement). **Phase 5 NON démarrée** —
en attente de validation.
