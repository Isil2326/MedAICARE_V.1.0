/**
 * Rendu des composants de sécurité/transparence :
 * - bannière open-loop + données simulées toujours visible ;
 * - encadré XAI : statut "non fiable" exprimé par TEXTE (pas seulement couleur).
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { OpenLoopSyntheticBanner } from '@/components/Banners';
import { XaiWarningBox } from '@/components/XaiWarningBox';

test('la bannière affiche données simulées + open-loop + ne pas modifier le traitement', () => {
  render(<OpenLoopSyntheticBanner />);
  expect(screen.getAllByText(/simulées/i).length).toBeGreaterThanOrEqual(1);
  expect(screen.getByText(/open-loop/i)).toBeTruthy();
  expect(screen.getByText(/Ne modifiez jamais votre traitement/i)).toBeTruthy();
});

test('XAI non fiable → libellé texte explicite + avertissements affichés', () => {
  render(
    <XaiWarningBox
      status="not_reliable_for_clinical_interpretation"
      warnings={['Données synthétiques']}
      semanticLimitations={['Congruence physiologique nulle']}
    />,
  );
  expect(screen.getByText(/NON fiable pour une interprétation clinique/i)).toBeTruthy();
  expect(screen.getByText(/Données synthétiques/i)).toBeTruthy();
  expect(screen.getByText(/comportement du modèle/i)).toBeTruthy();
});
