/**
 * Carte patient (cohorte clinicien) — entièrement cliquable (zone tactile large),
 * avec pastille d'initiales décorative et léger retour visuel à la pression.
 *
 * Présentationnel uniquement : aucune donnée dérivée, aucune décision.
 */
import React, { useRef } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { MIN_TOUCH_TARGET, motion, palette, radius, shadow, spacing } from '@/theme/theme';
import { Text } from '@/components/Text';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '–';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export interface PatientCardProps {
  name: string;
  meta?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  accessibilityHint?: string;
}

export function PatientCard({ name, meta, onPress, right, accessibilityHint }: PatientCardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (to: number) =>
    Animated.timing(scale, {
      toValue: to,
      duration: motion.fast,
      useNativeDriver: true,
    }).start();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => animateTo(0.98)}
      onPressOut={() => animateTo(1)}
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir le dossier de ${name}`}
      accessibilityHint={accessibilityHint}
    >
      <Animated.View
        style={[
          {
            backgroundColor: palette.surface,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: palette.border,
            padding: spacing.lg,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            minHeight: MIN_TOUCH_TARGET,
            transform: [{ scale }],
          },
          shadow.card,
        ]}
      >
        {/* Pastille d'initiales (décorative ; le nom reste affiché en texte). */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: palette.brandSurface,
            borderWidth: 1,
            borderColor: palette.brandSurfaceStrong,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text variant="bodyStrong" tone="brand">
            {initials(name)}
          </Text>
        </View>

        <View style={{ flexShrink: 1, flexGrow: 1 }}>
          <Text variant="h3">{name}</Text>
          {meta ? (
            <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>
              {meta}
            </Text>
          ) : null}
          <Text variant="small" tone="brand" style={{ marginTop: spacing.xs }}>
            Ouvrir le dossier →
          </Text>
        </View>

        {right ? <View>{right}</View> : null}
      </Animated.View>
    </Pressable>
  );
}
