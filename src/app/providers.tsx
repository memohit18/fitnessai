import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type ReactNode } from 'react';

import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { AuthNavigator } from '../navigation/AuthNavigator';
import { configureGoogleSignIn } from '../services/googleAuth';

function AppContent() {
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
        <AuthNavigator />
      </NavigationContainer>
    </>
  );
}

export function AppProviders({ children }: { children?: ReactNode }) {
  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  return (
    <ThemeProvider>
      {children ?? <AppContent />}
    </ThemeProvider>
  );
}
