// ============================================================================
// PROTOTYPE NOTICE — Source de vérité unique pour version, statut, mentions
// ============================================================================
// Ce fichier remplace toutes les revendications de conformité (HDS, AES-256,
// IEC 62304, ISO 13485, RGPD, chiffrement E2E) qui figuraient auparavant dans
// l'UI sans réalité technique correspondante.
//
// Suite à l'audit pluridisciplinaire du 1er mai 2026, l'application affiche
// désormais explicitement son statut de prototype académique.
// ============================================================================

export const APP_VERSION = '1.0.0-prototype';

export const APP_STATUS_LABEL = 'Prototype académique';

export const APP_DISCLAIMER_SHORT = 'Démo non destinée à un usage clinique';

export const APP_DISCLAIMER_LONG =
  'Prototype académique de mémoire de Master. Données simulées. ' +
  'Stockage local navigateur uniquement. Aucune certification réglementaire ' +
  '(MDR, IEC 62304, ISO 13485, HDS, RGPD opérationnel). ' +
  "Non destiné à un usage clinique réel.";

export const TECH_FACTS = {
  passwordHashing: 'PBKDF2-SHA256 · 100 000 itérations',
  storage: 'localStorage navigateur (clair)',
  backend: 'Aucun (application client-only)',
  realData: 'Aucune (10 patients simulés)',
} as const;
