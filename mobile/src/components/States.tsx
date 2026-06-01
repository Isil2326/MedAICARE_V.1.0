/** États transverses : chargement / erreur / vide, avec rendu soigné. */
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, View } from 'react-native';
import { motion, palette, radius, spacing } from '@/theme/theme';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { ApiError } from '@/services/api/client';

/** Ligne de squelette animée (pulsation douce) — placeholder de chargement. */
export function SkeletonLine({
  width = '100%',
  height = 14,
}: {
  width?: number | `${number}%`;
  height?: number;
}) {
  const pulse = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: motion.slow, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: motion.slow, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={{
        width,
        height,
        borderRadius: radius.sm,
        backgroundColor: palette.surfaceAlt,
        opacity: pulse,
      }}
    />
  );
}

export function LoadingState({
  label = 'Chargement…',
  skeleton = false,
}: {
  label?: string;
  skeleton?: boolean;
}) {
  if (skeleton) {
    return (
      <View
        style={{ paddingVertical: spacing.md, gap: spacing.sm }}
        accessibilityRole="progressbar"
        accessibilityLabel={label}
      >
        <SkeletonLine width="60%" height={18} />
        <SkeletonLine width="100%" />
        <SkeletonLine width="85%" />
      </View>
    );
  }
  return (
    <View
      style={{ padding: spacing.xl, alignItems: 'center', gap: spacing.md }}
      accessibilityRole="progressbar"
    >
      <ActivityIndicator color={palette.brand} />
      <Text tone="secondary">{label}</Text>
    </View>
  );
}

export function ErrorState({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  const message =
    error instanceof ApiError
      ? error.userMessage
      : "Une erreur inattendue s'est produite.";
  return (
    <View
      style={{
        padding: spacing.xl,
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: palette.dangerSurface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: palette.danger,
      }}
      accessibilityRole="alert"
    >
      <Text variant="h3" tone="danger" center>
        Oups
      </Text>
      <Text tone="secondary" center>
        {message}
      </Text>
      {onRetry ? <Button label="Réessayer" onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}

export function EmptyState({
  title = 'Aucune donnée',
  message,
}: {
  title?: string;
  message?: string;
}) {
  return (
    <View
      style={{
        padding: spacing.xl,
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: palette.surfaceMuted,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: palette.border,
      }}
    >
      {/* Pastille décorative neutre. */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: palette.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 14,
            height: 14,
            borderRadius: 7,
            borderWidth: 2,
            borderColor: palette.borderStrong,
          }}
        />
      </View>
      <Text variant="h3" tone="secondary" center>
        {title}
      </Text>
      {message ? (
        <Text tone="muted" center>
          {message}
        </Text>
      ) : null}
    </View>
  );
}
