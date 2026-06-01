/**
 * XAI global (clinicien/admin) — importance moyenne des variables par modèle.
 *
 * XAI = pondération agrégée du modèle, JAMAIS une cause clinique. Affiche
 * fidèlement la fiabilité, les avertissements et la sémantique des directions.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { XaiWarningBox } from '@/components/XaiWarningBox';
import { AlertBanner } from '@/components/Banners';
import { LoadingState, ErrorState } from '@/components/States';
import { getGlobal } from '@/services/api/xai';
import type { TargetName } from '@/types/api';
import { palette, radius, spacing } from '@/theme/theme';

const COUPLES: { target: TargetName; horizon: number; label: string }[] = [
  { target: 'hypo', horizon: 30, label: 'Hypo 30' },
  { target: 'hypo', horizon: 60, label: 'Hypo 60' },
  { target: 'hyper', horizon: 30, label: 'Hyper 30' },
  { target: 'hyper', horizon: 60, label: 'Hyper 60' },
];

export default function ClinicianXaiGlobal() {
  const [idx, setIdx] = useState(0);
  const couple = COUPLES[idx];

  const q = useQuery({
    queryKey: ['clinician', 'xai-global', couple.target, couple.horizon],
    queryFn: () => getGlobal(couple.target, couple.horizon),
  });

  return (
    <Screen refreshing={q.isFetching} onRefresh={q.refetch}>
      <Text variant="h1">XAI global</Text>
      <Text tone="secondary">Importance moyenne des variables par modèle actif.</Text>

      <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
        {COUPLES.map((c, i) => {
          const selected = i === idx;
          return (
            <View
              key={c.label}
              style={{
                borderWidth: selected ? 2 : 1,
                borderColor: selected ? palette.brand : palette.borderStrong,
                backgroundColor: selected ? palette.brandSurface : palette.surface,
                borderRadius: radius.pill,
                paddingVertical: spacing.xs,
                paddingHorizontal: spacing.md,
              }}
            >
              <Text
                variant="small"
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setIdx(i)}
                style={{ color: selected ? palette.brandDark : palette.text }}
              >
                {c.label}
              </Text>
            </View>
          );
        })}
      </View>

      {q.isLoading ? (
        <LoadingState label="Chargement de l'explication globale…" />
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

          <Card>
            <Text variant="h3">
              {q.data.model_name} ({q.data.model_version})
            </Text>
            <Text variant="caption" tone="muted">
              Méthode : {q.data.xai_method}
              {q.data.method_fallback ? ' (repli documenté)' : ''} ·{' '}
              {q.data.calibrated ? 'calibré' : 'non calibré'}
            </Text>
            <AlertBanner level="info" message={q.data.direction_semantics} />

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
                    gap: spacing.md,
                  }}
                >
                  <Text variant="small" style={{ flexShrink: 1 }}>
                    {f.feature}
                  </Text>
                  <Text variant="small" tone="secondary">
                    {f.aggregated_sign ?? f.direction}
                  </Text>
                </View>
              ))}
            </View>

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
        </>
      ) : null}
    </Screen>
  );
}
