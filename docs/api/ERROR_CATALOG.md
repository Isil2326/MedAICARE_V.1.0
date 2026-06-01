# MediAI Care — Catalogue des erreurs API v1

> Prototype non certifié · open-loop · données synthétiques. Phase 5.

## Format de réponse d'erreur (état actuel)

L'API renvoie le **format par défaut FastAPI/Starlette** :

```json
{ "detail": "Message ou structure de validation" }
```

- Erreurs métier levées via `HTTPException(status_code=..., detail="...")` → `{"detail": "<message>"}`.
- Erreurs de validation (Pydantic, `422`) → `{"detail": [ { "loc": [...], "msg": "...", "type": "..." } ]}`.

Il **n'existe pas** de gestionnaire d'exception global réécrivant ce format ; le contrat
actuel des 158+ tests et des clients repose sur `{"detail": ...}`.

## Proposition d'évolution (NON implémentée en Phase 5)

Une enveloppe uniforme faciliterait la consommation mobile :

```json
{ "error": { "code": "FORBIDDEN", "message": "Accès refusé", "details": { } } }
```

**Décision Phase 5 :** non implémentée — l'introduire casserait les contrats existants
(158 tests + clients) sans bénéfice pour le périmètre actuel. La spécification autorisant
« proposer **ou** implémenter », elle est **proposée** ici comme évolution Phase 6+ (à
réaliser via un `exception_handler` global + migration coordonnée des tests/clients).

---

## Codes HTTP par catégorie

| Code | Signification | Déclencheurs typiques |
|---|---|---|
| **200** | OK | Lecture ; ingestion idempotente (doublon) |
| **201** | Créé | Enregistrement (register, ingestion nouvelle ligne) |
| **204** | Pas de contenu | `auth/logout` |
| **400** | Requête invalide (métier) | Horizon non supporté ; fenêtre temporelle invalide ; méthode/cible XAI invalide ; texte safety bloqué ; `prediction_id` non synthétique ou non possédé |
| **401** | Non authentifié | Jeton absent/expiré/invalide ; identifiants erronés ; refresh invalide |
| **403** | Interdit (RBAC/ownership) | Rôle insuffisant ; accès au dossier d'autrui ; patient sur route clinicien |
| **404** | Introuvable | Patient/recommandation inexistant ou hors périmètre (deny-by-default) |
| **409** | Conflit | Email déjà enregistré ; transition de workflow invalide (ex. approuver une reco déjà traitée) |
| **422** | Validation | Corps malformé ; champ manquant ; **spoof** `probability`/`model_name`/`xai_status` (`extra="forbid"`) |
| **429** | Trop de requêtes | Rate limit dépassé (login/refresh/predict/xai/generate) |
| **503** | Indisponible | `/ready` : base/table injoignable |

## Détail par invariant de sécurité

### Safety (recommandations)
- Terme interdit ou motif de dose détecté dans le texte (génération **ou** `modify`) → **400** + audit `recommendation.safety_blocked`. La recommandation reste `pending`.
- Disclaimer négatif (« Ne modifiez jamais votre traitement sans avis médical ») autorisé ; instruction (« Modifiez votre traitement… ») bloquée.

### Source-of-truth probabilités
- `GenerateRequest` en `extra="forbid"` : tout champ client interdit (`probability`, `model_name`, `xai_status`) → **422**.
- `prediction_id` doit pointer une prédiction **possédée** et `is_synthetic=True`, sinon → **400**.

### Ownership (deny-by-default)
- Un patient accédant au dossier/à la recommandation d'autrui obtient **403** ou **404** (jamais de fuite d'existence).
- `GET /recommendations/{id}` durci : un patient ne lit que ses recommandations **approuvées**.

### Rate limiting
- Limites configurables (`config.py`) : login 5/60 s, refresh 10/60 s, predict/xai/generate 60/60 s (défaut).
- Dépassement → **429**. Le décorateur s'exécute **avant** l'authentification (testable sans jeton).
- Limite connue : rate limit **par IP** (infra actuelle). Idéal = par-utilisateur derrière proxy de confiance (évolution documentée).
