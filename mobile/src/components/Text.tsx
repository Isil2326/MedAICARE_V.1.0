/** Composant texte typé sur les tokens de typographie. */
import React from 'react';
import { Text as RNText, TextProps, TextStyle } from 'react-native';
import { palette, typography } from '@/theme/theme';

type Variant = keyof typeof typography;
type Tone = 'default' | 'secondary' | 'muted' | 'inverse' | 'brand' | 'danger';

const TONE_COLOR: Record<Tone, string> = {
  default: palette.text,
  secondary: palette.textSecondary,
  muted: palette.textMuted,
  inverse: palette.textInverse,
  brand: palette.brandDark,
  danger: palette.danger,
};

export interface AppTextProps extends TextProps {
  variant?: Variant;
  tone?: Tone;
  center?: boolean;
}

export function Text({
  variant = 'body',
  tone = 'default',
  center,
  style,
  ...rest
}: AppTextProps) {
  const base = typography[variant] as TextStyle;
  return (
    <RNText
      style={[
        base,
        { color: TONE_COLOR[tone] },
        center ? { textAlign: 'center' } : null,
        style,
      ]}
      {...rest}
    />
  );
}
