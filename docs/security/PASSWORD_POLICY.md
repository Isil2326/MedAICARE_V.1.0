# Politique de mot de passe — MediAI Care (prototype)

> Prototype académique non certifié. Cette politique est volontairement explicite
> sur ce qui est implémenté et ce qui reste à faire avant un éventuel usage réel.

## Politique actuelle (implémentée)

Appliquée côté serveur à l'inscription (`PatientRegister`, `ClinicianRegister`)
via validation Pydantic (`app/schemas/auth.py`, `validate_password_strength`) :

- **Longueur minimale : 12 caractères** (`PASSWORD_MIN_LENGTH = 12`), max 128.
- **Au moins une lettre** (`[A-Za-z]`).
- **Au moins un chiffre** (`\d`).
- **Au moins un caractère spécial** (tout caractère non alphanumérique).
- Stockage : **Argon2** (jamais en clair, jamais réversible).

Un mot de passe non conforme renvoie une erreur **HTTP 422** explicite.

## Limites connues (assumées pour le prototype)

- Pas de vérification de **complexité avancée** (entropie, motifs clavier, répétitions).
- Pas de contrôle par **dictionnaire** (mots de passe courants type `Password1234!`).
- Pas de contrôle de **fuite** (k-anonymity HaveIBeenPwned ou équivalent).
- Pas de **verrouillage temporaire de compte** après N échecs (seul un rate
  limiting par IP est en place sur `/login` et `/refresh`, voir README backend).
- Pas de **rotation forcée** ni d'historique des mots de passe.
- Pas de second facteur (**MFA/2FA**).

## Améliorations prévues (avant tout usage réel)

1. **Complexité renforcée** : score d'entropie (ex. zxcvbn), rejet des motifs faibles.
2. **Dictionnaire** : blocklist des mots de passe les plus courants.
3. **Contrôle de fuite** : vérification k-anonymity contre une base de fuites connues.
4. **Verrouillage temporaire** : lockout progressif par compte après échecs répétés
   (complément du rate limiting par IP déjà présent).
5. **MFA** pour les comptes cliniciens/admin.

## Note compte de démonstration

Le seed crée des comptes de démonstration via hachage direct (hors schéma Pydantic).
Le mot de passe de démo respecte néanmoins la politique courante (`DemoMediAI2026!`).
