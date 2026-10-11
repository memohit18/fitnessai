import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fitnessPalette as p } from '../../../constants/fitnessPalette';

type QuickActionsProps = {
  onStartWorkout: () => void;
  onLogMeal: () => void;
  onAddWater: () => void;
  onSleep: () => void;
};

export function QuickActions({
  onStartWorkout,
  onLogMeal,
  onAddWater,
  onSleep,
}: QuickActionsProps) {
  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        onPress={onStartWorkout}
        style={({ pressed }) => [styles.startBtn, { opacity: pressed ? 0.9 : 1 }]}
      >
        <Ionicons color={p.onLime} name="play" size={18} />
        <Text style={styles.startText}>START WORKOUT</Text>
      </Pressable>

      <View style={styles.row}>
        <ActionTile
          color={p.active}
          icon="restaurant"
          label="Log Meal"
          onPress={onLogMeal}
        />
        <ActionTile
          color={p.hydrate}
          icon="water"
          label="+ Water"
          onPress={onAddWater}
        />
        <ActionTile
          color={p.sleep}
          icon="moon"
          label="Sleep 7h 40m"
          onPress={onSleep}
        />
      </View>
    </View>
  );
}

function ActionTile({
  icon,
  label,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.tile, { opacity: pressed ? 0.88 : 1 }]}
    >
      <View style={[styles.tileIcon, { backgroundColor: `${color}22` }]}>
        <Ionicons color={color} name={icon} size={18} />
      </View>
      <Text style={styles.tileLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  startBtn: {
    alignItems: 'center',
    backgroundColor: p.lime,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    minHeight: 56,
  },
  startText: {
    color: p.onLime,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  tile: {
    alignItems: 'center',
    backgroundColor: p.surface,
    borderColor: p.border,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 14,
  },
  tileIcon: {
    alignItems: 'center',
    borderRadius: 12,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  tileLabel: {
    color: p.text,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
});
