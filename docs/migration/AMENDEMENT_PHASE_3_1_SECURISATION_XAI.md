# Amendement Phase 3.1 — Sécurisation sémantique XAI avant recommandations

> **Statut : livré, à valider.** Amendement **obligatoire** demandé par le superviseur
> après validation technique de la Phase 3. Le passage à la **Phase 4 (moteur de
> recommandation thérapeutique)** reste **suspendu** jusqu'à validation de cet amendement.
>
> **Non-négociables tenus :** aucun réentraînement de modèle · aucune recommandation /
> décision / dose · aucune règle de décision · aucune couche mobile · aucune donnée réelle
> (synthétique uniquement, `is_synthetic=True`) · **open-loop strict** · tous les tests
> antérieurs restent verts.

---

## 1. Objectif

Encadrer l'usage **futur** des explications XAI afin qu'elles restent des **aides de
compréhension du modèle**, jamais des **justifications thérapeutiques**, et empêcher
qu'une recommandation future s'appuie sur une XAI peu congruente ou sémantiquement
ambiguë. La Phase 3.1 **qualifie** la fiabilité de chaque explication et **expose
explicitement** ses limites — elle ne « corrige » rien artificiellement.

## 2. Raison de l'amendement

La Phase 3, bien que techniquement validée, a révélé des **limites sémantiques** à
traiter **avant** tout moteur de recommandation :

- congruence physiologique heuristique **`hypo 30 = 0.000`** (modèle non congruent sur
  ce contrôle directionnel) ;
- directions globales parfois **contre-intuitives ou non directement interprétables**
  (issues d'une moyenne signée) ;
- explications portant sur le **modèle non calibré** alors que la probabilité affichée
  est **calibrée** ;
- risque qu'un futur moteur interprète **à tort** les attributions XAI comme une
  **causalité** ou une **justification clinique forte**.

Ces limites étaient honnêtement documentées en Phase 3 ; la Phase 3.1 les rend
**opérationnelles** dans l'API (statut + warnings non masquables) et dans la
documentation (garde-fou décisionnel).

## 3. Limites révélées par la Phase 3 (rappel)

| Couple | Méthode | Congruence physio. | Lecture |
|---|---|---|---|
| hypo 30 | EBM natif | **0.000** | non congruent → `not_reliable_for_clinical_interpretation` |
| hypo 60 | RF SHAP | ~0.77 | acceptable (contrôle technique) |
| hyper 30 | XGB SHAP | ~0.53 | limite → `caution_semantic_limits` |
| hyper 60 | XGB SHAP | ~0.53 | limite → `caution_semantic_limits` |

> Valeurs **réelles** recalculées et **embarquées** dans les artefacts globaux
> (`artifacts/xai/global/global-<target>-<horizon>.json`, champ `evaluation`). Jamais
> inventées : une métrique non calculable reste `None`.

## 4. Statut de fiabilité XAI

Module **pur** `backend/app/xai/reliability.py` → `assess(...)` renvoie :

- `xai_reliability_status` ∈ { `reliable_for_model_debug`, `caution_semantic_limits`,
  `not_reliable_for_clinical_interpretation` } (escalade **monotone**, jamais rétrogradée) ;
- `xai_warnings: list[str]` — **jamais masqués** ;
- `semantic_limitations: list[str]` — rappels permanents (dont le garde-fou décisionnel).

### Règles d'escalade (seuils dans le module)

| Signal | Effet |
|---|---|
| données synthétiques | warning **systématique** |
| explication sur **modèle non calibré** | warning **systématique** |
| repli **occlusion** (`method_fallback`) | warning + `caution_semantic_limits` |
| direction globale **non globalisable / indéterminée** | warning + `caution_semantic_limits` |
| **LIME** & stabilité `< 0.5` | warning + `caution_semantic_limits` |
| congruence physio. `< 0.5` | warning + `caution_semantic_limits` |
| congruence physio. `== 0.0` | `not_reliable_for_clinical_interpretation` |
| scénario canonique incohérent | warning + `caution_semantic_limits` |

Un signal **absent** (`None`) **n'escalade pas** (aucune fabrication).

## 5. Stratégie de warnings (non masquables)

Les warnings sont calculés **avant mise en cache** : un hit de cache porte **les mêmes**
warnings. Ils sont **persistés** (colonnes `xai_warnings`, `semantic_limitations`,
`xai_reliability_status`) pour traçabilité/audit. Notices systématiques ajoutées aux
réponses : `calibration_notice`, `synthetic_data_notice` (+ `direction_semantics` côté
global).

## 6. Traitement du cas `hypo 30` (congruence nulle)

- La métrique **n'est pas corrigée** : `physio_congruence = 0.000` est **conservée**.
- L'artefact global `hypo 30` est marqué
  **`xai_reliability_status = not_reliable_for_clinical_interpretation`** avec le warning :
  *« La congruence physiologique heuristique est faible (=0.000 < 0.5) ; cette explication
  doit être utilisée uniquement pour analyse technique du modèle, pas pour interprétation
  clinique. »*
- L'explication **native EBM n'est pas remplacée silencieusement** par une autre méthode.
  La stratégie reste : exposer le doute, pas le dissimuler. (La comparaison native ↔
  occlusion reste disponible via le fallback documenté `method_fallback`, jamais substituée
  en douce.)

## 7. Clarification des directions globales

On ne présente plus une direction « augmente/diminue » comme **vérité simple** :

- **EBM** (effet dépendant de la valeur) → `direction = not_globalizable`
  (« interpréter localement ») ;
- **SHAP** (contribution moyenne signée au score) → `direction = aggregated_signed_effect`,
  le **signe brut** étant conservé séparément à titre informatif (`aggregated_sign`).

Disclaimer permanent au niveau de l'artefact : `direction_semantics`. Les artefacts
globaux ont été **régénérés** en conséquence.

## 8. Tests de scénarios canoniques (synthétiques)

Contrôles de **cohérence sémantique** (PAS une validation clinique) :

- **Hypo** : glycémie basse + pente descendante + nuit → `P(hypo)` ne **baisse pas** vs un
  profil normal ; l'attribution contient **≥ 1 facteur glycémique plausible**.
- **Hyper** : glycémie haute + pente montante + post-prandial → `P(hyper)` ne **baisse pas**
  vs un profil normal ; ≥ 1 facteur plausible.

À défaut de cohérence → l'explication doit porter `caution_semantic_limits` (géré par le
module `reliability`). Ces tests vérifient seulement l'**absence d'explication
manifestement incohérente** sur scénarios synthétiques.

