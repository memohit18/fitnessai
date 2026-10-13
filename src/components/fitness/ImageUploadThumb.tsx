import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { MediaThumb } from './MediaThumb';
import type { FitnessPalette } from '../../constants/fitnessPalette';
import { useFitnessPalette, useFitnessStyles } from '../../hooks/useFitnessPalette';
import { pickAndPrepareImage } from '../../services/pickAndPrepareImage';
import { getApiErrorMessage } from '../../utils/api';

type ImageUploadThumbProps = {
  uri?: string | null;
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
  size?: number;
  onUpload: (prepared: {
    uri: string;
    fileName: string;
    mimeType: string;
  }) => Promise<string | null | void>;
};

export function ImageUploadThumb({
  uri,
  fallbackIcon = 'image-outline',
  size = 78,
  onUpload,
}: ImageUploadThumbProps) {
  const p = useFitnessPalette();
  const styles = useFitnessStyles(buildStyles);
  const [busy, setBusy] = useState(false);
  const [localUri, setLocalUri] = useState<string | null>(null);

  const onPress = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const prepared = await pickAndPrepareImage();
      if (!prepared) return;
      const nextUrl = await onUpload(prepared);
      if (typeof nextUrl === 'string' && nextUrl.trim()) {
        setLocalUri(nextUrl);
      } else {
        setLocalUri(prepared.uri);
      }
      Toast.show({
        type: 'success',
        text1: 'Image updated',
        position: 'bottom',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Upload failed',
        text2: getApiErrorMessage(error, 'Unable to upload image.'),
        position: 'bottom',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Upload image"
      disabled={busy}
      onPress={() => void onPress()}
      style={({ pressed }) => [
        styles.wrap,
        { height: size, opacity: pressed || busy ? 0.85 : 1, width: size },
      ]}
    >
      <MediaThumb
        key={localUri ?? uri ?? 'empty'}
        fallbackIcon={fallbackIcon}
        radius={16}
        size={size}
        uri={localUri ?? uri}
      />
      <View style={styles.badge}>
        {busy ? (
          <ActivityIndicator color={p.onLime} size="small" />
        ) : (
          <Ionicons color={p.onLime} name="camera" size={14} />
        )}
      </View>
    </Pressable>
  );
}

function buildStyles(p: FitnessPalette) {
  return StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  badge: {
    alignItems: 'center',
    backgroundColor: p.lime,
    borderRadius: 999,
    bottom: -2,
    height: 26,
    justifyContent: 'center',
    position: 'absolute',
    right: -2,
    width: 26,
  },
});
}

