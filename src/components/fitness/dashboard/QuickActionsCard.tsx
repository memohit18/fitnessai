import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { fitnessPalette as p } from '../../../constants/fitnessPalette';

type ActionKey =
  | 'meals'
  | 'workout'
  | 'diet'
  | 'progress'
  | 'transformation'
  | 'hydration';

const ACTIONS: {
  key: ActionKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'meals', label: 'Log meals', icon: 'restaurant-outline' },
  { key: 'workout', label: 'Start workout', icon: 'barbell-outline' },
  { key: 'diet', label: 'View diet', icon: 'nutrition-outline' },
  { key: 'progress', label: 'Progress', icon: 'trending-up-outline' },
  { key: 'transformation', label: 'Transformation', icon: 'sparkles-outline' },
  { key: 'hydration', label: 'Hydration', icon: 'water-outline' },
];

type QuickActionsCardProps = {
  onAction: (key: ActionKey) => void;
};

export function QuickActionsCard({ onAction }: QuickActionsCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Quick Actions</Text>
      <Text style={styles.muted}>Jump into the next execution step.</Text>
      <View style={styles.grid}>
        {ACTIONS.map((action) => (
          <Pressable
            key={action.key}
            onPress={() => onAction(action.key)}
            style={({ pressed }) => [
              styles.tile,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons color={p.lime} name={action.icon} size={16} />
            <Text style={styles.tileLabel}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: p.surface,
    borderColor: p.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  title: { color: p.text, fontSize: 15, fontWeight: '800' },
  muted: { color: p.textSecondary, fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  tile: {
    alignItems: 'center',
    backgroundColor: p.surfaceElevated,
    borderColor: p.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    width: '48%',
  },
  tileLabel: { color: p.text, flex: 1, fontSize: 12, fontWeight: '700' },
});
