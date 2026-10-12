import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  InteractionManager,
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
import {
  pickAndPrepareImage,
  type PreparedImage,
} from '../../services/pickAndPrepareImage';
import { saveSession, loadSession } from '../../services/authSession';
import { userProfileUpdated } from '../../store/slices/authSlice';
import { getApiErrorMessage } from '../../utils/api';

type ProfileEditSheetProps = {
  visible: boolean;
  email: string;
  initialName: string;
  initialPhone?: string | null;
  initialAvatar?: string | null;
  onClose: () => void;
  onSaved: (next: { name: string; phone: string | null; avatar: string | null }) => void;
};

export function ProfileEditSheet({
  visible,
  email,
  initialName,
  initialPhone,
  initialAvatar,
  onClose,
  onSaved,
}: ProfileEditSheetProps) {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone ?? '');
  const [avatar, setAvatar] = useState<string | null>(initialAvatar ?? null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<PreparedImage | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const wasVisible = useRef(false);

  useEffect(() => {
    if (visible && !wasVisible.current) {
      setName(initialName);
      setPhone(initialPhone ?? '');
      setAvatar(initialAvatar ?? null);
      setPreviewUri(null);
      setPendingPhoto(null);
      setShowPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    wasVisible.current = visible;
  }, [visible, initialName, initialPhone, initialAvatar]);

  const trimmedName = name.trim();
  const trimmedPhone = phone.trim();
  const passwordDirty =
    Boolean(currentPassword) || Boolean(newPassword) || Boolean(confirmPassword);
  const nameDirty = trimmedName !== initialName.trim();
  const phoneDirty = trimmedPhone !== (initialPhone ?? '').trim();
  const photoDirty =
    previewUri != null || (avatar ?? null) !== (initialAvatar ?? null);
  const profileDirty = nameDirty || phoneDirty || photoDirty;
  const canSave = (profileDirty || passwordDirty) && !saving;

  const onPickAvatar = async () => {
    try {
      const prepared = await pickAndPrepareImage();
      if (!prepared) return;

      await new Promise<void>((resolve) => {
        InteractionManager.runAfterInteractions(() => resolve());
      });
      setPreviewUri(prepared.uri);
      setPendingPhoto(prepared);
      setUploading(true);
      const { url } = await uploadImage({
        uri: prepared.uri,
        fileName: prepared.fileName,
        mimeType: prepared.mimeType,
        type: 'avatar',
      });
      setAvatar(url);
      setPendingPhoto(null);
      Toast.show({
        type: 'success',
        text1: 'Photo ready',
        text2: 'Tap Save to keep this avatar.',
        position: 'bottom',
      });
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
    if (!canSave) return;

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
      let avatarUrl = avatar;
      if (pendingPhoto) {
        const uploaded = await uploadImage({
          uri: pendingPhoto.uri,
          fileName: pendingPhoto.fileName,
          mimeType: pendingPhoto.mimeType,
          type: 'avatar',
        });
        avatarUrl = uploaded.url;
        setAvatar(uploaded.url);
        setPendingPhoto(null);
      }

      const payload: {
        name?: string;
        phone?: string | null;
        avatar?: string | null;
        currentPassword?: string;
        newPassword?: string;
      } = {};

      if (nameDirty) payload.name = trimmedName;
      if (phoneDirty) payload.phone = trimmedPhone || null;
      if (photoDirty) payload.avatar = avatarUrl;
      if (passwordDirty) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const updated = await updateProfile(payload);
      const nextName = updated.name || trimmedName;
      const nextPhone = updated.phone ?? (trimmedPhone || null);
      const nextAvatar = updated.avatar ?? avatarUrl;

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

      onSaved({ name: nextName, phone: nextPhone, avatar: nextAvatar });
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
              {previewUri ? (
                <Image source={{ uri: previewUri }} style={styles.preview} />
              ) : (
                <UserAvatar avatar={avatar} email={email} size={88} />
              )}
              <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
                {uploading ? (
                  <ActivityIndicator color="#0A140F" size="small" />
                ) : (
                  <Ionicons color="#0A140F" name="camera" size={14} />
                )}
              </View>
            </Pressable>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              {uploading
                ? 'Uploading photo…'
                : previewUri
                  ? 'New photo ready. Tap Save to keep it.'
                  : 'Tap photo to upload a new avatar'}
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

            <Text style={[styles.label, { color: colors.textSecondary }]}>Phone</Text>
            <TextInput
              autoComplete="tel"
              editable={!saving}
              keyboardType="phone-pad"
              placeholder="Phone number"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.background,
                },
              ]}
              textContentType="telephoneNumber"
              value={phone}
              onChangeText={setPhone}
            />

            <Pressable
              disabled={saving}
              onPress={() => setShowPassword((open) => !open)}
              style={styles.passwordToggle}
            >
              <Text style={[styles.section, { color: colors.text }]}>
                Change password
              </Text>
              <Ionicons
                color={colors.textSecondary}
                name={showPassword ? 'chevron-up' : 'chevron-down'}
                size={18}
              />
            </Pressable>

            {showPassword ? (
              <>
                <Text style={[styles.hint, styles.passwordHint, { color: colors.textSecondary }]}>
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
              </>
            ) : null}
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
              disabled={!canSave}
              onPress={() => void onSave()}
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: canSave ? 1 : 0.4,
                },
              ]}
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
  preview: {
    borderColor: '#C6F54A',
    borderRadius: 999,
    borderWidth: 2,
    height: 88,
    width: 88,
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
  },
  passwordToggle: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  passwordHint: {
    textAlign: 'left',
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
