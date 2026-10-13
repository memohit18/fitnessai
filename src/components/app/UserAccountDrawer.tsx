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
import { ThemeToggle } from '../ui/ThemeToggle';
import type { FitnessPalette } from '../../constants/fitnessPalette';
import { useTheme } from '../../contexts/ThemeContext';
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
  const { mode } = useTheme();
  const dispatch = useAppDispatch();
  const { user, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  /** Account drawer should hide while edit sheet is up (no nested Modals on iOS). */
  const [editing, setEditing] = useState(false);
  /** Edit sheet Modal visibility — delayed slightly after drawer closes. */
  const [editSheetVisible, setEditSheetVisible] = useState(false);
  const editOpenRef = useRef(false);
  editOpenRef.current = editing || editSheetVisible;
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
    if (!visible) {
      setEditing(false);
      setEditSheetVisible(false);
      return;
    }
    setAvatar(user?.avatar ?? null);
    setDisplayName(user?.name?.trim() || 'User');
    void loadProfile();
  }, [loadProfile, user?.avatar, user?.name, visible]);

  useEffect(() => {
    if (!editing) {
      setEditSheetVisible(false);
      return;
    }
    // Let the account drawer Modal dismiss before presenting the edit Modal.
    const timer = setTimeout(() => setEditSheetVisible(true), 280);
    return () => clearTimeout(timer);
  }, [editing]);

  const onLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      setEditing(false);
      setEditSheetVisible(false);
      onClose();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const openEdit = () => {
    setEditing(true);
  };

  const closeEdit = () => {
    setEditSheetVisible(false);
    setEditing(false);
    void loadProfile();
  };

  // Keep the host mounted while editing so state survives; only one Modal is visible at a time.
  const drawerVisible = visible && !editing;

  return (
    <>
      <SideDrawer
        side="left"
        visible={drawerVisible}
        onClose={() => {
          setEditing(false);
          setEditSheetVisible(false);
          onClose();
        }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Account</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setEditing(false);
              setEditSheetVisible(false);
              onClose();
            }}
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
            <Pressable
              accessibilityRole="button"
              onPress={openEdit}
              style={({ pressed }) => [
                styles.editBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Ionicons color={p.lime} name="create-outline" size={16} />
              <Text style={styles.editText}>Edit profile</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Details</Text>
            <DetailRow label="Name" value={displayName} />
            <DetailRow label="Phone" value={phone?.trim() || '—'} />
            <DetailRow label="Email" value={email} />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Appearance</Text>
            <View style={styles.themeRow}>
              <View style={styles.themeCopy}>
                <Text style={styles.themeTitle}>
                  {mode === 'dark' ? 'Dark' : 'Light'} theme
                </Text>
                <Text style={styles.themeHint}>Applies across the app</Text>
              </View>
              <ThemeToggle />
            </View>
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
        visible={editSheetVisible}
        onClose={closeEdit}
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
      alignItems: 'center',
      borderColor: p.border,
      borderRadius: 12,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 8,
      marginTop: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
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
    themeRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
      paddingVertical: 6,
    },
    themeCopy: {
      flex: 1,
      gap: 2,
    },
    themeTitle: {
      color: p.text,
      fontSize: 15,
      fontWeight: '700',
    },
    themeHint: {
      color: p.textSecondary,
      fontSize: 12,
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
