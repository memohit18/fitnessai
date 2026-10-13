import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Top padding when the system status bar is hidden.
 * Uses the safe-area inset so content clears the notch / Dynamic Island
 * on every screen that goes through AppShell / Screen.
 */
export function useImmersiveTopPad() {
  const insets = useSafeAreaInsets();
  // Flat devices / many Androids: small breathing room under the edge.
  if (insets.top <= 24) return Math.max(insets.top, 10);
  // Notched / Dynamic Island: stay below the cutout (slight tuck vs full inset).
  return Math.max(insets.top - 4, 44);
}
