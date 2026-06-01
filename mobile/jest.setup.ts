/**
 * Setup Jest pour les tests de l'app mobile MediAI Care.
 * Réduit le bruit console et fournit des valeurs par défaut sûres.
 * Aucun secret réel n'est manipulé ici : tous les jetons sont factices.
 */
import '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Correctif ciblé du code de sortie Jest (Phase 8.5.1).
//
// `expo-modules-core` tente de résoudre le module natif optionnel
// « ExpoModulesCoreJSLogger ». En environnement Jest (Node, sans natif), cette
// résolution échoue et `requireOptionalNativeModule` émet un `console.warn`
// APRÈS le démontage des tests → Jest lève « Cannot log after tests are done »
// et force un code de sortie 1, alors que les 79 tests passent.
//
// On filtre UNIQUEMENT ce message de bruit (chaîne « ExpoModulesCoreJSLogger »).
// Tous les autres warns passent normalement : ce filtre ne peut donc PAS masquer
// un échec de test. Aucun mock global d'`expo-secure-store` n'est introduit
// (la sécurité des jetons et le test « no-token-leak » restent intacts).
// ---------------------------------------------------------------------------
const EXPO_LOGGER_NOISE = 'ExpoModulesCoreJSLogger';
const originalWarn = console.warn.bind(console);
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].includes(EXPO_LOGGER_NOISE)) {
    return;
  }
  originalWarn(...(args as []));
};
