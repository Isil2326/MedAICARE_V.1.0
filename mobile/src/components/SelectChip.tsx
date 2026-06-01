/**
 * Puce de sélection accessible (filtres, cibles, horizons).
 *
 * - Toute la puce est la zone tactile (≥ 44 px), pas seulement le texte.
 * - État sélectionné porté par le TEXTE + la bordure + le fond (jamais la couleur
 *   seule) et annoncé via `accessibilityState.selected`.
 */
import React from 'react';
import { Pressable } from 'react-native';
import { MIN_TOUCH_TARGET, palette, radius, spacing } from '@/theme/theme';
import { Text } from '@/components/Text';

export interface SelectChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Étire la puce pour occuper l'espace disponible (sélecteurs segmentés). */
  grow?: boolean;
  /** Coins arrondis « pilule » (filtres) plutôt que moyens (segments). */
  pill?: boolean;
}

export function SelectChip({
  label,
  selected,
  onPress,
  grow = false,
  pill = false,
}: SelectChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        minHeight: MIN_TOUCH_TARGET,
        flexGrow: grow ? 1 : 0,
        flexBasis: grow ? 0 : 'auto',
        minWidth: grow ? 120 : undefined,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? palette.brand : palette.borderStrong,
        backgroundColor: selected ? palette.brandSurface : palette.surface,
        borderRadius: pill ? radius.pill : radius.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text
        variant="small"
        center
        style={{ color: selected ? palette.brandDark : palette.text, fontWeight: '600' }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
