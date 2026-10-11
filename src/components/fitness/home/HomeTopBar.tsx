import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { UserAvatar } from '../../app/UserAvatar';
import { fitnessPalette as p } from '../../../constants/fitnessPalette';

type HomeTopBarProps = {
  firstName: string;
  email?: string | null;
  onAvatarPress?: () => void;
  onBellPress?: () => void;
  onStreakPress?: () => void;
};

export function HomeTopBar({
  firstName,
  email,
  onAvatarPress,
  onBellPress,
  onStreakPress,
}: HomeTopBarProps) {
  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" onPress={onAvatarPress} style={styles.identity}>
        <UserAvatar email={email} size={48} />
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

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    gap: 2,
  },
  hello: {
    color: p.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: p.textSecondary,
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
    borderRadius: 999,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  dot: {
    backgroundColor: p.dangerDot,
    borderRadius: 999,
    height: 8,
    position: 'absolute',
    right: 10,
    top: 10,
    width: 8,
  },
});
