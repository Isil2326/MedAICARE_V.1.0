/**
 * Titre de section — rythme visuel cohérent entre les cartes.
 * Optionnellement accompagné d'un sous-titre et d'une action à droite.
 */
import React from 'react';
import { View } from 'react-native';
import { palette, radius, spacing } from '@/theme/theme';
import { Text } from '@/components/Text';

export interface SectionTitleProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function SectionTitle({ title, subtitle, action }: SectionTitleProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: spacing.sm,
      }}
    >
      <View style={{ flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        {/* Accent de marque (décoratif). */}
        <View
          style={{
            width: 4,
            height: 18,
            borderRadius: radius.pill,
            backgroundColor: palette.brand,
          }}
        />
        <View style={{ flexShrink: 1 }}>
          <Text variant="h2">{title}</Text>
          {subtitle ? (
            <Text variant="small" tone="secondary">
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {action ? <View>{action}</View> : null}
    </View>
  );
}
