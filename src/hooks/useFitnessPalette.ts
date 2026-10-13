import { useMemo } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

import {
  darkFitnessPalette,
  lightFitnessPalette,
  type FitnessPalette,
} from '../constants/fitnessPalette';
import { useTheme } from '../contexts/ThemeContext';

export function useFitnessPalette(): FitnessPalette {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'dark' ? darkFitnessPalette : lightFitnessPalette;
}

type NamedStyles = Record<string, ViewStyle | TextStyle | ImageStyle>;

export function useFitnessStyles<T extends NamedStyles>(
  factory: (palette: FitnessPalette) => T,
): T {
  const palette = useFitnessPalette();
  return useMemo(() => StyleSheet.create(factory(palette)), [factory, palette]);
}
