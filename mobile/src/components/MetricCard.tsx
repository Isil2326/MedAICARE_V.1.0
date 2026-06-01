/**
 * Carte de métrique — met en valeur une valeur clé d'AFFICHAGE (ex. dernière
 * glycémie simulée, probabilité renvoyée par l'API).
 *
 * Purement présentationnel : aucune valeur n'est calculée/dérivée ici, tout est
 * fourni par l'appelant (source de vérité = API). Aucune interprétation clinique.
 */
import React from 'react';
import { View } from 'react-native';
import { palette, radius, shadow, spacing } from '@/theme/theme';
import { Text } from '@/components/Text';

export interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
  tone?: 'brand' | 'neutral';
  badge?: React.ReactNode;
  footer?: React.ReactNode;
}

export function MetricCard({
  label,
  value,
  hint,
  tone = 'neutral',
  badge,
  footer,
}: MetricCardProps) {
  const isBrand = tone === 'brand';
  return (
    <View
      style={[
        {
          backgroundColor: isBrand ? palette.brandSurface : palette.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: isBrand ? palette.brandSurfaceStrong : palette.border,
          padding: spacing.lg,
          gap: spacing.xs,
        },
        shadow.card,
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: spacing.sm,
        }}
      >
        <Text
          variant="caption"
          tone={isBrand ? 'brand' : 'muted'}
          style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}
        >
          {label}
        </Text>
        {badge ?? null}
      </View>

      <Text variant="h1" tone={isBrand ? 'brand' : 'default'}>
        {value}
      </Text>

      {hint ? (
        <Text variant="small" tone="secondary">
          {hint}
        </Text>
      ) : null}

      {footer ? <View style={{ marginTop: spacing.xs }}>{footer}</View> : null}
    </View>
  );
}
