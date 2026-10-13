import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppShell } from '../../components/app/AppShell';
import { UserAccountDrawer } from '../../components/app/UserAccountDrawer';
import { UserAvatar } from '../../components/app/UserAvatar';
import { FitnessProfilePanel } from '../../components/fitness/FitnessProfilePanel';
import type { FitnessPalette } from '../../constants/fitnessPalette';
import { useFitnessPalette, useFitnessStyles } from '../../hooks/useFitnessPalette';
import { useAuth } from '../../hooks';

export function ProfileScreen() {
  const p = useFitnessPalette();
  const styles = useFitnessStyles(buildStyles);
  const { user } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);

  const firstName = useMemo(() => {
    const name = user?.name?.trim();
    if (name) return name.split(/\s+/)[0] || name;
    const email = user?.email?.trim();
    if (email?.includes('@')) return email.split('@')[0] || 'there';
    return email || 'there';
  }, [user?.email, user?.name]);

  return (
    <AppShell backgroundColor={p.bg} contentStyle={styles.shell} hideHeader>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setAccountOpen(true)}
            style={styles.identity}
          >
            <UserAvatar avatar={user?.avatar} email={user?.email} size={48} />
            <View style={{ flex: 1 }}>
              <Text style={styles.hello} numberOfLines={1}>
                Hello {firstName}
              </Text>
              <Text style={styles.subtitle}>Fitness profile</Text>
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setAccountOpen(true)}
            style={styles.iconBtn}
          >
            <Ionicons color={p.text} name="person-outline" size={18} />
          </Pressable>
        </View>

        <Text style={styles.eyebrow}>Profile</Text>
        <Text style={styles.title}>Your fitness profile</Text>
        <Text style={styles.muted}>
          Goals, metrics, and setup synced with FitForge.
        </Text>

        <FitnessProfilePanel />
      </ScrollView>

      <UserAccountDrawer
        visible={accountOpen}
        onClose={() => setAccountOpen(false)}
      />
    </AppShell>
  );
}

function buildStyles(p: FitnessPalette) {
  return StyleSheet.create({
    shell: { backgroundColor: p.bg, flex: 1, paddingHorizontal: 0 },
    content: {
      gap: 14,
      paddingBottom: 110,
      paddingHorizontal: 18,
      paddingTop: 12,
    },
    topRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
      minHeight: 52,
      paddingTop: 4,
    },
    identity: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      gap: 12,
    },
    hello: {
      color: p.text,
      fontSize: 18,
      fontWeight: '800',
    },
    subtitle: {
      color: p.limeSoft,
      fontSize: 13,
      fontWeight: '600',
    },
    iconBtn: {
      alignItems: 'center',
      backgroundColor: p.surface,
      borderColor: p.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    eyebrow: {
      color: p.lime,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    title: { color: p.text, fontSize: 28, fontWeight: '800' },
    muted: { color: p.textSecondary, fontSize: 13, lineHeight: 18 },
  });
}
