import { useEffect } from 'react';
import { AppState, Platform, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';

/**
 * Hides the system status bar (time / network / battery) so the app draws
 * edge-to-edge. Swiping from the top still reveals system UI temporarily
 * (Android immersive / iOS notification shade).
 */
export function ImmersiveStatusBar() {
  useEffect(() => {
    const hide = () => {
      StatusBar.setHidden(true, 'fade');
      if (Platform.OS === 'android') {
        RNStatusBar.setHidden(true, 'fade');
      }
    };

    hide();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') hide();
    });
    return () => sub.remove();
  }, []);

  return <StatusBar hidden style="light" />;
}
