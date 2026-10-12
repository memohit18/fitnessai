import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { UserAvatar } from './UserAvatar';
import { updateProfile } from '../../api/profileApi';
import { uploadImage } from '../../api/imagesApi';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppDispatch } from '../../hooks';
import { pickAndPrepareImage } from '../../services/pickAndPrepareImage';
import { saveSession, loadSession } from '../../services/authSession';
import { userProfileUpdated } from '../../store/slices/authSlice';
import { getApiErrorMessage } from '../../utils/api';

type ProfileEditSheetProps = {
  visible: boolean;
  email: string;
  initialName: string;
  initialAvatar?: string | null;
  onClose: () => void;
  onSaved: (next: { name: string; avatar: string | null }) => void;
};

export function ProfileEditSheet({
  visible,
  email,
  initialName,
  initialAvatar,
  onClose,
  onSaved,
}: ProfileEditSheetProps) {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const [name, setName] = useState(initialName);
  const [avatar, setAvatar] = useState<string | null>(initialAvatar ?? null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(initialName);
    setAvatar(initialAvatar ?? null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }, [visible, initialName, initialAvatar]);

  const onPickAvatar = async () => {
    setUploading(true);
    try {
      const prepared = await pickAndPrepareImage();
      if (!prepared) return;
      const { url } = await uploadImage({
        uri: prepared.uri,
        fileName: prepared.fileName,
        mimeType: prepared.mimeType,
        type: 'avatar',
      });
      setAvatar(url);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Upload failed',
        text2: getApiErrorMessage(error, 'Unable to upload photo.'),
        position: 'bottom',
      });
    } finally {
      setUploading(false);
    }
  };

  const onSave = async () => {
    const trimmedName = name.trim();
    const passwordDirty =
      Boolean(currentPassword) ||
      Boolean(newPassword) ||
      Boolean(confirmPassword);
    const profileDirty =
      trimmedName !== initialName.trim() ||
      (avatar ?? null) !== (initialAvatar ?? null);

    if (!profileDirty && !passwordDirty) {
      onClose();
      return;
    }

    if (profileDirty && !trimmedName) {
      Toast.show({
        type: 'error',
        text1: 'Name required',
        text2: 'Enter your display name.',
        position: 'bottom',
      });
      return;
    }

    if (passwordDirty) {
      if (!currentPassword || !newPassword) {
        Toast.show({
          type: 'error',
          text1: 'Password incomplete',
          text2: 'Enter current and new password.',
          position: 'bottom',
        });
        return;
      }
      if (newPassword.length < 8) {
        Toast.show({
          type: 'error',
          text1: 'Password too short',
          text2: 'Use at least 8 characters.',
          position: 'bottom',
        });
        return;
      }
      if (newPassword !== confirmPassword) {
        Toast.show({
          type: 'error',
          text1: 'Passwords do not match',
          position: 'bottom',
        });
        return;
      }
    }

    setSaving(true);
    try {
      const payload: {
        name?: string;
        avatar?: string | null;
        currentPassword?: string;
        newPassword?: string;
      } = {};

      if (profileDirty) {
        payload.name = trimmedName;
        payload.avatar = avatar;
      }
      if (passwordDirty) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const updated = await updateProfile(payload);
      const nextName = updated.name || trimmedName;
      const nextAvatar = updated.avatar ?? avatar;

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

      onSaved({ name: nextName, avatar: nextAvatar });
      Toast.show({
        type: 'success',
        text1:
          passwordDirty && !profileDirty
            ? 'Password updated'
            : 'Profile updated',
        position: 'bottom',
      });
      onClose();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Update failed',
        text2: getApiErrorMessage(error, 'Unable to update profile.'),
        position: 'bottom',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Edit profile</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons color={colors.textSecondary} name="close" size={22} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
          >
            <Pressable
              disabled={uploading || saving}
              onPress={() => void onPickAvatar()}
              style={styles.avatarWrap}
            >
              <UserAvatar avatar={avatar} email={email} size={88} />
              <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
                {uploading ? (
                  <ActivityIndicator color="#0A140F" size="small" />
                ) : (
                  <Ionicons color="#0A140F" name="camera" size={14} />
                )}
              </View>
            </Pressable>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Tap photo to upload a new avatar
            </Text>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Name</Text>
            <TextInput
              autoCapitalize="words"
              editable={!saving}
              placeholder="Your name"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.background,
                },
              ]}
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.section, { color: colors.text }]}>
              Change password
            </Text>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Leave blank to keep your current password.
            </Text>

            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Current password
            </Text>
            <TextInput
              editable={!saving}
              placeholder="••••••••"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.background,
                },
              ]}
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>
              New password
            </Text>
            <TextInput
              editable={!saving}
              placeholder="At least 8 characters"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.background,
                },
              ]}
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Confirm new password
            </Text>
            <TextInput
              editable={!saving}
              placeholder="Repeat new password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.background,
                },
              ]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              disabled={saving}
              onPress={onClose}
              style={[styles.secondaryBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.secondaryText, { color: colors.text }]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              disabled={saving || uploading}
              onPress={() => void onSave()}
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            >
              {saving ? (
                <ActivityIndicator color="#0A140F" />
              ) : (
                <Text style={styles.primaryText}>Save</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: 20,
    paddingTop: 16,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  body: {
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  avatarWrap: {
    alignSelf: 'center',
    marginTop: 8,
  },
  cameraBadge: {
    alignItems: 'center',
    borderRadius: 999,
    bottom: 0,
    height: 28,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    width: 28,
  },
  hint: {
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  section: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 16,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 46,
    paddingHorizontal: 14,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  secondaryBtn: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  primaryBtn: {
    alignItems: 'center',
    borderRadius: 14,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryText: {
    color: '#0A140F',
    fontSize: 14,
    fontWeight: '800',
  },
});
