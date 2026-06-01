/** États transverses : chargement / erreur / vide. */
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { palette, spacing } from '@/theme/theme';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { ApiError } from '@/services/api/client';

export function LoadingState({ label = 'Chargement…' }: { label?: string }) {
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
      style={{ padding: spacing.xl, alignItems: 'center', gap: spacing.md }}
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
    <View style={{ padding: spacing.xl, alignItems: 'center', gap: spacing.sm }}>
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
