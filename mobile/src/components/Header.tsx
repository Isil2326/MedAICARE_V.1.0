/**
 * En-tête d'écran réutilisable.
 *
 * - variant `hero` : bandeau de marque (émeraude) avec texte inversé, pour donner
 *   une impression de produit mature (accueil patient, dossier clinicien).
 * - variant `plain` : titre + sous-titre sobres.
 *
 * Accessibilité : le contraste texte/fond reste conforme WCAG AA (blanc sur
 * `brandDark`). Aucune information n'est portée uniquement par la couleur.
 */
import React from 'react';
import { View } from 'react-native';
import { palette, radius, shadow, spacing } from '@/theme/theme';
import { Text } from '@/components/Text';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  variant?: 'hero' | 'plain';
  right?: React.ReactNode;
}

export function Header({ title, subtitle, variant = 'plain', right }: HeaderProps) {
  if (variant === 'hero') {
    return (
      <View
        style={[
          {
            backgroundColor: palette.brandDark,
            borderRadius: radius.lg,
            padding: spacing.lg,
            overflow: 'hidden',
          },
          shadow.elevated,
        ]}
      >
        {/* Éléments décoratifs (purement esthétiques, non porteurs d'information). */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -44,
            right: -28,
            width: 150,
            height: 150,
            borderRadius: 75,
            backgroundColor: palette.brand,
            opacity: 0.35,
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: -54,
            left: -24,
            width: 130,
            height: 130,
            borderRadius: 65,
            backgroundColor: palette.brandDeep,
            opacity: 0.45,
          }}
        />
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: spacing.md,
          }}
        >
          <View style={{ flexShrink: 1 }}>
            <Text variant="h1" tone="inverse">
              {title}
            </Text>
            {subtitle ? (
              <Text tone="inverse" style={{ opacity: 0.92, marginTop: 2 }}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {right ? <View>{right}</View> : null}
        </View>
      </View>
    );
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: spacing.md,
      }}
    >
      <View style={{ flexShrink: 1 }}>
        <Text variant="h1">{title}</Text>
        {subtitle ? (
          <Text tone="secondary" style={{ marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
}
