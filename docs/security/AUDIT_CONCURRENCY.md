# Concurrence & intégrité du journal d'audit chaîné

> Prototype académique non certifié. Cette note documente honnêtement la limite
> de concurrence du chaînage d'audit et les garde-fous en place.

## Rappel du modèle

Chaque entrée de `audit_logs` (voir `app/models/audit.py`) porte :

- `sequence` : compteur strictement croissant, **unique** (contrainte DB) ;
- `prev_hash` : hash de l'entrée précédente ;
- `entry_hash` : hash SHA-256 des champs immuables, **unique** (contrainte DB) ;

Le service (`app/services/audit_service.py`) calcule `sequence = last.sequence + 1`
et `prev_hash = last.entry_hash` à partir de la dernière entrée lue.

## Le risque de course

Deux écritures **concurrentes** peuvent lire la même « dernière entrée », calculer
le même `sequence`/`prev_hash`, et tenter d'insérer deux entrées rivales :
une **fourche** de la chaîne ou une collision de séquence.

## Garde-fous en place

1. **Garantie dure — contraintes d'unicité en base.**
   `sequence` et `entry_hash` sont `unique=True`. En cas de course, **au plus une**
   des deux insertions concurrentes réussit ; l'autre échoue avec une violation
   d'unicité (la transaction est rejetée). Il ne peut donc **pas** y avoir de
   double insertion silencieuse ni de fourche persistée. C'est la garantie forte.

2. **Verrou applicatif léger (mono-processus).**
   `audit_service.record()` sérialise le calcul de `sequence` + l'append sous un
   `threading.Lock` de module. Sur l'instance unique Replit (un seul processus),
   cela évite la course en amont plutôt que de la rattraper par une erreur DB.

## Limites assumées

- Le verrou applicatif est **par processus**. En déploiement **multi-processus /
  multi-instances**, il ne protège plus ; seule la contrainte d'unicité DB garantit
  alors l'intégrité (une des écritures échoue et doit être réessayée).
- **Trous de séquence possibles.** Si une transaction qui a réservé un `sequence`
  est annulée (rollback) après qu'une autre a avancé, des numéros peuvent manquer.
  **Ce n'est pas une corruption** : `verify_chain()` valide la chaîne par le lien
  `prev_hash` (chaque entrée référence le hash de la précédente), pas par la
  contiguïté des numéros. Une séquence non contiguë mais correctement chaînée
  reste intègre.

## À faire avant un usage réel

- Multi-instances : verrou inter-processus via **`pg_advisory_xact_lock`**
  (PostgreSQL) ou un verrou Redis, plus politique de **retry** sur violation
  d'unicité.
- Le journal local côté navigateur (`engine/decisionLog.ts`) reste **non
  autoritaire** ; la source de vérité est le journal serveur.
