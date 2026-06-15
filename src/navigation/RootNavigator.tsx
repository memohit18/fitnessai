import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth, useAppDispatch } from '../hooks';
import { useTheme } from '../contexts/ThemeContext';
import { hydrateAuth } from '../store/slices/authSlice';
import { AppNavigator } from './AppNavigator';
import { AuthNavigator } from './AuthNavigator';

export function RootNavigator() {
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const { isAuthenticated, isHydrating } = useAuth();

  useEffect(() => {
    void dispatch(hydrateAuth());
  }, [dispatch]);

  if (isHydrating) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return isAuthenticated ? <AppNavigator /> : <AuthNavigator />;
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
