/**
 * CgmChart — graphique CGM LECTURE SEULE (Phase 8).
 * Vérifie : rendu du graphique, repère NON décisionnel, fallback liste,
 * absence de tout vocabulaire de dose / risque / décision / interprétation.
 */
import fs from 'fs';
import path from 'path';
import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { CgmChart } from '@/components/CgmChart';

const POINTS = [
  { ts: '2026-06-01T08:00:00Z', glucose_mgdl: 95 },
  { ts: '2026-06-01T08:05:00Z', glucose_mgdl: 120 },
  { ts: '2026-06-01T08:10:00Z', glucose_mgdl: 165 },
  { ts: '2026-06-01T08:15:00Z', glucose_mgdl: 200 },
];

test('rend le graphique avec ≥ 2 points', () => {
  render(<CgmChart data={POINTS} />);
  expect(screen.getByTestId('cgm-chart')).toBeTruthy();
});

test('le repère 70–180 est explicitement non décisionnel', () => {
  render(<CgmChart data={POINTS} />);
  expect(screen.getByText(/non décisionnel/i)).toBeTruthy();
  expect(screen.getByText(/aucune interprétation clinique/i)).toBeTruthy();
});

test('fallback liste si moins de 2 points', () => {
  render(<CgmChart data={[POINTS[0]]} />);
  expect(screen.getByTestId('cgm-chart-fallback')).toBeTruthy();
  expect(screen.queryByTestId('cgm-chart')).toBeNull();
});

test('label accessible résumé (pas de lecture barre par barre)', () => {
  render(<CgmChart data={POINTS} />);
  expect(
    screen.getByLabelText(/Graphique de glycémie \(CGM\), 4 mesures/i),
  ).toBeTruthy();
});

test('aucun vocabulaire de dose / décision / risque dans le composant', () => {
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'components', 'CgmChart.tsx'),
    'utf8',
  );
  // Pas d'appel à des services de calcul métier côté client.
  expect(src).not.toMatch(/services\/api\/(ml|recommendations)/);
  expect(src).not.toMatch(/\bpredict\b/i);
  // Pas d'instruction thérapeutique / dose.
  expect(src).not.toMatch(/injectez|posologie|unités d'insuline|augmentez la dose/i);
});
