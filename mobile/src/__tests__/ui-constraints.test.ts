/**
 * Invariants de code (Phase 8.5) — vérifiés au niveau SOURCE :
 * - les composants visuels n'importent JAMAIS les services ML/recommandations
 *   (API = source de vérité ; aucun calcul/décision côté UI) ;
 * - aucun vocabulaire de dose/posologie dans les composants visuels ;
 * - séparation des rôles : l'écran patient « mes conseils » n'embarque PAS les
 *   actions de validation (approve/reject) réservées au clinicien.
 */
import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.join(__dirname, '..', 'components');
const APP_DIR = path.join(__dirname, '..', 'app');

/** Composants purement présentationnels (refonte UI/UX). */
const VISUAL_COMPONENTS = [
  'Header.tsx',
  'SectionTitle.tsx',
  'MetricCard.tsx',
  'PatientCard.tsx',
  'ClinicianActionBar.tsx',
  'Card.tsx',
  'Button.tsx',
  'Badge.tsx',
  'Banners.tsx',
  'States.tsx',
  'TabIcon.tsx',
  'Text.tsx',
  'CgmChart.tsx',
  'RecommendationCard.tsx',
  'XaiWarningBox.tsx',
];

function read(file: string): string {
  return fs.readFileSync(path.join(COMPONENTS_DIR, file), 'utf8');
}

describe('composants visuels = présentation pure', () => {
  test.each(VISUAL_COMPONENTS)(
    '%s n\'importe pas les services ML/recommandations',
    (file) => {
      const src = read(file);
      expect(src).not.toMatch(/services\/api\/ml/);
      expect(src).not.toMatch(/services\/api\/recommendations/);
      // Aucun appel de prédiction/génération directement dans un composant visuel.
      expect(src).not.toMatch(/\bpredict\s*\(/);
      expect(src).not.toMatch(/generateRecommendations\s*\(/);
    },
  );

  // Note : la phrase de conformité « aucune dose » est autorisée ; on bloque les
  // instructions de dose (dose + quantité), pas la mention de l'absence de dose.
  test.each(VISUAL_COMPONENTS)('%s ne contient aucune instruction de dose', (file) => {
    const src = read(file);
    expect(src).not.toMatch(/\bdose[sz]?\s+(de\s+)?\d/i);
    expect(src).not.toMatch(/\bbolus\b/i);
    expect(src).not.toMatch(/posologie/i);
    expect(src).not.toMatch(/injectez/i);
  });
});

describe('cibles tactiles ≥ 44 px (a11y)', () => {
  // Le composant partagé SelectChip est le SEUL sélecteur (puces/segments) ; il
  // garantit une zone tactile pleine ≥ MIN_TOUCH_TARGET (44 px).
  test('SelectChip applique MIN_TOUCH_TARGET et porte le onPress sur tout le contrôle', () => {
    const src = read('SelectChip.tsx');
    expect(src).toMatch(/MIN_TOUCH_TARGET/);
    expect(src).toMatch(/minHeight:\s*MIN_TOUCH_TARGET/);
    // L'interaction est portée par un Pressable (tout le contrôle), pas par le Text.
    expect(src).toMatch(/<Pressable[\s\S]*onPress=/);
  });

  // Les écrans à sélecteurs réutilisent SelectChip et ne définissent pas de
  // hauteur tactile inférieure à 44 px en dur.
  const SELECTOR_SCREENS: [string, string][] = [
    ['(patient)', 'risk.tsx'],
    ['(clinician)', 'recommendations.tsx'],
    ['(clinician)', 'xai.tsx'],
  ];
  test.each(SELECTOR_SCREENS)('%s/%s utilise SelectChip sans cible < 44 px', (dir, file) => {
    const src = fs.readFileSync(path.join(APP_DIR, dir, file), 'utf8');
    expect(src).toMatch(/SelectChip/);
    expect(src).not.toMatch(/minHeight:\s*(3\d|4[0-3])\b/);
  });

  test('patient-detail.tsx utilise SelectChip sans cible < 44 px', () => {
    const src = fs.readFileSync(path.join(APP_DIR, 'patient-detail.tsx'), 'utf8');
    expect(src).toMatch(/SelectChip/);
    expect(src).not.toMatch(/minHeight:\s*(3\d|4[0-3])\b/);
  });
});

test('séparation des rôles : l\'écran patient n\'embarque pas les actions de validation', () => {
  const patientReco = fs.readFileSync(
    path.join(APP_DIR, '(patient)', 'recommendations.tsx'),
    'utf8',
  );
  expect(patientReco).not.toMatch(/RecommendationActions/);

  const clinicianReco = fs.readFileSync(
    path.join(APP_DIR, '(clinician)', 'recommendations.tsx'),
    'utf8',
  );
  expect(clinicianReco).toMatch(/RecommendationActions/);
});
