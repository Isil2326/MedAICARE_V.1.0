/**
 * Badges de statut. L'information n'est JAMAIS portée uniquement par la couleur :
 * un libellé texte explicite accompagne toujours la teinte (la pastille colorée
 * n'est qu'un renfort visuel).
 */
import React from 'react';
import { View } from 'react-native';
import { palette, radius, spacing } from '@/theme/theme';
import { Text } from '@/components/Text';
import { riskKeyFromLabel } from '@/theme/theme';

interface BadgeProps {
  label: string;
  color: string;
  surface: string;
  dot?: boolean;
}

function Badge({ label, color, surface, dot = true }: BadgeProps) {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: surface,
        borderColor: color,
        borderWidth: 1,
        borderRadius: radius.pill,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
      }}
    >
      {dot ? (
        <View
          style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }}
        />
      ) : null}
      <Text variant="caption" style={{ color, fontWeight: '600' }}>
        {label}
      </Text>
    </View>
  );
}

/** Badge « données synthétiques » — affiché partout où des données sont montrées. */
export function SyntheticBadge() {
  return (
    <Badge
      label="Données simulées"
      color={palette.synthetic}
      surface={palette.syntheticSurface}
    />
  );
}

/** Badge de risque (faible/modéré/élevé/inconnu) avec libellé texte explicite. */
export function RiskBadge({ label }: { label: string | null | undefined }) {
  const key = riskKeyFromLabel(label);
  const color = palette.risk[key];
  const text = (label && label.trim()) || 'Non calculable';
  return (
    <Badge label={`Risque : ${text}`} color={color} surface={palette.surfaceAlt} />
  );
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente de validation',
  approved: 'Approuvée',
  rejected: 'Rejetée',
  modified: 'Modifiée',
};

const STATUS_STYLE: Record<string, { color: string; surface: string }> = {
  pending: { color: palette.warning, surface: palette.warningSurface },
  approved: { color: palette.success, surface: palette.successSurface },
  rejected: { color: palette.danger, surface: palette.dangerSurface },
  modified: { color: palette.info, surface: palette.infoSurface },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? {
    color: palette.textSecondary,
    surface: palette.surfaceAlt,
  };
  return (
    <Badge label={STATUS_LABEL[status] ?? status} color={s.color} surface={s.surface} />
  );
}
