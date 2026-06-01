/**
 * Configuration d'environnement de l'application mobile MediAI Care.
 *
 * API_BASE_URL provient EXCLUSIVEMENT d'une variable d'environnement Expo
 * (`EXPO_PUBLIC_API_BASE_URL`). Aucune URL de production n'est codée en dur.
 *
 * - En dev Replit : la variable est injectée par le workflow « Mobile App ».
 * - Si la variable est absente, l'app NE plante PAS au démarrage : le client API
 *   renvoie une erreur explicite et non technique (voir services/api/client.ts),
 *   conformément au périmètre Phase 6 (« gérer API_BASE_URL manquante »).
 */

function normalizeBaseUrl(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, '');
}

/** URL racine du backend (sans le préfixe /api/v1), ou null si non configurée. */
export const API_BASE_URL: string | null = normalizeBaseUrl(
  process.env.EXPO_PUBLIC_API_BASE_URL,
);

/** Préfixe stable de l'API v1. */
export const API_PREFIX = '/api/v1';

/** Délai maximal d'une requête réseau (ms) avant abandon. */
export const REQUEST_TIMEOUT_MS = 15000;

/** Nombre de nouvelles tentatives sur erreur réseau (GET idempotents uniquement). */
export const MAX_NETWORK_RETRIES = 1;

/** True si une URL d'API est configurée. */
export const IS_API_CONFIGURED = API_BASE_URL !== null;

/**
 * Bannière de conformité affichée dans toute l'application.
 * Posture honnête : prototype académique, données simulées, non certifié.
 */
export const COMPLIANCE = {
  prototype: 'Prototype académique — non destiné à un usage clinique.',
  synthetic: 'Données 100 % simulées (synthétiques). Aucune donnée réelle.',
  notCertified: 'Non certifié (MDR / IEC 62304 / ISO 13485).',
  noMedicalAdvice: 'Ne remplace pas un avis médical.',
  doNotChangeTreatment:
    'Ne modifiez jamais votre traitement sans avis médical.',
  xaiNotCausal:
    'La XAI décrit le comportement du modèle, pas une cause médicale.',
  openLoop:
    'Aide à la décision open-loop : aucune dose, aucune décision automatique.',
} as const;
