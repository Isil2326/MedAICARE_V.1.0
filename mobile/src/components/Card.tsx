/** Carte de contenu standard. */
import React from 'react';
import { View, ViewProps } from 'react-native';
import { palette, radius, shadow, spacing } from '@/theme/theme';

export interface CardProps extends ViewProps {
  padded?: boolean;
}

export function Card({ padded = true, style, children, ...rest }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: palette.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: palette.border,
          padding: padded ? spacing.lg : 0,
        },
        shadow.card,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
