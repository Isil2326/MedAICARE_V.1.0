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
import { Header } from '@/components/Header';
import { SectionTitle } from '@/components/SectionTitle';
import { MetricCard } from '@/components/MetricCard';
import { SelectChip } from '@/components/SelectChip';
import { Button, Gap } from '@/components/Button';
import { RiskBadge, SyntheticBadge } from '@/components/Badge';
import { AlertBanner, OpenLoopSyntheticBanner } from '@/components/Banners';
import { XaiWarningBox } from '@/components/XaiWarningBox';
import { RecommendationCard } from '@/components/RecommendationCard';
import { RecommendationActions } from '@/components/RecommendationActions';
import { ClinicianActionBar } from '@/components/ClinicianActionBar';
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
import { palette, spacing } from '@/theme/theme';
import { formatProbability, ageFromBirth } from '@/utils/format';

const TARGETS: { key: TargetName; label: string }[] = [
  { key: 'hypo', label: 'Hypo (<70)' },
  { key: 'hyper', label: 'Hyper (>180)' },
];
const HORIZONS = [30, 60];

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

  const patientName = profileQ.data
    ? `${profileQ.data.first_name} ${profileQ.data.last_name}`
    : 'Dossier patient';

  return (
    <Screen
      refreshing={profileQ.isFetching || recosQ.isFetching}
      onRefresh={() => {
        profileQ.refetch();
        recosQ.refetch();
      }}
    >
      <Header
        variant="hero"
        title={patientName}
        subtitle={
          profileQ.data
            ? `${profileQ.data.diabetes_type ?? 'Type non précisé'}${
                profileQ.data.birth_date ? ` · ${ageFromBirth(profileQ.data.birth_date)}` : ''
              }`
            : 'Données simulées'
        }
        right={<SyntheticBadge />}
      />

      <OpenLoopSyntheticBanner />

      {profileQ.isLoading ? (
        <LoadingState skeleton />
      ) : profileQ.error ? (
        <ErrorState error={profileQ.error} onRetry={profileQ.refetch} />
      ) : null}

      {/* Paramètres risque / XAI / génération */}
      <Card>
        <SectionTitle title="Analyse (cible / horizon)" />
        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginTop: spacing.md }}>
          {TARGETS.map((t) => (
            <SelectChip key={t.key} label={t.label} selected={target === t.key} onPress={() => setTarget(t.key)} />
          ))}
          {HORIZONS.map((h) => (
            <SelectChip key={h} label={`${h} min`} selected={horizon === h} onPress={() => setHorizon(h)} />
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
        predictM.data.calculable ? (
          <MetricCard
            tone="brand"
            label="Risque estimé"
            value={formatProbability(predictM.data.probability)}
            hint={`Modèle : ${predictM.data.model_name} (${predictM.data.model_version})`}
            badge={<SyntheticBadge />}
            footer={
              <View style={{ gap: spacing.sm }}>
                <RiskBadge label={predictM.data.risk_label} />
                <Text variant="caption" tone="muted">
                  {predictM.data.open_loop_notice}
                </Text>
              </View>
            }
          />
        ) : (
          <Card>
            <SectionTitle title="Risque estimé" action={<SyntheticBadge />} />
            <View style={{ marginTop: spacing.sm }}>
              <AlertBanner
                level="warning"
                title="Non calculable"
                message={predictM.data.reason ?? 'Données insuffisantes.'}
              />
            </View>
            <Text variant="caption" tone="muted" style={{ marginTop: spacing.sm }}>
              {predictM.data.open_loop_notice}
            </Text>
          </Card>
        )
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
            <SectionTitle title="Explication (clinicien)" />
            <Text style={{ marginTop: spacing.md }}>
              {explainM.data.explanation_text_clinician}
            </Text>
            <View style={{ marginTop: spacing.md, gap: spacing.xs }}>
              {explainM.data.top_features.map((f, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingVertical: spacing.sm,
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
        <SectionTitle title="Générer des suggestions" />
        <Text variant="small" tone="secondary" style={{ marginTop: spacing.sm }}>
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
      <SectionTitle title="Recommandations" />
      {recosQ.isLoading ? (
        <LoadingState skeleton />
      ) : recosQ.error ? (
        <ErrorState error={recosQ.error} onRetry={recosQ.refetch} />
      ) : recosQ.data && recosQ.data.length ? (
        recosQ.data.map((rec) => (
          <RecommendationCard key={rec.id} rec={rec}>
            <ClinicianActionBar>
              <RecommendationActions
                rec={rec}
                onChanged={() => qc.invalidateQueries({ queryKey: ['patient', id, 'recos'] })}
              />
            </ClinicianActionBar>
          </RecommendationCard>
        ))
      ) : (
        <EmptyState
          title="Aucune recommandation"
          message="Aucune recommandation pour ce patient."
        />
      )}
      <Gap />
    </Screen>
  );
}
