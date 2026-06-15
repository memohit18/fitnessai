import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks';
import { logAuthState } from '../../utils/authLogger';

export function HomeScreen() {
  const { colors } = useTheme();
  const { user, accessToken, isAuthenticated, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName = user?.name?.trim() || user?.email || 'there';

  useEffect(() => {
    logAuthState(isAuthenticated, user?.email, Boolean(accessToken));
  }, [isAuthenticated, user?.email, accessToken]);

  const onLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <ThemeToggle />
      </View>

      <View style={styles.content}>
        <View style={[styles.badge, { backgroundColor: colors.glow, borderColor: colors.primary }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>Authenticated</Text>
        </View>

        <Text style={[styles.greeting, { color: colors.textSecondary }]}>Welcome to</Text>
        <Text style={[styles.title, { color: colors.text }]}>ThinkTank</Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          Hello, {displayName}. You are signed in and ready to go.
        </Text>
        {user?.email ? (
          <Text style={[styles.email, { color: colors.textSecondary }]}>{user.email}</Text>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={isLoggingOut}
        onPress={() => void onLogout()}
        style={({ pressed }) => [
          styles.logoutButton,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: isLoggingOut ? 0.6 : pressed ? 0.85 : 1,
          },
        ]}
      >
        {isLoggingOut ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={[styles.logoutText, { color: colors.error }]}>Log out</Text>
        )}
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'flex-end',
    paddingTop: 8,
  },
  content: {
    flex: 1,
    gap: 8,
    justifyContent: 'center',
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  greeting: {
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
  },
  email: {
    fontSize: 14,
    marginTop: 4,
  },
  logoutButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    marginBottom: 24,
    minHeight: 52,
    paddingHorizontal: 20,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
