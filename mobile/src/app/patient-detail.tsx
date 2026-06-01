/**
 * Dossier patient (clinicien/admin) — profil, risque, XAI local, recommandations.
 *
 * - Risque & XAI proviennent du backend (open-loop strict, aucune dose/décision).
 * - Génération de suggestions → toujours `pending`, validation humaine ensuite.
 * - Accès réservé clinicien/admin (RBAC serveur + garde de navigation).
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { Button, Gap } from '@/components/Button';
import { RiskBadge, SyntheticBadge } from '@/components/Badge';
import { AlertBanner, OpenLoopSyntheticBanner } from '@/components/Banners';
import { XaiWarningBox } from '@/components/XaiWarningBox';
import { RecommendationCard } from '@/components/RecommendationCard';
import { RecommendationActions } from '@/components/RecommendationActions';
import { LoadingState, ErrorState, EmptyState } from '@/components/States';

import { getPatient } from '@/services/api/patients';
import { predict } from '@/services/api/ml';
import { explainLocal } from '@/services/api/xai';
import {
  listRecommendations,
  generateRecommendations,
} from '@/services/api/recommendations';
import { useAuth } from '@/store/auth';
import type { TargetName } from '@/types/api';
import { ApiError } from '@/services/api/client';
import { formatProbability, ageFromBirth } from '@/utils/format';
import { palette, radius, spacing } from '@/theme/theme';

const TARGETS: { key: TargetName; label: string }[] = [
  { key: 'hypo', label: 'Hypo (<70)' },
  { key: 'hyper', label: 'Hyper (>180)' },
];
const HORIZONS = [30, 60];

function Chip({
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
        variant="small"
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={onPress}
        style={{ color: selected ? palette.brandDark : palette.text }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function PatientDetail() {
  const { role } = useAuth();
  const qc = useQueryClient();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';

  const [target, setTarget] = useState<TargetName>('hypo');
  const [horizon, setHorizon] = useState(30);
  const [genError, setGenError] = useState<string | null>(null);

  const profileQ = useQuery({
    queryKey: ['patient', id],
    queryFn: () => getPatient(id),
    enabled: !!id,
  });
  const recosQ = useQuery({
    queryKey: ['patient', id, 'recos'],
    queryFn: () => listRecommendations({ patient_id: id }),
    enabled: !!id,
  });

  const predictM = useMutation({
    mutationFn: () => predict({ patient_id: id, target, horizon_min: horizon }),
  });
  const explainM = useMutation({
    mutationFn: () =>
      explainLocal({
        patient_id: id,
        target,
        horizon_min: horizon,
        audience: 'clinician',
        method: 'auto',
      }),
  });
  const generateM = useMutation({
    mutationFn: () =>
      generateRecommendations({ patient_id: id, target, horizon_min: horizon, include_xai: true }),
    onError: (e) =>
      setGenError(e instanceof ApiError ? e.userMessage : 'Génération impossible.'),
    onSuccess: () => {
      setGenError(null);
      qc.invalidateQueries({ queryKey: ['patient', id, 'recos'] });
    },
  });

  if (role !== 'clinician' && role !== 'admin') return <Redirect href="/" />;
  if (!id) {
    return (
      <Screen>
        <ErrorState error={new Error('missing id')} />
      </Screen>
    );
  }

  return (
    <Screen
      refreshing={profileQ.isFetching || recosQ.isFetching}
      onRefresh={() => {
        profileQ.refetch();
        recosQ.refetch();
      }}
    >
      <OpenLoopSyntheticBanner />

      {/* Profil */}
      <Card>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Text variant="h2">
            {profileQ.data
              ? `${profileQ.data.first_name} ${profileQ.data.last_name}`
              : 'Patient'}
          </Text>
          <SyntheticBadge />
        </View>
        {profileQ.isLoading ? (
          <LoadingState />
        ) : profileQ.error ? (
          <ErrorState error={profileQ.error} onRetry={profileQ.refetch} />
        ) : profileQ.data ? (
          <Text tone="secondary" style={{ marginTop: spacing.xs }}>
            {profileQ.data.diabetes_type ?? 'Type non précisé'}
            {profileQ.data.birth_date ? ` · ${ageFromBirth(profileQ.data.birth_date)}` : ''}
          </Text>
        ) : null}
      </Card>

      {/* Paramètres risque / XAI / génération */}
      <Card>
        <Text variant="h3">Analyse (cible / horizon)</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginTop: spacing.sm }}>
          {TARGETS.map((t) => (
            <Chip key={t.key} label={t.label} selected={target === t.key} onPress={() => setTarget(t.key)} />
          ))}
          {HORIZONS.map((h) => (
            <Chip key={h} label={`${h} min`} selected={horizon === h} onPress={() => setHorizon(h)} />
          ))}
        </View>
        <Gap size={spacing.md} />
        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
          <Button
            label={predictM.isPending ? 'Estimation…' : 'Estimer le risque'}
            loading={predictM.isPending}
            onPress={() => predictM.mutate()}
          />
          <Button
            label={explainM.isPending ? 'Explication…' : 'Expliquer (XAI)'}
            variant="secondary"
            loading={explainM.isPending}
            onPress={() => explainM.mutate()}
          />
        </View>
      </Card>

      {/* Résultat risque */}
      {predictM.error ? <ErrorState error={predictM.error} onRetry={() => predictM.mutate()} /> : null}
      {predictM.data ? (
        <Card>
          <Text variant="h3">Risque estimé</Text>
          {predictM.data.calculable ? (
            <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
              <Text variant="h2">{formatProbability(predictM.data.probability)}</Text>
              <RiskBadge label={predictM.data.risk_label} />
              <Text variant="caption" tone="muted">
                Modèle : {predictM.data.model_name} ({predictM.data.model_version})
              </Text>
            </View>
          ) : (
            <AlertBanner
              level="warning"
              title="Non calculable"
              message={predictM.data.reason ?? 'Données insuffisantes.'}
            />
          )}
          <Text variant="caption" tone="muted" style={{ marginTop: spacing.sm }}>
            {predictM.data.open_loop_notice}
          </Text>
        </Card>
      ) : null}

      {/* Résultat XAI local */}
      {explainM.error ? <ErrorState error={explainM.error} onRetry={() => explainM.mutate()} /> : null}
      {explainM.data ? (
        <>
          <XaiWarningBox
            status={explainM.data.xai_reliability_status}
            warnings={explainM.data.xai_warnings}
            semanticLimitations={explainM.data.semantic_limitations}
            calibrationNotice={explainM.data.calibration_notice}
          />
          <Card>
            <Text variant="h3">Explication (clinicien)</Text>
            <Text style={{ marginTop: spacing.sm }}>
              {explainM.data.explanation_text_clinician}
            </Text>
            <View style={{ marginTop: spacing.md, gap: spacing.xs }}>
              {explainM.data.top_features.map((f, i) => (
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
          </Card>
        </>
      ) : null}

      {/* Génération de suggestions */}
      <Card>
        <Text variant="h3">Générer des suggestions</Text>
        <Text variant="small" tone="secondary" style={{ marginTop: spacing.xs }}>
          Les suggestions sont créées en statut « en attente » et nécessitent votre validation.
        </Text>
        {genError ? (
          <View style={{ marginTop: spacing.sm }}>
            <AlertBanner level="danger" message={genError} />
          </View>
        ) : null}
        {generateM.data ? (
          <View style={{ marginTop: spacing.sm }}>
            <AlertBanner
              level="info"
              message={
                generateM.data.calculable
                  ? `${generateM.data.generated.length} suggestion(s) générée(s). ${generateM.data.open_loop_notice}`
                  : `Aucune suggestion : ${generateM.data.reasons.join(' ') || 'non calculable.'}`
              }
            />
          </View>
        ) : null}
        <Gap size={spacing.md} />
        <Button
          label={generateM.isPending ? 'Génération…' : 'Générer (en attente)'}
          loading={generateM.isPending}
          onPress={() => generateM.mutate()}
        />
      </Card>

      {/* Recommandations du patient */}
      <Text variant="h2">Recommandations</Text>
      {recosQ.isLoading ? (
        <LoadingState />
      ) : recosQ.error ? (
        <ErrorState error={recosQ.error} onRetry={recosQ.refetch} />
      ) : recosQ.data && recosQ.data.length ? (
        recosQ.data.map((rec) => (
          <RecommendationCard key={rec.id} rec={rec}>
            <RecommendationActions
              rec={rec}
              onChanged={() => qc.invalidateQueries({ queryKey: ['patient', id, 'recos'] })}
            />
          </RecommendationCard>
        ))
      ) : (
        <EmptyState message="Aucune recommandation pour ce patient." />
      )}
      <Gap />
    </Screen>
  );
}
