/**
 * Bannières de conformité et d'alerte.
 *
 * Posture honnête : prototype académique, données simulées, open-loop. Ces
 * bannières sont volontairement visibles et non masquables. L'information est
 * portée par le TEXTE (titre + message) ; la couleur n'est qu'un renfort.
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
        flexDirection: 'row',
        gap: spacing.sm,
        backgroundColor: s.surface,
        borderWidth: 1,
        borderColor: s.color,
        borderLeftWidth: 4,
        borderLeftColor: s.color,
        borderRadius: radius.md,
        padding: spacing.md,
      }}
    >
      {/* Pastille de renfort (décorative ; l'info reste dans le texte). */}
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: s.color,
          marginTop: 5,
        }}
      />
      <View style={{ flexShrink: 1, gap: 2 }}>
        {title ? (
          <Text variant="bodyStrong" style={{ color: s.color }}>
            {title}
          </Text>
        ) : null}
        <Text variant="small" style={{ color: palette.text }}>
          {message}
        </Text>
      </View>
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

/**
 * Bannière de conformité générique (alias sémantique d'AlertBanner) — utile pour
 * afficher un rappel de conformité ponctuel avec un niveau choisi.
 */
export function ComplianceBanner({
  level = 'synthetic',
  title = 'Prototype académique',
  message,
}: {
  level?: Level;
  title?: string;
  message?: string;
}) {
  return (
    <AlertBanner
      level={level}
      title={title}
      message={
        message ?? `${COMPLIANCE.synthetic} ${COMPLIANCE.notCertified} ${COMPLIANCE.noMedicalAdvice}`
      }
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
