/**
 * Conteneur visuel groupant les actions clinicien (validation humaine open-loop).
 *
 * Rôle purement présentationnel : délimite clairement la zone d'action et rappelle
 * que toute suggestion exige une validation humaine. N'exécute aucune décision.
 */
import React from 'react';
import { View } from 'react-native';
import { palette, radius, spacing } from '@/theme/theme';
import { Text } from '@/components/Text';

export interface ClinicianActionBarProps {
  title?: string;
  children: React.ReactNode;
}

export function ClinicianActionBar({
  title = 'Action clinicien — validation humaine',
  children,
}: ClinicianActionBarProps) {
  return (
    <View
      style={{
        marginTop: spacing.sm,
        backgroundColor: palette.surfaceMuted,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: palette.border,
        padding: spacing.md,
        gap: spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View
          style={{
            width: 4,
            height: 14,
            borderRadius: radius.pill,
            backgroundColor: palette.brand,
          }}
        />
        <Text
          variant="caption"
          tone="secondary"
          style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}
        >
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}
