import { useState } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { fitnessPalette as p } from '../../constants/fitnessPalette';
import { resolveFitnessMediaUrl } from '../../lib/fitness/mediaUrl';

type MediaThumbProps = {
  uri?: string | null;
  size?: number;
  radius?: number;
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
};

export function MediaThumb({
  uri,
  size = 72,
  radius = 14,
  fallbackIcon = 'image-outline',
  style,
}: MediaThumbProps) {
  const resolved = resolveFitnessMediaUrl(uri);
  const [failed, setFailed] = useState(false);

  if (!resolved || failed) {
    return (
      <View
        style={[
          styles.fallback,
          { borderRadius: radius, height: size, width: size },
          style,
        ]}
      >
        <Ionicons color={p.textMuted} name={fallbackIcon} size={Math.max(18, size * 0.32)} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: resolved }}
      style={[{ borderRadius: radius, height: size, width: size }, style]}
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    backgroundColor: p.surfaceElevated,
    borderColor: p.border,
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
