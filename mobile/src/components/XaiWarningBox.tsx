/**
 * Encadré XAI — affiche fidèlement la fiabilité sémantique et les avertissements
 * renvoyés par le backend (Phase 3.1). Jamais de causalité clinique.
 *
 * Si `not_reliable_for_clinical_interpretation` → alerte visuelle FORTE (rouge)
 * + libellé texte explicite (pas seulement la couleur).
 */
import React from 'react';
import { View } from 'react-native';
import { palette, radius, spacing } from '@/theme/theme';
import { Text } from '@/components/Text';
import { COMPLIANCE } from '@/config/env';
import type { ReliabilityStatus } from '@/types/api';

const RELIABILITY: Record<
  ReliabilityStatus,
  { label: string; level: 'info' | 'warning' | 'danger' }
> = {
  reliable_for_model_debug: {
    label: 'Fiabilité : exploitable pour le débogage du modèle',
    level: 'info',
  },
  caution_semantic_limits: {
    label: 'Fiabilité : prudence — limites sémantiques',
    level: 'warning',
  },
  not_reliable_for_clinical_interpretation: {
    label: 'Fiabilité : NON fiable pour une interprétation clinique',
    level: 'danger',
  },
};

const LEVEL_STYLE = {
  info: { color: palette.info, surface: palette.infoSurface },
  warning: { color: palette.warning, surface: palette.warningSurface },
  danger: { color: palette.danger, surface: palette.dangerSurface },
};

export interface XaiWarningBoxProps {
  status: ReliabilityStatus;
  warnings?: string[];
  semanticLimitations?: string[];
  calibrationNotice?: string;
}

export function XaiWarningBox({
  status,
  warnings = [],
  semanticLimitations = [],
  calibrationNotice,
}: XaiWarningBoxProps) {
  const meta = RELIABILITY[status] ?? RELIABILITY.caution_semantic_limits;
  const s = LEVEL_STYLE[meta.level];
  const isCritical = status === 'not_reliable_for_clinical_interpretation';

  return (
    <View
      accessibilityRole="alert"
      style={{
        backgroundColor: s.surface,
        borderWidth: isCritical ? 2 : 1,
        borderColor: s.color,
        borderRadius: radius.lg,
        padding: spacing.md,
        gap: spacing.sm,
      }}
    >
      {/* En-tête : pastille + libellé de fiabilité (texte explicite). */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: s.color,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 1,
          }}
        >
          <Text variant="caption" tone="inverse" style={{ fontWeight: '700' }}>
            {isCritical ? '!' : 'i'}
          </Text>
        </View>
        <Text variant="bodyStrong" style={{ color: s.color, flexShrink: 1 }}>
          {meta.label}
        </Text>
      </View>

      <Text variant="small" tone="secondary">
        {COMPLIANCE.xaiNotCausal}
      </Text>

      {warnings.length > 0 ? (
        <View style={{ gap: 2 }}>
          {warnings.map((w, i) => (
            <Text key={`w-${i}`} variant="small" style={{ color: palette.text }}>
              • {w}
            </Text>
          ))}
        </View>
      ) : null}

      {semanticLimitations.length > 0 ? (
        <View style={{ gap: 2 }}>
          {semanticLimitations.map((l, i) => (
            <Text key={`l-${i}`} variant="caption" tone="muted">
              — {l}
            </Text>
          ))}
        </View>
      ) : null}

      {calibrationNotice ? (
        <Text variant="caption" tone="muted">
          {calibrationNotice}
        </Text>
      ) : null}
    </View>
  );
}
