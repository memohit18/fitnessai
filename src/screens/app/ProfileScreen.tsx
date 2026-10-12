import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { getProfile } from '../../api/profileApi';
import { AppShell } from '../../components/app/AppShell';
import { ProfileEditSheet } from '../../components/app/ProfileEditSheet';
import { UserAvatar } from '../../components/app/UserAvatar';
import { FitnessProfilePanel } from '../../components/fitness/FitnessProfilePanel';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth, useAppDispatch } from '../../hooks';
import { userProfileUpdated } from '../../store/slices/authSlice';
import { loadSession, saveSession } from '../../services/authSession';

export function ProfileScreen() {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const { user, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const editOpenRef = useRef(false);
  editOpenRef.current = editOpen;
  const [avatar, setAvatar] = useState<string | null>(user?.avatar ?? null);
  const [displayName, setDisplayName] = useState(
    user?.name?.trim() || 'User',
  );
  const [phone, setPhone] = useState<string | null>(null);

  const email = user?.email ?? '—';

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        try {
          const profile = await getProfile();
          if (!active || editOpenRef.current) return;
          const nextName = profile.name?.trim() || user?.name?.trim() || 'User';
          const nextAvatar = profile.avatar ?? null;
          setDisplayName(nextName);
          setPhone(profile.phone);
          setAvatar(nextAvatar);
          dispatch(
            userProfileUpdated({
              name: nextName,
              avatar: nextAvatar,
            }),
          );
          const session = await loadSession();
          if (session) {
            await saveSession({
              ...session,
              user: {
                ...session.user,
                name: nextName,
                avatar: nextAvatar,
              },
            });
          }
        } catch {
          // Keep local session values if profile fetch fails.
        }
      })();
      return () => {
        active = false;
      };
    }, [dispatch, user?.name]),
  );

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
          <UserAvatar avatar={avatar} email={email} size={80} />
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={[styles.email, { color: colors.textSecondary }]} numberOfLines={1}>
            {email}
          </Text>
          <Pressable
            onPress={() => setEditOpen(true)}
            style={[styles.editBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.editText, { color: colors.text }]}>Edit profile</Text>
          </Pressable>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Account</Text>
          <DetailRow label="Name" value={displayName} colors={colors} />
          <DetailRow label="Phone" value={phone?.trim() || '—'} colors={colors} />
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

      <ProfileEditSheet
        email={email === '—' ? '' : email}
        initialAvatar={avatar}
        initialName={displayName === 'User' ? '' : displayName}
        initialPhone={phone}
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={({ name, phone: nextPhone, avatar: nextAvatar }) => {
          setDisplayName(name.trim() || 'User');
          setPhone(nextPhone);
          setAvatar(nextAvatar);
        }}
      />
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
  editBtn: {
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  editText: {
    fontSize: 14,
    fontWeight: '700',
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
