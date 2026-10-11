import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppShell } from '../../components/app/AppShell';
import { UserAvatar } from '../../components/app/UserAvatar';
import { FitnessProfilePanel } from '../../components/fitness/FitnessProfilePanel';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks';

export function ProfileScreen() {
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName = user?.name?.trim() || 'User';
  const email = user?.email ?? '—';

  const onLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <AppShell contentStyle={styles.shellContent} title="Profile">
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.card,
            styles.profileCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <UserAvatar email={email} size={80} />
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={[styles.email, { color: colors.textSecondary }]} numberOfLines={1}>
            {email}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Account</Text>
          <DetailRow label="Name" value={displayName} colors={colors} />
          <DetailRow label="Email" value={email} colors={colors} />
        </View>

        <FitnessProfilePanel />

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
            <ActivityIndicator color={colors.error} />
          ) : (
            <Text style={[styles.logoutText, { color: colors.error }]}>Log out</Text>
          )}
        </Pressable>
      </ScrollView>
    </AppShell>
  );
}

function DetailRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: { text: string; textSecondary: string; border: string };
}) {
  return (
    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shellContent: {
    paddingHorizontal: 0,
  },
  content: {
    gap: 16,
    paddingBottom: 28,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 22,
  },
  profileCard: {
    alignItems: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
  },
  email: {
    fontSize: 14,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  logoutButton: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
