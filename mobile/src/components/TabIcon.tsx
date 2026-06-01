/**
 * Icône d'onglet minimale (sans dépendance d'icônes).
 * L'onglet porte TOUJOURS un libellé texte : l'information n'est jamais
 * véhiculée uniquement par la couleur ou la forme.
 */
import React from 'react';
import { View } from 'react-native';
import { palette } from '@/theme/theme';

export function TabDot({ focused }: { focused: boolean }) {
  return (
    <View
      style={{
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: focused ? palette.brand : palette.borderStrong,
      }}
    />
  );
}
