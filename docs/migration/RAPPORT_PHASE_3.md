# Rapport Phase 3 — XAI Clinique (version complète)

> Prototype de thèse · **non certifié** · **données 100 % synthétiques** (`is_synthetic=True`) ·
> **open-loop strict** · **XAI ≠ causalité** · **aucune métrique inventée** (`value=None` si non
> calculable). La Phase 3 **explique** les prédictions de la Phase 2.1 ; elle ne produit **aucune
> dose, aucune décision, aucune recommandation, aucune action automatique**. À valider avant tout
> démarrage de la **Phase 4 (moteur de recommandation thérapeutique)**.
>
> **Exécution de référence** : réentraînement live Phase 2.1 (dataset synthétique v2, 11 patients,
> fenêtre **2026-05-18 → 2026-06-01 UTC**), 4 couples actifs/évalués. Toutes les valeurs ci-dessous
> sont **réelles** (issues de `artifacts/xai/global/*.json` après `python -m app.xai.generate_global`
> et de `python -m app.xai.evaluate`) et **régénérables**. Elles n'ont **aucune** portée clinique.

---

## 1. Synthèse en 16 points

1. **Périmètre tenu.** Couche d'explicabilité **exploitable, testable, documentée** pour les 4
   modèles actifs (hypo/hyper × 30/60). Sortie = **attributions de features** uniquement ; aucun
   champ de décision/dose nulle part.
2. **Open-loop strict respecté.** Aucune recommandation, aucune dose, aucune notification
   automatique. Toute réponse porte un `open_loop_notice` explicite.
3. **Package `backend/app/xai/`** complet : `schemas`, `utils`, `cache`, `shap_explainer`,
   `lime_explainer`, `ebm_explainer`, `global_explanations`, `local_explanations`, `translation`,
   `evaluation`, `service`, + 2 CLI (`generate_global`, `evaluate`).
4. **4 méthodes** : **EBM natif** (InterpretML), **SHAP** (TreeExplainer XGB/RF, LinearExplainer
   LogReg), **LIME** tabulaire (seed 42, 1000 perturbations), **fallback occlusion** model-agnostic.
5. **Fallback honnête.** Tout échec d'explainer → occlusion documentée (`method_fallback=True` +
   `reason`). **Jamais de contribution inventée.**
6. **Transparence calibration (point critique).** L'attribution explique le **modèle NON calibré**
   (`explains="modèle non calibré"`) ; la **probabilité affichée** est la **proba calibrée** du
   bundle. Dissociation **assumée et documentée**, jamais masquée (cf. §6).
7. **XAI ≠ causalité.** Textes patient/clinicien à **templates contrôlés** ; liste `FORBIDDEN_TERMS`
   (« la cause est », « vous devez », « injectez », « traitement recommandé »…) **vérifiée par test**.
8. **Explications globales** (4 couples) : top features réelles + importance moyenne absolue +
   direction + méthode + versions + `synthetic_only` + date (artefacts JSON, cf. §2).
9. **Explications locales** : proba + libellé risque + contributions signées + baseline + textes
   patient/clinicien + limitations + `open_loop_notice`.
10. **API sécurisée** : `POST /api/v1/xai/explain` (local) + `GET /api/v1/xai/global` (réservé
    clinicien/admin). **RBAC + ownership** (identiques à `ml.predict`), **audit systématique**
    (`xai.explain` / `xai.global`).
11. **Persistance optionnelle** : table additive `xai_explanations` (migration `e5f6a7b8c9d0`,
    SQLite + PG), `is_synthetic=True` ; écriture seulement si `persist=true` **et** calculable.
12. **Endpoints validés en live** (port 8000) : `POST /xai/explain` non authentifié → **401**,
    `GET /xai/global` non authentifié → **401** (après rechargement du workflow).
13. **Cache content-addressé** : clé = `model_id + patient + target + horizon + at + method +
    audience + features_hash` (**vrai hash** du vecteur de features), TTL 15 min, invalidation par
    `model_id`. `persist=true` écrit **même sur un hit de cache** (traçabilité).
