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
import { Header } from '@/components/Header';
import { SectionTitle } from '@/components/SectionTitle';
import { MetricCard } from '@/components/MetricCard';
import { Button, Gap } from '@/components/Button';
import { SelectChip } from '@/components/SelectChip';
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

export default function PatientRisk() {
  const router = useRouter();
  const [target, setTarget] = useState<TargetName>('hypo');
  const [horizon, setHorizon] = useState(30);

  const m = useMutation<PredictResponse>({
    mutationFn: () => predict({ target, horizon_min: horizon }),
  });

  return (
    <Screen>
      <Header title="Estimation de risque" subtitle="Probabilité fournie par le modèle (API)." />
      <OpenLoopSyntheticBanner />

      <Card>
        <SectionTitle title="Paramètres" />
        <Gap size={spacing.sm} />
        <Text variant="small" tone="secondary">
          Type d'événement
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginTop: spacing.xs }}>
          {TARGETS.map((t) => (
            <SelectChip
              key={t.key}
              grow
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
            <SelectChip
              key={h}
              grow
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
        m.data.calculable ? (
          <MetricCard
            tone="brand"
            label="Probabilité estimée"
            value={formatProbability(m.data.probability)}
            hint={`${m.data.target === 'hypo' ? 'Hypoglycémie' : 'Hyperglycémie'} · horizon ${m.data.horizon_min} min · ${formatDateTime(m.data.at)}`}
            badge={<SyntheticBadge />}
            footer={
              <View style={{ gap: spacing.sm }}>
                <RiskBadge label={m.data.risk_label} />
                <Text variant="caption" tone="muted">
                  Modèle : {m.data.model_name} ({m.data.model_version}) ·{' '}
                  {m.data.calibrated ? 'calibré' : 'non calibré'}
                </Text>
                <View
                  style={{
                    backgroundColor: palette.surfaceMuted,
                    borderRadius: radius.sm,
                    borderWidth: 1,
                    borderColor: palette.border,
                    padding: spacing.sm,
                  }}
                >
                  <Text variant="caption" tone="secondary">
                    {m.data.open_loop_notice}
                  </Text>
                </View>
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
              </View>
            }
          />
        ) : (
          <Card>
            <SectionTitle title="Résultat" action={<SyntheticBadge />} />
            <View style={{ marginTop: spacing.sm }}>
              <AlertBanner
                level="warning"
                title="Risque non calculable"
                message={
                  m.data.reason ??
                  'Données insuffisantes pour estimer ce risque actuellement.'
                }
              />
            </View>
            <View
              style={{
                marginTop: spacing.sm,
                backgroundColor: palette.surfaceMuted,
                borderRadius: radius.sm,
                borderWidth: 1,
                borderColor: palette.border,
                padding: spacing.sm,
              }}
            >
              <Text variant="caption" tone="secondary">
                {m.data.open_loop_notice}
              </Text>
            </View>
          </Card>
        )
      ) : null}
    </Screen>
  );
}
