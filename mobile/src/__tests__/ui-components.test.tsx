/**
 * Rendu des nouveaux composants UI (Phase 8.5) + invariants de transparence.
 * On vérifie que l'information clé reste portée par le TEXTE (jamais la couleur
 * seule) et que les rappels de conformité restent visibles.
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { Header } from '@/components/Header';
import { MetricCard } from '@/components/MetricCard';
import { PatientCard } from '@/components/PatientCard';
import { SectionTitle } from '@/components/SectionTitle';
import { ComplianceBanner } from '@/components/Banners';
import { EmptyState, LoadingState } from '@/components/States';
import { RecommendationCard } from '@/components/RecommendationCard';
import { SelectChip } from '@/components/SelectChip';

test('Header (hero) affiche titre + sous-titre', () => {
  render(<Header variant="hero" title="Cohorte" subtitle="3 patients" />);
  expect(screen.getByText('Cohorte')).toBeTruthy();
  expect(screen.getByText('3 patients')).toBeTruthy();
});

test('MetricCard affiche libellé, valeur et indice', () => {
  render(<MetricCard label="Dernière glycémie" value="120 mg/dL" hint="il y a 5 min" />);
  expect(screen.getByText('Dernière glycémie')).toBeTruthy();
  expect(screen.getByText('120 mg/dL')).toBeTruthy();
  expect(screen.getByText('il y a 5 min')).toBeTruthy();
});

test('PatientCard affiche le nom et reste actionnable (zone cliquable)', () => {
  const onPress = jest.fn();
  render(<PatientCard name="Jean Dupont" meta="Type 1" onPress={onPress} />);
  expect(screen.getByText('Jean Dupont')).toBeTruthy();
  expect(screen.getByText('Type 1')).toBeTruthy();
  // Libellé d'accessibilité explicite (pas seulement une icône).
  expect(screen.getByLabelText(/Ouvrir le dossier de Jean Dupont/i)).toBeTruthy();
});

test('SectionTitle affiche le titre', () => {
  render(<SectionTitle title="Mon profil" />);
  expect(screen.getByText('Mon profil')).toBeTruthy();
});

test('ComplianceBanner rappelle le caractère prototype / non certifié', () => {
  render(<ComplianceBanner />);
  expect(screen.getAllByText(/simulées/i).length).toBeGreaterThanOrEqual(1);
  expect(screen.getByText(/Non certifié/i)).toBeTruthy();
});

test('EmptyState rend un texte accessible', () => {
  render(<EmptyState title="Aucun patient" message="Réessayez" />);
  expect(screen.getByText('Aucun patient')).toBeTruthy();
  expect(screen.getByText('Réessayez')).toBeTruthy();
});

test('LoadingState (squelette) expose un libellé accessible', () => {
  render(<LoadingState skeleton label="Chargement" />);
  expect(screen.getByLabelText('Chargement')).toBeTruthy();
});

test('RecommendationCard affiche statut + message + rappel open-loop, sans dose', () => {
  const rec: any = {
    id: 'r1',
    status: 'approved',
    category: 'RECOMMENDATION_BEHAVIORAL',
    message: 'Pensez à vérifier votre glycémie plus tard.',
    priority: 2,
  };
  render(<RecommendationCard rec={rec} />);
  expect(screen.getByText('Approuvée')).toBeTruthy();
  expect(screen.getByText('Recommandation comportementale')).toBeTruthy();
  expect(screen.getByText(/Pensez à vérifier votre glycémie/i)).toBeTruthy();
  expect(screen.getByText(/Ne modifiez jamais votre traitement/i)).toBeTruthy();
});

test('SelectChip annonce son état sélectionné et reste un bouton accessible', () => {
  const onPress = jest.fn();
  render(<SelectChip label="Hypoglycémie (<70)" selected onPress={onPress} />);
  expect(screen.getByText('Hypoglycémie (<70)')).toBeTruthy();
  const chip = screen.getByRole('button');
  expect(chip.props.accessibilityState).toMatchObject({ selected: true });
});
