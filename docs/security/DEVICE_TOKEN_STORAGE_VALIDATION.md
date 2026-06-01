# Validation du stockage des jetons sur device — MediAI Care

> **Phase 8.** Checklist de validation du stockage sécurisé des jetons sur **appareil
> réel** (non exécutable sur Replit/Expo Web). Posture : jetons **jamais** dans
> AsyncStorage/localStorage ; SecureStore natif (Keychain iOS / Keystore Android) ;
> mémoire volatile sur web.

## Contexte (rappel d'implémentation, inchangé en Phase 8)
- `mobile/src/services/secureStore.ts` : `expo-secure-store` en natif, `Map` mémoire
  volatile sur web. Aucun `AsyncStorage`/`localStorage` pour les jetons.
- Logout et échec de refresh effacent les secrets (`clearTokens`).
- Garde automatisée en CI : `no-token-leak.test.ts` (pas d'import AsyncStorage, pas de
  log de token).

## Pourquoi cette checklist est « device only »
Sur le preview Replit (Expo Web), SecureStore réel (Keychain/Keystore) **n'existe pas**
— le code bascule volontairement sur une mémoire volatile. Seul un **build device**
(cf. `docs/mobile/DEVICE_BUILD_GUIDE.md`) permet de valider le stockage chiffré natif.

## A. Keychain iOS (build device iOS)
- [ ] Après login, le jeton de rafraîchissement est stocké via SecureStore (Keychain).
- [ ] Le jeton **n'apparaît pas** en clair dans les logs (Xcode console / `console.*`).
- [ ] Aucune écriture de jeton dans `UserDefaults`/`localStorage`/AsyncStorage.
- [ ] Données protégées au repos (Keychain chiffré par l'OS).

## B. Keystore Android (build device Android)
- [ ] Après login, le jeton est stocké via SecureStore (Keystore / EncryptedSharedPrefs).
- [ ] Le jeton **n'apparaît pas** dans `adb logcat`.
- [ ] Aucune écriture de jeton dans SharedPreferences en clair / AsyncStorage.

## C. Effacement au logout
- [ ] « Déconnexion » appelle `logout` puis efface les secrets (bloc `finally`).
- [ ] Après logout, relancer une requête protégée → retour Login (aucun jeton résiduel).
- [ ] L'effacement a lieu **même si l'appel réseau de logout échoue** (hors-ligne).

## D. Comportement après redémarrage de l'app
- [ ] Fermer/rouvrir l'app : si un refresh valide existe, la session est restaurée via
      `GET /auth/me` ; sinon retour Login.
- [ ] Après redémarrage du device : idem (le secret persiste dans Keychain/Keystore,
      contrairement au web volatile).

## E. Comportement après expiration / invalidation du refresh
- [ ] Un refresh expiré/révoqué → `clearTokens()` + handler `auth-expired` → Login.
- [ ] Réutilisation d'un ancien refresh (rotation serveur) → famille révoquée côté
      backend → l'app retombe sur Login (cf. backend reuse-detection).

## F. Absence de stockage non sécurisé (à confirmer sur device)
- [ ] Aucun jeton dans AsyncStorage (non importé — garde CI) ni localStorage.
- [ ] Aucun jeton affiché à l'écran ni copié dans le presse-papier.
- [ ] Inspection système (fichiers app / prefs) : aucun jeton en clair.

## G. Verrouillage / biométrie (optionnel, device)
- [ ] Comportement de SecureStore sous écran verrouillé conforme aux attentes.
- [ ] (Si activé ultérieurement) accès biométrique au secret — hors périmètre actuel.

## Résultat
| Plateforme | Stockage | Effacement logout | Persistance redémarrage | Statut |
|---|---|---|---|---|
| iOS device | Keychain | | | à valider device |
| Android device | Keystore | | | à valider device |
| Web (Replit) | Mémoire volatile | oui (perte au refresh) | non (volatile) | ✅ par conception |

> Tant que le build device n'est pas réalisé, le statut natif reste **« à valider sur
> device »** ; la conformité du **code** est, elle, couverte par les tests unitaires.
