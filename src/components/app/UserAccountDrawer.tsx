import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getProfile } from '../../api/profileApi';
import { ProfileEditSheet } from './ProfileEditSheet';
import { SideDrawer } from './SideDrawer';
import { UserAvatar } from './UserAvatar';
import type { FitnessPalette } from '../../constants/fitnessPalette';
import { useFitnessPalette, useFitnessStyles } from '../../hooks/useFitnessPalette';
import { useAuth, useAppDispatch } from '../../hooks';
import { userProfileUpdated } from '../../store/slices/authSlice';
import { loadSession, saveSession } from '../../services/authSession';

type UserAccountDrawerProps = {
  visible: boolean;
  onClose: () => void;
};

export function UserAccountDrawer({ visible, onClose }: UserAccountDrawerProps) {
  const p = useFitnessPalette();
  const styles = useFitnessStyles(buildStyles);
  const dispatch = useAppDispatch();
  const { user, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const editOpenRef = useRef(false);
  editOpenRef.current = editOpen;
  const [avatar, setAvatar] = useState<string | null>(user?.avatar ?? null);
  const [displayName, setDisplayName] = useState(user?.name?.trim() || 'User');
  const [phone, setPhone] = useState<string | null>(null);

  const email = user?.email ?? '—';

  const loadProfile = useCallback(async () => {
    try {
      const profile = await getProfile();
      if (editOpenRef.current) return;
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
  }, [dispatch, user?.name]);

  useEffect(() => {
    if (!visible) return;
    setAvatar(user?.avatar ?? null);
    setDisplayName(user?.name?.trim() || 'User');
    void loadProfile();
  }, [loadProfile, user?.avatar, user?.name, visible]);

  const onLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      onClose();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <SideDrawer side="left" visible={visible} onClose={onClose}>
        <View style={styles.header}>
          <Text style={styles.title}>Account</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={styles.closeBtn}
          >
            <Ionicons color={p.text} name="close" size={20} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileCard}>
            <UserAvatar avatar={avatar} email={email} size={72} />
            <Text style={styles.name} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {email}
            </Text>
            <Pressable onPress={() => setEditOpen(true)} style={styles.editBtn}>
              <Text style={styles.editText}>Edit profile</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Details</Text>
            <DetailRow label="Name" value={displayName} />
            <DetailRow label="Phone" value={phone?.trim() || '—'} />
            <DetailRow label="Email" value={email} />
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={isLoggingOut}
            onPress={() => void onLogout()}
            style={({ pressed }) => [
              styles.logoutButton,
              { opacity: isLoggingOut ? 0.6 : pressed ? 0.85 : 1 },
            ]}
          >
            {isLoggingOut ? (
              <ActivityIndicator color={p.burn} />
            ) : (
              <Text style={styles.logoutText}>Log out</Text>
            )}
          </Pressable>
        </ScrollView>
      </SideDrawer>

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
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const styles = useFitnessStyles(buildStyles);
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function buildStyles(p: FitnessPalette) {
  return StyleSheet.create({
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingBottom: 10,
    },
    title: {
      color: p.text,
      fontSize: 20,
      fontWeight: '800',
    },
    closeBtn: {
      alignItems: 'center',
      backgroundColor: p.surfaceElevated,
      borderColor: p.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    content: {
      gap: 14,
      paddingBottom: 28,
      paddingHorizontal: 18,
    },
    profileCard: {
      alignItems: 'center',
      backgroundColor: p.surfaceElevated,
      borderColor: p.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 20,
    },
    name: {
      color: p.text,
      fontSize: 20,
      fontWeight: '800',
      marginTop: 6,
    },
    email: {
      color: p.textSecondary,
      fontSize: 13,
    },
    editBtn: {
      borderColor: p.border,
      borderRadius: 12,
      borderWidth: 1,
      marginTop: 10,
      paddingHorizontal: 14,
      paddingVertical: 9,
    },
    editText: {
      color: p.text,
      fontSize: 13,
      fontWeight: '700',
    },
    card: {
      backgroundColor: p.surfaceElevated,
      borderColor: p.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 4,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    sectionLabel: {
      color: p.textMuted,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.6,
      marginBottom: 4,
      textTransform: 'uppercase',
    },
    detailRow: {
      borderBottomColor: p.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      gap: 4,
      paddingVertical: 12,
    },
    detailLabel: {
      color: p.textMuted,
      fontSize: 12,
      fontWeight: '600',
    },
    detailValue: {
      color: p.text,
      fontSize: 15,
      fontWeight: '600',
    },
    logoutButton: {
      alignItems: 'center',
      backgroundColor: p.surfaceElevated,
      borderColor: p.border,
      borderRadius: 16,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 50,
    },
    logoutText: {
      color: p.burn,
      fontSize: 15,
      fontWeight: '800',
    },
  });
}
