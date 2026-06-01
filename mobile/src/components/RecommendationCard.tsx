/**
 * Carte de recommandation open-loop.
 *
 * Affiche le statut (validation humaine), la catégorie, le message (tel que
 * fourni/validé par le backend — l'app n'invente aucun conseil), et un rappel
 * permanent que rien n'est appliqué automatiquement.
 */
import React from 'react';
import { View } from 'react-native';
import { palette, radius, spacing } from '@/theme/theme';
import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { StatusBadge } from '@/components/Badge';
import { COMPLIANCE } from '@/config/env';
import type { RecommendationPublic } from '@/types/api';

const CATEGORY_LABEL: Record<string, string> = {
  ALERT_CRITICAL: 'Alerte critique',
  RECOMMENDATION_BEHAVIORAL: 'Recommandation comportementale',
  CLINICAL_REFERRAL: 'Renvoi clinique',
  THERAPY_SUGGESTION_REVIEW_ONLY: 'Suggestion thérapeutique (revue uniquement)',
};

export interface RecommendationCardProps {
  rec: RecommendationPublic;
  children?: React.ReactNode;
}

export function RecommendationCard({ rec, children }: RecommendationCardProps) {
  return (
    <Card>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: spacing.sm,
        }}
      >
        <StatusBadge status={rec.status} />
        {rec.priority != null ? (
          <View
            style={{
              backgroundColor: palette.surfaceAlt,
              borderRadius: radius.pill,
              paddingVertical: 2,
              paddingHorizontal: spacing.sm,
            }}
          >
            <Text variant="caption" tone="muted">
              Priorité {rec.priority}
            </Text>
          </View>
        ) : null}
      </View>

      <Text variant="h3" style={{ marginTop: spacing.md }}>
        {CATEGORY_LABEL[rec.category] ?? rec.category}
      </Text>

      <Text style={{ marginTop: spacing.xs }}>{rec.message}</Text>

      {(rec.target || rec.horizon_min != null || rec.probability != null) && (
        <View
          style={{
            marginTop: spacing.md,
            paddingTop: spacing.sm,
            borderTopWidth: 1,
            borderTopColor: palette.border,
            gap: 2,
          }}
        >
          {rec.target ? (
            <Text variant="caption" tone="muted">
              Cible : {rec.target}
              {rec.horizon_min != null ? ` · horizon ${rec.horizon_min} min` : ''}
            </Text>
          ) : null}
          {rec.probability != null ? (
            <Text variant="caption" tone="muted">
              Probabilité modèle : {(rec.probability * 100).toFixed(1)} %
            </Text>
          ) : null}
          {rec.model_name ? (
            <Text variant="caption" tone="muted">
              Modèle : {rec.model_name}
              {rec.model_version ? ` (${rec.model_version})` : ''}
            </Text>
          ) : null}
        </View>
      )}

      <View
        style={{
          marginTop: spacing.md,
          flexDirection: 'row',
          gap: spacing.sm,
          backgroundColor: palette.surfaceMuted,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: palette.border,
          padding: spacing.sm,
        }}
      >
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: palette.brand,
            marginTop: 5,
          }}
        />
        <Text variant="caption" tone="secondary" style={{ flexShrink: 1 }}>
          {COMPLIANCE.openLoop} {COMPLIANCE.doNotChangeTreatment}
        </Text>
      </View>

      {children ? <View style={{ marginTop: spacing.md }}>{children}</View> : null}
    </Card>
  );
}
