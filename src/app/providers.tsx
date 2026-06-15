import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type ReactNode } from 'react';
import { Provider as ReduxProvider } from 'react-redux';

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
  }, []);

  return (
    <ReduxProvider store={store}>
      <ThemeProvider>{children ?? <NavigationRoot />}</ThemeProvider>
    </ReduxProvider>
  );
}
