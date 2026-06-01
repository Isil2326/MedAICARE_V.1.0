/**
 * Design system MediAI Care Mobile — tokens centralisés.
 *
 * Mode clair, lisible, médical et rassurant. Contrastes conformes WCAG AA pour
 * le texte principal. Les couleurs de risque sont TOUJOURS doublées d'un libellé
 * texte (jamais d'information critique véhiculée uniquement par la couleur).
 */

export const palette = {
  // Marque — émeraude (cohérent avec l'app web).
  brand: '#059669',
  brandDark: '#047857',
  brandLight: '#10B981',
  brandSurface: '#ECFDF5',

  // Neutres (slate).
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',

  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  textInverse: '#FFFFFF',

  // Risque / statut (contrastes AA sur fond clair).
  risk: {
    faible: '#047857',
    modéré: '#B45309',
    élevé: '#B91C1C',
    inconnu: '#475569',
  },

  // Sémantique.
  danger: '#B91C1C',
  dangerSurface: '#FEF2F2',
  warning: '#B45309',
  warningSurface: '#FFFBEB',
  info: '#1D4ED8',
  infoSurface: '#EFF6FF',
  success: '#047857',
  successSurface: '#ECFDF5',

  // Bannière « données synthétiques » (violet sobre, distinct du risque).
  synthetic: '#6D28D9',
  syntheticSurface: '#F5F3FF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  // Tailles minimales lisibles ; corps ≥ 16 px.
  h1: { fontSize: 26, fontWeight: '700' as const, lineHeight: 32 },
  h2: { fontSize: 20, fontWeight: '700' as const, lineHeight: 26 },
  h3: { fontSize: 17, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyStrong: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
  small: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
} as const;

/** Zone tactile minimale recommandée (accessibilité). */
export const MIN_TOUCH_TARGET = 44;

export const shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;

export type RiskKey = keyof typeof palette.risk;

/** Associe un libellé de risque backend à une clé de couleur + texte affichable. */
export function riskKeyFromLabel(label: string | null | undefined): RiskKey {
  const l = (label ?? '').toLowerCase();
  if (l.includes('élev') || l.includes('eleve') || l.includes('high'))
    return 'élevé';
  if (l.includes('modér') || l.includes('moder') || l.includes('mod'))
    return 'modéré';
  if (l.includes('faible') || l.includes('low')) return 'faible';
  return 'inconnu';
}
