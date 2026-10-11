import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type ReactNode } from 'react';
import Toast from 'react-native-toast-message';
import { Provider as ReduxProvider } from 'react-redux';

import { VersionGate } from '../components/app/VersionGate';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { RootNavigator } from '../navigation/RootNavigator';
import { configureGoogleSignIn } from '../services/googleAuth';
import { store } from '../store';

function NavigationRoot() {
  const { colors, resolvedTheme } = useTheme();

  const navigationTheme =
    resolvedTheme === 'dark'
      ? {
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            background: colors.background,
            card: colors.surface,
            text: colors.text,
            border: colors.border,
            primary: colors.primary,
          },
        }
      : {
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            background: colors.background,
            card: colors.surface,
            text: colors.text,
            border: colors.border,
            primary: colors.primary,
          },
        };

  return (
    <>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer theme={navigationTheme}>
        <RootNavigator />
      </NavigationContainer>
    </>
  );
}

export function AppProviders({ children }: { children?: ReactNode }) {
  useEffect(() => {
    configureGoogleSignIn();

    // Hide Expo Dev Client floating gear so it doesn't cover the tab bar.
    if (__DEV__) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { requireOptionalNativeModule } = require('expo-modules-core') as {
          requireOptionalNativeModule: (name: string) => {
            setPreferencesAsync?: (settings: Record<string, boolean>) => Promise<void>;
          } | null;
        };
        const prefs = requireOptionalNativeModule('DevMenuPreferences');
        void prefs?.setPreferencesAsync?.({ showFloatingActionButton: false });
      } catch {
        // Dev menu not available outside development builds.
      }
    }
  }, []);

  return (
    <ReduxProvider store={store}>
      <ThemeProvider>
        <VersionGate>{children ?? <NavigationRoot />}</VersionGate>
        <Toast />
      </ThemeProvider>
    </ReduxProvider>
  );
}