## 9. Interdiction d'usage décisionnel (garde-fou Phase 4)

Documenté et exposé dans chaque réponse (`semantic_limitations`) :

> **XAI is display/support only, not a decision engine.**

La XAI **ne décide pas**, **ne détermine pas** de recommandation, **ne justifie pas** de
dose. Si une future Phase 4 consomme des données XAI, ce doit être **uniquement** pour
affichage ou audit, **jamais** comme condition principale d'une décision thérapeutique —
**et** une XAI marquée `not_reliable_for_clinical_interpretation` ne doit en aucun cas
servir d'argument d'affichage clinique.

## 10. Impact sur la future Phase 4

- Tout consommateur XAI **doit lire `xai_reliability_status`** et **refuser** d'utiliser
  une explication `not_reliable_for_clinical_interpretation` comme appui d'interprétation.
- La séparation **probabilité calibrée** (affichée) ↔ **attribution non calibrée**
  (expliquée) doit être préservée et affichée.
- Les directions globales ne doivent **jamais** être présentées comme relations médicales
  monotones.

## 11. Fichiers ajoutés / modifiés

**Ajoutés**
- `backend/app/xai/reliability.py` — module pur de qualification sémantique.
- `backend/alembic/versions/f6a7b8c9d0e1_phase3_1_xai_reliability.py` — migration
  **additive** (3 colonnes), chaînée sur `e5f6a7b8c9d0`, idempotente (SQLite + PG).
- `docs/migration/AMENDEMENT_PHASE_3_1_SECURISATION_XAI.md` — ce document.

**Modifiés**
- `backend/app/xai/schemas.py` — nouveaux champs (local + global), vocabulaire de
  direction étendu, `aggregated_sign`, `evaluation`, `direction_semantics`.
- `backend/app/xai/global_explanations.py` — politique de direction, évaluation
  embarquée, fiabilité + notices.
- `backend/app/xai/service.py` — fiabilité locale (lit métriques du couple depuis
  l'artefact global), notices, calcul **avant cache**.
- `backend/app/xai/translation.py` — texte patient renforcé (anti-ambiguïté, non causal).
- `backend/app/models/xai_explanation.py` + `backend/app/repositories/xai_repo.py` —
  persistance des champs de fiabilité.
- `backend/tests/test_xai.py` — **+14 tests** Phase 3.1.

## 12. Changements API & nouveaux champs XAI

`POST /api/v1/xai/explain` (local) **et** `GET /api/v1/xai/global` exposent désormais :

```json
{
  "xai_reliability_status": "caution_semantic_limits",
  "xai_warnings": [
    "Explication calculée sur données 100 % synthétiques (is_synthetic=True). Aucune validité clinique ; résultats non transférables à des patients réels.",
    "L'attribution explique le modèle NON calibré (predict_proba interne), alors que la probabilité affichée est la probabilité CALIBRÉE du bundle. Les contributions ne portent donc pas sur la probabilité affichée.",
    "La direction globale de certaines variables n'est pas interprétable comme une relation causale (non globalisable / effet agrégé signé)."
  ],
  "semantic_limitations": [
    "XAI décrit le comportement du modèle, pas une cause médicale.",
    "Ne pas utiliser pour ajuster un traitement.",
    "XAI is display/support only, not a decision engine. ..."
  ],
  "calibration_notice": "...",
  "synthetic_data_notice": "..."
}
```

Le `GET /api/v1/xai/global` ajoute en plus `direction_semantics` et `evaluation`
(métriques réelles ou `None`).

## 13. Tests Phase 3.1 & sortie pytest

Couverture ajoutée : module `reliability` (synthétique, calibration, repli, direction,
LIME instable, **physio 0 → not_reliable**) · champs présents dans réponses **locale** et
**globale** · **cas hypo 30** marqué avec prudence · **scénarios canoniques** hypo/hyper ·
**XAI non décisionnelle** (aucun champ `dose/decision/recommendation/action`) · persistance
des champs de fiabilité · texte patient renforcé non causal · RBAC/ownership/audit
inchangés.

```text
$ cd backend && python -m pytest -q -p no:warnings
133 passed
```

(119 antérieurs + **14** Phase 3.1.)

## 14. Documentation mise à jour

- `docs/migration/PHASE_3_XAI_CLINIQUE.md` — section Phase 3.1 ajoutée.
- `backend/README.md` — champs de fiabilité + garde-fou décisionnel.
- `replit.md` — sous-section Phase 3.1.

## 15. Décision proposée pour la Phase 4

La Phase 4 (moteur de recommandation thérapeutique) peut être **envisagée** sous
conditions strictes : (a) lecture obligatoire de `xai_reliability_status` et **refus**
d'appui sur une explication `not_reliable_for_clinical_interpretation` ; (b) XAI =
**affichage/audit uniquement**, jamais condition principale de décision ; (c) maintien de
l'open-loop strict et des données synthétiques. **En attente de validation de cet
amendement avant tout démarrage.**
