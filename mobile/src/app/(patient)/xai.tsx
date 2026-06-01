/**
 * Explication locale (XAI) côté patient.
 *
 * Affiche fidèlement la fiabilité sémantique, les avertissements et les limites
 * renvoyés par le backend (Phases 3 / 3.1). XAI = pondération du modèle, JAMAIS
 * une cause médicale. Aucune dose / décision / instruction.
 */
import React from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { SyntheticBadge } from '@/components/Badge';
import { XaiWarningBox } from '@/components/XaiWarningBox';
import { AlertBanner } from '@/components/Banners';
import { LoadingState, ErrorState } from '@/components/States';
import { explainLocal } from '@/services/api/xai';
import type { TargetName } from '@/types/api';
import { palette, radius, spacing } from '@/theme/theme';

export default function PatientXai() {
  const params = useLocalSearchParams<{ target?: string; horizon?: string }>();
  const target = (params.target === 'hyper' ? 'hyper' : 'hypo') as TargetName;
  const horizon = params.horizon === '60' ? 60 : 30;

  const q = useQuery({
    queryKey: ['p', 'xai', target, horizon],
    queryFn: () =>
      explainLocal({ target, horizon_min: horizon, audience: 'patient', method: 'auto' }),
  });

  return (
    <Screen refreshing={q.isFetching} onRefresh={q.refetch}>
      <Text variant="h1">Explication</Text>
      <Text tone="secondary">
        {target === 'hypo' ? 'Hypoglycémie' : 'Hyperglycémie'} · horizon {horizon} min
      </Text>

      {q.isLoading ? (
        <LoadingState label="Génération de l'explication…" />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={q.refetch} />
      ) : q.data ? (
        <>
          <XaiWarningBox
            status={q.data.xai_reliability_status}
            warnings={q.data.xai_warnings}
            semanticLimitations={q.data.semantic_limitations}
            calibrationNotice={q.data.calibration_notice}
          />

          {!q.data.calculable ? (
            <AlertBanner
              level="warning"
              title="Explication non calculable"
              message={q.data.reason ?? 'Données insuffisantes pour expliquer cette estimation.'}
            />
          ) : null}

          <Card>
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Text variant="h3">Ce que le modèle a surtout utilisé</Text>
              <SyntheticBadge />
            </View>
            <Text style={{ marginTop: spacing.sm }}>
              {q.data.explanation_text_patient}
            </Text>

            {q.data.top_features.length > 0 ? (
              <View style={{ marginTop: spacing.md, gap: spacing.xs }}>
                {q.data.top_features.map((f, i) => (
                  <View
                    key={i}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingVertical: spacing.xs,
                      borderTopWidth: i === 0 ? 0 : 1,
                      borderTopColor: palette.border,
                    }}
                  >
                    <Text variant="small" style={{ flexShrink: 1 }}>
                      {f.feature}
                    </Text>
                    <Text variant="small" tone="secondary">
                      {f.direction}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View
              style={{
                marginTop: spacing.md,
                backgroundColor: palette.surfaceAlt,
                borderRadius: radius.sm,
                padding: spacing.sm,
              }}
            >
              <Text variant="caption" tone="secondary">
                {q.data.limitations}
              </Text>
            </View>
          </Card>

          <Text variant="caption" tone="muted" center>
            Méthode : {q.data.xai_method}
            {q.data.method_fallback ? ' (repli documenté)' : ''} ·{' '}
            {q.data.cached ? 'en cache' : 'recalculé'}
          </Text>
        </>
      ) : null}
    </Screen>
  );
}
