/** Bouton accessible (zone tactile ≥ 44 px, état désactivé/chargement). */
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import { MIN_TOUCH_TARGET, palette, radius, spacing } from '@/theme/theme';
import { Text } from '@/components/Text';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

const BG: Record<Variant, string> = {
  primary: palette.brand,
  secondary: palette.surfaceAlt,
  danger: palette.danger,
  ghost: 'transparent',
};

const FG: Record<Variant, 'inverse' | 'default' | 'danger'> = {
  primary: 'inverse',
  secondary: 'default',
  danger: 'inverse',
  ghost: 'default',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  fullWidth,
  accessibilityHint,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        {
          minHeight: MIN_TOUCH_TARGET,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          borderRadius: radius.md,
          backgroundColor: BG[variant],
          borderWidth: variant === 'ghost' || variant === 'secondary' ? 1 : 0,
          borderColor: palette.border,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={FG[variant] === 'inverse' ? palette.textInverse : palette.text}
          style={{ marginRight: spacing.sm }}
        />
      ) : null}
      <Text variant="bodyStrong" tone={FG[variant]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Espace vertical utilitaire. */
export function Gap({ size = spacing.md }: { size?: number }) {
  return <View style={{ height: size }} />;
}
