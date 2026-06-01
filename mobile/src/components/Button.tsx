/** Bouton accessible (zone tactile ≥ 44 px, état désactivé/chargement). */
import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import { MIN_TOUCH_TARGET, motion, palette, radius, spacing } from '@/theme/theme';
import { Text } from '@/components/Text';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'md' | 'sm';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
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
  size = 'md',
  disabled,
  loading,
  fullWidth,
  accessibilityHint,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
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
      disabled={isDisabled}
      onPressIn={() => !isDisabled && animateTo(0.97)}
      onPressOut={() => animateTo(1)}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      accessibilityHint={accessibilityHint}
      style={{ alignSelf: fullWidth ? 'stretch' : 'flex-start' }}
    >
      {({ pressed }) => (
        <Animated.View
          style={[
            {
              minHeight: size === 'sm' ? 40 : MIN_TOUCH_TARGET,
              paddingVertical: size === 'sm' ? spacing.sm : spacing.md,
              paddingHorizontal: size === 'sm' ? spacing.md : spacing.lg,
              borderRadius: radius.md,
              backgroundColor: BG[variant],
              borderWidth: variant === 'ghost' || variant === 'secondary' ? 1 : 0,
              borderColor: palette.borderStrong,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              opacity: isDisabled ? 0.5 : pressed ? 0.92 : 1,
              transform: [{ scale }],
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
          <Text variant={size === 'sm' ? 'small' : 'bodyStrong'} tone={FG[variant]}>
            {label}
          </Text>
        </Animated.View>
      )}
    </Pressable>
  );
}

/** Espace vertical utilitaire. */
export function Gap({ size = spacing.md }: { size?: number }) {
  return <View style={{ height: size }} />;
}
