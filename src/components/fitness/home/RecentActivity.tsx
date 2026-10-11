import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { fitnessPalette as p } from '../../../constants/fitnessPalette';

type RecentActivityProps = {
  onFilterPress?: () => void;
  onItemPress?: (title: string) => void;
};

function ProgressRing({
  progress,
  color,
  icon,
}: {
  progress: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const size = 54;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, progress));

  return (
    <View style={styles.ringWrap}>
      <Svg height={size} width={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke={color}
          strokeDasharray={`${circumference * clamped} ${circumference}`}
          strokeLinecap="round"
          strokeWidth={stroke}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.ringIcon}>
        <Ionicons color={color} name={icon} size={20} />
      </View>
    </View>
  );
}

export function RecentActivity({ onFilterPress, onItemPress }: RecentActivityProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Activity</Text>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={onFilterPress}>
          <Ionicons color={p.textSecondary} name="options-outline" size={20} />
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => onItemPress?.('Walking')}
        style={({ pressed }) => [styles.card, { opacity: pressed ? 0.9 : 1 }]}
      >
        <ProgressRing color={p.lime} icon="walk" progress={0.78} />
        <View style={styles.copy}>
          <Text style={styles.itemTitle}>Walking</Text>
          <Text style={styles.itemMeta}>Today · synced when steps land</Text>
        </View>
        <Text style={styles.metric}>
          — <Text style={styles.metricUnit}>/steps</Text>
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={() => onItemPress?.('Workout')}
        style={({ pressed }) => [styles.card, { opacity: pressed ? 0.9 : 1 }]}
      >
        <View style={[styles.solidIcon, { backgroundColor: 'rgba(255,77,106,0.18)' }]}>
          <Ionicons color={p.burn} name="barbell" size={20} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.itemTitle}>Workout</Text>
          <Text style={styles.itemMeta}>Log sessions from Workout tab</Text>
        </View>
        <Text style={styles.metric}>
          — <Text style={styles.metricUnit}>/min</Text>
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: p.text,
    fontSize: 18,
    fontWeight: '800',
  },
  card: {
    alignItems: 'center',
    backgroundColor: p.surface,
    borderColor: p.border,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  ringWrap: {
    alignItems: 'center',
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  ringIcon: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solidIcon: {
    alignItems: 'center',
    borderRadius: 999,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  itemTitle: {
    color: p.text,
    fontSize: 16,
    fontWeight: '700',
  },
  itemMeta: {
    color: p.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  metric: {
    color: p.text,
    fontSize: 18,
    fontWeight: '800',
  },
  metricUnit: {
    color: p.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
});
