/**
 * CgmChart — visualisation CGM récente, LECTURE SEULE.
 *
 * Posture (non-négociables Phase 8) :
 * - AUCUN calcul métier/risque côté client : l'axe vertical utilise un domaine
 *   d'affichage FIXE [40, 300] mg/dL ; chaque barre est un simple mapping linéaire
 *   valeur→hauteur (pur rendu, rien n'est dérivé/interprété à partir des données).
 * - AUCUNE alerte locale, AUCUNE interprétation thérapeutique, AUCUNE dose.
 * - Les barres ont TOUTES la même couleur : on n'encode jamais « dans/hors plage »
 *   par la couleur (ce serait une interprétation clinique). Le repère 70–180 mg/dL
 *   est un REPÈRE VISUEL NON DÉCISIONNEL (plage de référence d'affichage usuelle).
 * - Données 100 % synthétiques. Si moins de 2 points : fallback liste.
 *
 * Implémentation en Views pures (zéro dépendance graphique) → robuste natif + web.
 */
import React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/Text';
import { palette, spacing, radius } from '@/theme/theme';
import { formatTime, formatGlucose } from '@/utils/format';

/** Domaine d'affichage FIXE (aucune dérivation des données). */
const DOMAIN_MIN = 40;
const DOMAIN_MAX = 300;
/** Repère visuel non décisionnel (plage d'affichage usuelle). */
const REF_LOW = 70;
const REF_HIGH = 180;
const CHART_HEIGHT = 140;
const Y_GUTTER = 34;

export interface CgmChartPoint {
  ts: string;
  glucose_mgdl: number;
}

/** Fraction 0..1 d'une valeur dans le domaine fixe (rendu uniquement). */
function fraction(value: number): number {
  const clamped = Math.max(DOMAIN_MIN, Math.min(DOMAIN_MAX, value));
  return (clamped - DOMAIN_MIN) / (DOMAIN_MAX - DOMAIN_MIN);
}

function ListFallback({ points }: { points: CgmChartPoint[] }) {
  return (
    <View testID="cgm-chart-fallback" style={{ marginTop: spacing.sm }}>
      <Text variant="small" tone="secondary">
        Graphique indisponible — affichage liste.
      </Text>
      {points.map((p, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: spacing.xs,
          }}
        >
          <Text variant="small" tone="secondary">
            {formatTime(p.ts)}
          </Text>
          <Text variant="small">{formatGlucose(p.glucose_mgdl)}</Text>
        </View>
      ))}
    </View>
  );
}

/** Étiquette d'axe Y (repère d'affichage fixe, jamais une alerte). */
function YLabel({ value }: { value: number }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        bottom: fraction(value) * CHART_HEIGHT - 7,
        width: Y_GUTTER - 4,
        alignItems: 'flex-end',
      }}
    >
      <Text variant="caption" tone="muted">
        {value}
      </Text>
    </View>
  );
}

/** Ligne horizontale de repère (pointillée), pour les bornes 70/180. */
function RefLine({ value }: { value: number }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: fraction(value) * CHART_HEIGHT,
        height: 1,
        borderTopWidth: 1,
        borderColor: palette.borderStrong,
        borderStyle: 'dashed',
        opacity: 0.7,
      }}
    />
  );
}

export function CgmChart({ data }: { data: CgmChartPoint[] }) {
  const points = [...data].sort((a, b) => a.ts.localeCompare(b.ts));

  // Fallback liste si le graphique ne peut pas être tracé (< 2 points).
  if (points.length < 2) {
    return <ListFallback points={points} />;
  }

  const first = points[0];
  const last = points[points.length - 1];
  const a11yLabel =
    `Graphique de glycémie (CGM), ${points.length} mesures simulées ` +
    `de ${formatTime(first.ts)} à ${formatTime(last.ts)}. ` +
    `Repère visuel non décisionnel.`;

  const lowFrac = fraction(REF_LOW);
  const highFrac = fraction(REF_HIGH);

  return (
    <View testID="cgm-chart" style={{ marginTop: spacing.sm }}>
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={a11yLabel}
        style={{ flexDirection: 'row' }}
      >
        {/* Gouttière d'axe Y avec étiquettes de repère (domaine fixe). */}
        <View style={{ width: Y_GUTTER, height: CHART_HEIGHT }}>
          <YLabel value={DOMAIN_MAX} />
          <YLabel value={REF_HIGH} />
          <YLabel value={REF_LOW} />
          <YLabel value={DOMAIN_MIN} />
        </View>

        <View
          style={{
            flex: 1,
            height: CHART_HEIGHT,
            borderRadius: radius.sm,
            backgroundColor: palette.surfaceAlt,
            borderWidth: 1,
            borderColor: palette.border,
            overflow: 'hidden',
          }}
        >
          {/* Repère visuel non décisionnel (plage 70–180). */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: lowFrac * CHART_HEIGHT,
              height: (highFrac - lowFrac) * CHART_HEIGHT,
              backgroundColor: palette.brandSurface,
            }}
          />
          <RefLine value={REF_HIGH} />
          <RefLine value={REF_LOW} />

          {/* Barres = mapping linéaire pur valeur→hauteur (domaine fixe). */}
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'flex-end',
              gap: 3,
              paddingHorizontal: spacing.xs,
            }}
          >
            {points.map((p, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: Math.max(3, fraction(p.glucose_mgdl) * CHART_HEIGHT),
                  backgroundColor: palette.brand,
                  borderTopLeftRadius: 3,
                  borderTopRightRadius: 3,
                }}
              />
            ))}
          </View>
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: spacing.xs,
          marginLeft: Y_GUTTER,
        }}
      >
        <Text variant="caption" tone="secondary">
          {formatTime(first.ts)}
        </Text>
        <Text variant="caption" tone="secondary">
          {formatTime(last.ts)}
        </Text>
      </View>

      {/* Légende du repère (renfort texte ; jamais une couleur seule). */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          marginTop: spacing.xs,
        }}
      >
        <View
          style={{
            width: 14,
            height: 10,
            borderRadius: 2,
            backgroundColor: palette.brandSurface,
            borderWidth: 1,
            borderColor: palette.border,
          }}
        />
        <Text variant="caption" tone="secondary">
          Bande = plage de référence 70–180 mg/dL
        </Text>
      </View>

      <Text variant="caption" tone="secondary" style={{ marginTop: spacing.xs }}>
        Repère 70–180 mg/dL : repère visuel non décisionnel · échelle fixe 40–300 ·
        données simulées · aucune interprétation clinique.
      </Text>
    </View>
  );
}
