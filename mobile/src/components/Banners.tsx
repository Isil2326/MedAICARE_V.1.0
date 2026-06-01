/**
 * Bannières de conformité et d'alerte.
 *
 * Posture honnête : prototype académique, données simulées, open-loop. Ces
 * bannières sont volontairement visibles et non masquables.
 */
import React from 'react';
import { View } from 'react-native';
import { palette, radius, spacing } from '@/theme/theme';
import { Text } from '@/components/Text';
import { COMPLIANCE } from '@/config/env';

type Level = 'info' | 'warning' | 'danger' | 'synthetic';

const STYLES: Record<Level, { color: string; surface: string }> = {
  info: { color: palette.info, surface: palette.infoSurface },
  warning: { color: palette.warning, surface: palette.warningSurface },
  danger: { color: palette.danger, surface: palette.dangerSurface },
  synthetic: { color: palette.synthetic, surface: palette.syntheticSurface },
};

export interface AlertBannerProps {
  level?: Level;
  title?: string;
  message: string;
}

export function AlertBanner({ level = 'info', title, message }: AlertBannerProps) {
  const s = STYLES[level];
  return (
    <View
      accessibilityRole="alert"
      style={{
        backgroundColor: s.surface,
        borderLeftWidth: 4,
        borderLeftColor: s.color,
        borderRadius: radius.md,
        padding: spacing.md,
      }}
    >
      {title ? (
        <Text variant="bodyStrong" style={{ color: s.color, marginBottom: 2 }}>
          {title}
        </Text>
      ) : null}
      <Text variant="small" style={{ color: palette.text }}>
        {message}
      </Text>
    </View>
  );
}

/** Bannière open-loop + données simulées, à placer en tête des écrans sensibles. */
export function OpenLoopSyntheticBanner() {
  return (
    <AlertBanner
      level="synthetic"
      title="Prototype — données simulées"
      message={`${COMPLIANCE.synthetic} ${COMPLIANCE.openLoop} ${COMPLIANCE.doNotChangeTreatment}`}
    />
  );
}

/** Bannière hors-ligne. */
export function OfflineBanner() {
  return (
    <AlertBanner
      level="warning"
      title="Hors ligne"
      message="Connexion indisponible. Les données affichées peuvent être incomplètes ; les actions réseau sont désactivées."
    />
  );
}
