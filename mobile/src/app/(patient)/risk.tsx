/**
 * Estimation de risque (ml/predict) — PROBABILITÉ uniquement, open-loop strict.
 *
 * L'application n'effectue AUCUN calcul de risque : tout vient du backend.
 * Aucune dose, aucune décision, aucune instruction thérapeutique.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { Button, Gap } from '@/components/Button';
import { RiskBadge, SyntheticBadge } from '@/components/Badge';
import { AlertBanner, OpenLoopSyntheticBanner } from '@/components/Banners';
import { ErrorState } from '@/components/States';
import { predict } from '@/services/api/ml';
import type { PredictResponse, TargetName } from '@/types/api';
import { formatProbability, formatDateTime } from '@/utils/format';
import { palette, radius, spacing } from '@/theme/theme';

const TARGETS: { key: TargetName; label: string }[] = [
  { key: 'hypo', label: 'Hypoglycémie (<70)' },
  { key: 'hyper', label: 'Hyperglycémie (>180)' },
];
const HORIZONS = [30, 60];

function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <View
      style={{
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? palette.brand : palette.borderStrong,
        backgroundColor: selected ? palette.brandSurface : palette.surface,
        borderRadius: radius.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
      }}
    >
      <Text
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        variant="small"
        style={{ color: selected ? palette.brandDark : palette.text }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function PatientRisk() {
  const router = useRouter();
  const [target, setTarget] = useState<TargetName>('hypo');
  const [horizon, setHorizon] = useState(30);

  const m = useMutation<PredictResponse>({
    mutationFn: () => predict({ target, horizon_min: horizon }),
  });

  return (
    <Screen>
      <Text variant="h1">Estimation de risque</Text>
      <OpenLoopSyntheticBanner />

      <Card>
        <Text variant="h3">Paramètres</Text>
        <Gap size={spacing.sm} />
        <Text variant="small" tone="secondary">
          Type d'événement
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginTop: spacing.xs }}>
          {TARGETS.map((t) => (
            <Choice
              key={t.key}
              label={t.label}
              selected={target === t.key}
              onPress={() => setTarget(t.key)}
            />
          ))}
        </View>

        <Gap size={spacing.md} />
        <Text variant="small" tone="secondary">
          Horizon
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
          {HORIZONS.map((h) => (
            <Choice
              key={h}
              label={`${h} min`}
              selected={horizon === h}
              onPress={() => setHorizon(h)}
            />
          ))}
        </View>

        <Gap size={spacing.md} />
        <Button
          label={m.isPending ? 'Estimation…' : 'Estimer le risque'}
          onPress={() => m.mutate()}
          loading={m.isPending}
          fullWidth
        />
      </Card>

      {m.error ? <ErrorState error={m.error} onRetry={() => m.mutate()} /> : null}

      {m.data ? (
        <Card>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Text variant="h3">Résultat</Text>
            <SyntheticBadge />
          </View>

          {m.data.calculable ? (
            <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
              <Text variant="h2">{formatProbability(m.data.probability)}</Text>
              <RiskBadge label={m.data.risk_label} />
              <Text variant="caption" tone="muted">
                {m.data.target === 'hypo' ? 'Hypoglycémie' : 'Hyperglycémie'} · horizon{' '}
                {m.data.horizon_min} min · {formatDateTime(m.data.at)}
              </Text>
              <Text variant="caption" tone="muted">
                Modèle : {m.data.model_name} ({m.data.model_version}) ·{' '}
                {m.data.calibrated ? 'calibré' : 'non calibré'}
              </Text>
            </View>
          ) : (
            <AlertBanner
              level="warning"
              title="Risque non calculable"
              message={
                m.data.reason ??
                'Données insuffisantes pour estimer ce risque actuellement.'
              }
            />
          )}

          <View
            style={{
              marginTop: spacing.sm,
              backgroundColor: palette.surfaceAlt,
              borderRadius: radius.sm,
              padding: spacing.sm,
            }}
          >
            <Text variant="caption" tone="secondary">
              {m.data.open_loop_notice}
            </Text>
          </View>

          <Gap size={spacing.md} />
          <Button
            label="Voir l'explication (XAI)"
            variant="secondary"
            onPress={() =>
              router.push({
                pathname: '/(patient)/xai',
                params: { target: m.data!.target, horizon: String(m.data!.horizon_min) },
              })
            }
          />
        </Card>
      ) : null}
    </Screen>
  );
}