14. **Évaluation technique** (sous-échantillon synthétique, jamais inventée) : stabilité top-k
    (Jaccard), deletion/fidélité (win rate), agreement SHAP/LIME, congruence physiologique
    **heuristique** (≠ validation clinique) — valeurs réelles §3.
15. **Tests** : **119 verts** (101 antérieurs Phase 0/0.1/1/2/2.1 **restés verts** + 18 Phase 3),
    dont un test dédié « persist sur hit de cache ».
16. **Limites assumées** (cf. §10) : données synthétiques séparables → scores **non transférables
    au clinique** ; attribution = modèle non calibré ; congruence physio heuristique ; LIME
    stochastique. **Phase 4 NON démarrée.**

---

## 2. Explications globales réelles par couple `(cible, horizon)`

Méthode XAI choisie par couple (`resolve_method`) ; importance = **moyenne des |contributions|**
sur le fond synthétique (`n_background = 200`). Direction = signe agrégé de la contribution.
Toutes les explications portent `explains = "modèle non calibré"`, `synthetic_only = true`,
`model_version 1.0.0`, `dataset_version 1.1.0`, `features_version 1.0.0`.

### 2.1 hypo · 30 min — modèle `ebm` · méthode **native** (InterpretML), fallback : non
| # | Feature | Importance moyenne (|contrib|) | Direction |
| --- | --- | --- | --- |
| 1 | `hour_of_day` | 2,8275 | indéterminée |
| 2 | `cgm_mean_30` | 2,2260 | indéterminée |
| 3 | `cgm_std_30` | 0,8263 | indéterminée |
| 4 | `cgm_slope_30` | 0,7733 | indéterminée |
| 5 | `cgm_delta_60` | 0,6678 | indéterminée |

> Direction « indéterminée » pour l'EBM natif : l'importance globale agrège des contributions de
> signe variable selon la valeur de la feature (forme de fonction non monotone) — l'orientation
> n'est définie qu'au niveau **local**. Non masqué.

### 2.2 hypo · 60 min — modèle `random_forest` · méthode **SHAP** (TreeExplainer), fallback : non
| # | Feature | Importance moyenne (|contrib|) | Direction |
| --- | --- | --- | --- |
| 1 | `cgm_mean_30` | 0,1221 | diminue |
| 2 | `hour_of_day` | 0,1121 | diminue |
| 3 | `is_night` | 0,0696 | diminue |
| 4 | `cgm_mean_60` | 0,0501 | diminue |
| 5 | `cgm_delta_60` | 0,0385 | diminue |

### 2.3 hyper · 30 min — modèle `xgboost` · méthode **SHAP** (TreeExplainer), fallback : non
| # | Feature | Importance moyenne (|contrib|) | Direction |
| --- | --- | --- | --- |
| 1 | `cgm_mean_30` | 4,1741 | diminue |
| 2 | `cgm_delta_60` | 1,0394 | diminue |
| 3 | `cgm_mean_60` | 0,7813 | diminue |
| 4 | `hour_of_day` | 0,6093 | diminue |
| 5 | `minutes_since_insulin` | 0,5788 | diminue |

### 2.4 hyper · 60 min — modèle `xgboost` · méthode **SHAP** (TreeExplainer), fallback : non
| # | Feature | Importance moyenne (|contrib|) | Direction |
| --- | --- | --- | --- |
| 1 | `cgm_mean_30` | 3,7160 | diminue |
| 2 | `cgm_delta_60` | 1,1682 | diminue |
| 3 | `hour_of_day` | 0,9162 | diminue |
| 4 | `minutes_since_meal` | 0,7256 | diminue |
| 5 | `minutes_since_insulin` | 0,5944 | diminue |

> **Lecture honnête.** `cgm_mean_30` domine partout — cohérent avec un benchmark **scénarisé
> séparable** où le niveau glycémique récent porte l'essentiel du signal. Cela traduit la
> **cohérence du pipeline**, **pas** une découverte physiologique.

---

