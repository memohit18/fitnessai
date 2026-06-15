import { StyleSheet, Text, View } from 'react-native';

import { AppShell } from '../../components/app/AppShell';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks';

export function HomeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();

  const displayName = user?.name?.trim() || user?.email || 'there';

  return (
    <AppShell>
      <View style={styles.content}>
        <View style={[styles.badge, { backgroundColor: colors.glow, borderColor: colors.primary }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>Authenticated</Text>
        </View>

        <Text style={[styles.greeting, { color: colors.textSecondary }]}>Welcome to</Text>
        <Text style={[styles.title, { color: colors.text }]}>ThinkTank</Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          Hello, {displayName}. You are signed in and ready to go.
        </Text>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: 8,
    justifyContent: 'center',
    paddingBottom: 24,
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
});
