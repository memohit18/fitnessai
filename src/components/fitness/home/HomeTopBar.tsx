import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { UserAvatar } from '../../app/UserAvatar';
import type { FitnessPalette } from '../../../constants/fitnessPalette';
import { useFitnessPalette, useFitnessStyles } from '../../../hooks/useFitnessPalette';

type HomeTopBarProps = {
  firstName: string;
  email?: string | null;
  avatar?: string | null;
  onAvatarPress?: () => void;
  onBellPress?: () => void;
  onStreakPress?: () => void;
};

export function HomeTopBar({
  firstName,
  email,
  avatar,
  onAvatarPress,
  onBellPress,
  onStreakPress,
}: HomeTopBarProps) {
  const p = useFitnessPalette();
  const styles = useFitnessStyles(buildStyles);
  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" onPress={onAvatarPress} style={styles.identity}>
        <UserAvatar avatar={avatar} email={email} size={48} />
        <View style={styles.copy}>
          <Text style={styles.hello} numberOfLines={1}>
            Hello {firstName} 👋
          </Text>
          <Text style={styles.subtitle}>Get ready</Text>
        </View>
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={onBellPress}
          style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Ionicons color={p.text} name="notifications-outline" size={20} />
          <View style={styles.dot} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onStreakPress}
          style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Ionicons color={p.text} name="flame-outline" size={20} />
        </Pressable>
      </View>
    </View>
  );
}

function buildStyles(p: FitnessPalette) {
  return StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  identity: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    paddingRight: 12,
  },
  copy: {
    flex: 1,
    gap: 1,
    justifyContent: 'center',
  },
  hello: {
    color: p.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: p.limeSoft,
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  iconBtn: {
    alignItems: 'center',
    backgroundColor: p.surfaceElevated,
    borderColor: p.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  dot: {
    backgroundColor: p.dangerDot,
    borderRadius: 999,
    height: 8,
    position: 'absolute',
    right: 9,
    top: 9,
    width: 8,
  },
});
}