## 3. Évaluation XAI réelle (technique, jamais inventée)

Métriques calculées sur sous-échantillon synthétique (`python -m app.xai.evaluate`). **`None` si
non calculable.** **Ne vaut pas validation clinique.**

| Couple | Méthode | Stabilité top-k (Jaccard) | Deletion (win rate) | Agreement SHAP/LIME | Congruence physio (heuristique) |
| --- | --- | --- | --- | --- | --- |
| hypo 30 | native (EBM) | 0,937 | 0,933 | 0,324 | **0,000** |
| hypo 60 | SHAP (RF) | 0,956 | 1,000 | 0,442 | 0,773 |
| hyper 30 | SHAP (XGB) | 0,853 | 1,000 | 0,291 | 0,533 |
| hyper 60 | SHAP (XGB) | 0,863 | 1,000 | 0,288 | 0,533 |

**Interprétation (honnête, non clinique) :**
- **Stabilité élevée (0,85–0,96)** : le top-k varie peu sous légère perturbation → attributions
  reproductibles sur ce benchmark séparable.
- **Deletion win rate élevé** : retirer les top features dégrade plus le score que retirer les
  faibles → les features désignées portent bien le signal du modèle (fidélité locale).
- **Agreement SHAP/LIME modéré (~0,29–0,44)** : **attendu**, pas une anomalie — LIME est
  stochastique et les modèles tree ne sont pas additifs. Documenté comme **divergence de méthode**.
- **Congruence physiologique hypo 30 = 0,000** : l'heuristique directionnelle (basse/pente↓ → hypo)
  **ne s'aligne pas** avec l'attribution EBM native (direction non monotone, importance dominée par
  `hour_of_day` sur un seed séparable). C'est une **limite assumée de l'heuristique**, pas une
  validation clinique ratée — la métrique est rapportée telle quelle, **jamais corrigée**.

---

## 4. Ce qui est expliqué exactement — calibration

