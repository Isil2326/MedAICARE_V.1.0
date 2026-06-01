/** Carte de contenu standard, avec apparition douce (micro-interaction légère). */
import React, { useEffect, useRef } from 'react';
import { Animated, ViewProps } from 'react-native';
import { motion, palette, radius, shadow, spacing } from '@/theme/theme';

type CardVariant = 'default' | 'tonal' | 'flat';

export interface CardProps extends ViewProps {
  padded?: boolean;
  variant?: CardVariant;
  /** Désactive l'animation d'apparition (ex. listes très longues). */
  animateIn?: boolean;
}

export function Card({
  padded = true,
  variant = 'default',
  animateIn = true,
  style,
  children,
  ...rest
}: CardProps) {
  const opacity = useRef(new Animated.Value(animateIn ? 0 : 1)).current;
  const translateY = useRef(new Animated.Value(animateIn ? 6 : 0)).current;

  useEffect(() => {
    if (!animateIn) return;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: motion.base,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: motion.base,
        useNativeDriver: true,
      }),
    ]).start();
  }, [animateIn, opacity, translateY]);

  const surface =
    variant === 'tonal' ? palette.brandSurface : palette.surface;
  const borderColor =
    variant === 'tonal' ? palette.brandSurfaceStrong : palette.border;

  return (
    <Animated.View
      style={[
        {
          backgroundColor: surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor,
          padding: padded ? spacing.lg : 0,
          opacity,
          transform: [{ translateY }],
        },
        variant === 'flat' ? null : shadow.card,
        style,
      ]}
      {...rest}
    >
      {children}
    </Animated.View>
  );
}
