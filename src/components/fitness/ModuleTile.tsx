import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/ThemeContext';

export type FitnessModuleId =
  | 'meals'
  | 'workout'
  | 'diet'
  | 'progress'
  | 'transformation'
  | 'hydration';

type ModuleTileProps = {
  id: FitnessModuleId;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  status?: 'ready' | 'soon';
  onPress?: () => void;
};

export function ModuleTile({
  title,
  description,
  icon,
  status = 'soon',
  onPress,
}: ModuleTileProps) {
  const { colors } = useTheme();
  const isSoon = status === 'soon';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.glow }]}>
        <Ionicons color={colors.primary} name={icon} size={22} />
      </View>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {isSoon ? (
            <View style={[styles.badge, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.badgeText, { color: colors.textSecondary }]}>Soon</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      </View>
      <Ionicons color={colors.textSecondary} name="chevron-forward" size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
});