**Point critique de transparence.** Les 4 modèles actifs sont **calibrés** (Platt/Isotonic
conditionnelle, Phase 2). Or :
- **SHAP / LIME / EBM-natif expliquent le modèle de base NON calibré** (l'estimateur interne) ;
- la **`probability` affichée est la proba CALIBRÉE** servie par le bundle (`predict_proba`
  applique le calibrateur).

Chaque explication locale porte donc deux champs distincts :
- `calibrated` → le modèle est-il calibré (la proba affichée l'est) ;
- `explains` → **`"modèle non calibré"`** (la cible réelle de l'attribution).

Cette dissociation est **assumée**. Toutes les voies (SHAP, LIME, fallback occlusion) déclarent la
**même** cible (modèle non calibré) — aucune voie ne prétend expliquer la proba calibrée. Un wrapper
expliquant la chaîne complète (modèle + calibration) est une amélioration possible, **volontairement
non imposée** pour ne pas masquer cette limite.

---

## 5. XAI ≠ causalité — formulations contrôlées

Module `translation.py`, **templates contrôlés** (aucune génération libre), `FEATURE_LABELS` traduit
les 18 features en libellés lisibles.

**Patient** (langage simple, non prescriptif), exemple réel :
> Estimation indicative du risque de hypoglycémie dans les 30 prochaines minutes : niveau faible
> (0 %). Éléments que le modèle a le plus pris en compte : variabilité de la glycémie (30 min) (pèse
> contre ce risque) ; tendance de la glycémie (30 min) (pèse contre ce risque) ; heure de la journée
> (pèse vers ce risque). Ces éléments décrivent ce que le modèle a observé, pas une cause médicale.
> Parlez-en à votre soignant ; cet outil ne propose aucun traitement.

**Clinicien** (technique : feature, valeur, contribution signée, direction, méthode, calibration),
exemple réel :
> Risque hypoglycémie 30 min : p=0.000 (niveau faible). Attribution locale [méthode=native, cible
> expliquée : modèle non calibré]. Contributions : cgm_std_30=n/a → -8.0304 (diminue le score) |
> cgm_slope_30=n/a → -5.3576 (diminue le score) | hour_of_day=1.000 → +4.2634 (augmente le score) |
> … Importance statistique de pondération du modèle (≠ causalité physiologique). Données
> synthétiques. Open-loop : aucune dose, aucune décision automatique.

**Interdits** (`FORBIDDEN_TERMS`, vérifiés par test) : « vous devez », « injectez », « la cause
est », « le traitement recommandé est », etc.

---

## 6. Table `xai_explanations` (structure + migration)

Persistance **optionnelle** des explications locales. Modèle SQLAlchemy
`app.models.xai_explanation.XaiExplanation`, migration **`e5f6a7b8c9d0`** (chaînée sur
`d4e5f6a7b8c9`, additive non destructive, **idempotente**, **SQLite + PostgreSQL**).

| Colonne | Type | Notes |
| --- | --- | --- |
| `id` | UUID | clé primaire |
| `patient_id` | UUID | indexé |
| `ts` | DateTime(tz) | instant `at` de l'explication |
| `target` | String | `hypo` / `hyper` |
| `horizon_min` | Integer | 30 / 60 |
| `probability` | Float | **proba calibrée** affichée |
| `risk_label` | String | libellé de risque |
| `calculable` | Boolean | explication calculable ou non |
| `model_name` / `model_version` | String | modèle actif expliqué |
| `calibrated` | Boolean | modèle calibré (proba affichée) |
| `explains` | String | **`"modèle non calibré"`** (cible de l'attribution) |
| `xai_method` | String | `native` / `shap` / `lime` / `occlusion` |
| `method_fallback` | Boolean | fallback occlusion déclenché |
| `top_features` | JSON | contributions signées (top-k) |
| `baseline` | Float | valeur de référence de l'attribution |
| `explanation_text_patient` / `_clinician` | Text | textes contrôlés |
| `is_synthetic` | Boolean | **toujours `True`** |

---

## 7. API XAI disponible

### `POST /api/v1/xai/explain` — explication locale (open-loop)
**Payload** : `patient_id` (optionnel patient / **requis** clinicien-admin), `target`
(`hypo|hyper`), `horizon_min` (`30|60`), `at` (optionnel), `method` (`auto|shap|lime|native`),
`audience` (`patient|clinician`), `persist` (bool), `top_k` (1–18).

- **RBAC + ownership** (identiques à `ml.predict`, via `resolve_read_scope`) : patient → **son**
  dossier ; clinicien/admin → `patient_id` **requis**.
- **Audit systématique** (`action="xai.explain"`).
- **Open-loop** : la réponse ne contient **que** attributions + proba + libellé risque +
  `open_loop_notice` + `limitations`. **Aucune** dose/décision.
- **Erreurs** : `401` non authentifié · `403` dossier non autorisé · `404` patient introuvable ·
  `400` cible/horizon/méthode invalide (ou `patient_id` manquant pour clinicien/admin) · `422`
  payload mal formé.

### `GET /api/v1/xai/global` — explication globale
**Paramètres** : `target`, `horizon_min`, `regenerate` (bool). **Réservé clinicien/admin**
(patient → **403**) : agrégat modèle, **aucune** donnée patient. Audit `action="xai.global"`.

**Validation live (port 8000, après rechargement workflow)** : `POST /xai/explain` non authentifié
→ **401** ; `GET /xai/global` non authentifié → **401**.

---

## 8. Cache et performance

Clé content-addressée = `model_id + patient_id + target + horizon + at + method + audience +
features_hash` (**vrai SHA-256 tronqué du vecteur de features** au point T, et non un placeholder),
**TTL 15 min**, **invalidation par `model_id`** (réentraînement/réactivation).

- Cache local activé seulement si `at` est fourni (une explication « maintenant » varie par nature).
- **`persist=true` écrit en base même sur un hit de cache** (traçabilité préservée — corrige un
  défaut où la persistance était sautée au retour anticipé du cache).
- Notes latence : **SHAP global** pré-calculé (artefacts) ; **LIME local** le plus lent (1000
  perturbations) ; tout échec/lenteur → **fallback occlusion** documenté.

---

## 9. Commandes réellement utilisées

```bash
# 1. Générer les explications globales des 4 couples (artefacts JSON)
cd backend && python -m app.xai.generate_global
#   (ciblage : python -m app.xai.generate_global --target hypo --horizon 30)

# 2. Évaluer la XAI (stabilité / deletion / agreement / congruence physio)
cd backend && python -m app.xai.evaluate

# 3. Tests
cd backend && python -m pytest -q

# Pré-requis base (rappel) :
cd backend && alembic upgrade head && python -m app.seed
```

Artefacts produits : `backend/artifacts/xai/global/global-<target>-<horizon>.json`
(**gitignorés**, **régénérables**).

---

## 10. Limites scientifiques assumées

- **Données synthétiques scénarisées séparables** → scores et stabilité **non transférables au
  clinique**. La domination de `cgm_mean_30` = artefact du benchmark, pas une vérité physiologique.
- **L'attribution explique le modèle NON calibré**, pas la proba calibrée affichée (§4).
- **Congruence physiologique = heuristique directionnelle**, **PAS** une vérité terrain (cf. hypo 30
  à 0,000 : désalignement heuristique/EBM rapporté tel quel).
- **LIME = stabilité limitée** (stochastique) ; **SHAP TreeExplainer = approximation** pour
  ensembles ; agreement SHAP/LIME modéré attendu.
- **Aucune** validité clinique, **aucun** usage en boucle fermée, **aucune** donnée patient réelle.
- **Validation externe ultérieure indispensable** avant toute revendication.

---

## 11. Sortie complète des tests

```text
119 passed
```
Répartition : **101 tests antérieurs** (Phase 0/0.1/1/2/2.1, **restés verts**) + **18 tests
Phase 3** (`tests/test_xai.py`) : chargement modèle actif, explication globale, explication locale,
RBAC, ownership, 401, non-propriétaire (403/404), méthode invalide (400), horizon invalide (400),
traduction patient non prescriptive, traduction clinicien technique, audit créé, cache hit/miss,
**persist sur hit de cache**, persistance (`is_synthetic`), absence de données réelles, métriques
d'évaluation (stabilité/deletion/agreement/physio), global réservé clinicien (403). Exécutés sur
SQLite isolé ; schéma additif **PostgreSQL** (dev) via migration `e5f6a7b8c9d0`.

---

## 12. Documentation produite

- `docs/migration/PHASE_3_XAI_CLINIQUE.md` — architecture, méthodes, choix, procédure (16 sections).
- `docs/migration/RAPPORT_PHASE_3.md` — **ce rapport**.
- `replit.md` — section Phase 3 mise à jour (périmètre, méthodes, endpoints, tests).

---

## 13. Confirmations explicites

- ✅ **Aucune recommandation automatique** n'est générée.
- ✅ **Aucune dose** n'est suggérée.
- ✅ **Aucune notification clinique automatique** n'est déclenchée.
- ✅ Les explications persistées restent **`is_synthetic=True`**.
- ✅ **XAI ≠ causalité** : formulations prescriptives interdites et **testées**.
- ✅ **Calibration dissociée et documentée** : l'attribution explique le **modèle non calibré**.
- ✅ **Aucune métrique inventée** : `None` quand non calculable (ex. directions EBM globales).

---

## Conformité aux contraintes non négociables
✅ Données synthétiques (`is_synthetic=True`) · ✅ Open-loop strict (attributions seules, aucune
dose/décision) · ✅ XAI ≠ causalité (termes prescriptifs interdits + testés) · ✅ Calibration
expliquée (modèle non calibré vs proba calibrée) · ✅ Fallback honnête (aucune contribution
inventée) · ✅ Aucune métrique inventée · ✅ Pas de mobile · ✅ RBAC + ownership + audit. **Phase 4
(moteur de recommandation thérapeutique) NON démarrée** — en attente de validation de ce rapport.
