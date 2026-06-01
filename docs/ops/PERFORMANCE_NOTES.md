# MediAI Care — Notes de performance (backend)

> Prototype non certifié · open-loop · données synthétiques. Phase 5.
> Chiffres **indicatifs** (mesure en processus, SQLite mémoire, machine de dev Replit).
> Pas un benchmark de production ; aucune garantie SLA. Méthode reproductible ci-dessous.

## Mesures indicatives (moyenne sur N appels, in-process TestClient)

| Endpoint | Latence ~ | Notes |
|---|---|---|
| `GET /health` | ~16 ms | Pas d'accès DB métier |
| `GET /ready` | ~22 ms | 2 requêtes DB de vérification |
| `POST /ml/predict` (sans artefact chargé) | ~47 ms | Inclut auth + RBAC + audit ; hors temps d'inférence d'un modèle chargé |

> L'inférence ML/XAI réelle dépend du chargement des artefacts (`backend/artifacts/`,
> gitignorés, régénérables). Premier appel = coût de chargement à froid ; ensuite servis
> en mémoire. La XAI (SHAP/LIME) est plus coûteuse et **mise en cache TTL 15 min**.

## Leviers en place
- **Cache XAI** mémoire (TTL 15 min), clé `model_id+patient+target+horizon+at+method+features_hash`, invalidation par `model_id`.
- **Rate limiting** sur endpoints coûteux (predict/xai/generate) pour borner la charge.
- **Index DB** : dédup unique partiel + `(patient_id, ts)` sur les tables event ; index unique partiel « un seul modèle actif par (target,horizon) ».
- **Audit** en écriture séquentielle (chaînage) — coût constant par écriture.

## Reproduire la mesure
```bash
cd backend && APP_ENV=test python - <<'PY'
import time, os
os.environ["DATABASE_URL"]="sqlite://"; os.environ["JWT_SECRET_KEY"]="t"
from fastapi.testclient import TestClient
from app.main import app
c = TestClient(app)
def bench(fn, k=50):
    t=time.perf_counter()
    for _ in range(k): fn()
    return round((time.perf_counter()-t)/k*1000, 2)
print("health ms", bench(lambda: c.get("/health")))
print("ready ms",  bench(lambda: c.get("/ready")))
PY
```

## Pistes d'optimisation (futures, non implémentées)
- Pré-chargement (warm-up) des artefacts ML/XAI au démarrage du worker.
- Cache de prédictions synthétiques par `(patient, target, horizon, at)`.
- Rate limit par-utilisateur derrière proxy de confiance (vs IP).
- Pagination/curseur sur les lectures de séries volumineuses.
