/**
 * Icône d'onglet minimale (sans dépendance d'icônes).
 * L'onglet porte TOUJOURS un libellé texte : l'information n'est jamais
 * véhiculée uniquement par la couleur ou la forme. L'état actif est renforcé
 * par une pastille allongée (forme + couleur).
 */
import React from 'react';
import { View } from 'react-native';
import { palette } from '@/theme/theme';

export function TabDot({ focused }: { focused: boolean }) {
  return (
    <View
      style={{
        width: focused ? 18 : 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: focused ? palette.brand : palette.borderStrong,
      }}
    />
  );
}
