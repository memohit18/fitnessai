import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fitnessPalette as p } from '../../../constants/fitnessPalette';
import type { DashboardMealProgress } from '../../../types/dashboard';

type MealProgressCardProps = {
  meals: DashboardMealProgress;
  onOpen?: () => void;
};

export function MealProgressCard({ meals, onOpen }: MealProgressCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={styles.title}>Meals Progress</Text>
          <Text style={styles.muted}>
            {meals.assigned
              ? `${meals.completed} of ${meals.assigned} meals logged`
              : 'No meals assigned yet'}
            {meals.score != null ? ` · score ${Math.round(meals.score)}` : ''}
          </Text>
        </View>
        {onOpen ? (
          <Pressable onPress={onOpen}>
            <Text style={styles.link}>Open</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${meals.percent}%` }]} />
      </View>
      <View style={styles.stats}>
        <Stat label="Done" value={`${meals.completed}`} />
        <Stat label="Assigned" value={`${meals.assigned || '—'}`} />
        <Stat label="Skipped" value={`${meals.skipped}`} />
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: p.surface,
    borderColor: p.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  header: { flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  copy: { flex: 1, gap: 4 },
  title: { color: p.text, fontSize: 15, fontWeight: '800' },
  muted: { color: p.textSecondary, fontSize: 12, lineHeight: 16 },
  link: { color: p.lime, fontSize: 12, fontWeight: '800' },
  track: {
    backgroundColor: p.surfaceElevated,
    borderRadius: 999,
    height: 8,
    overflow: 'hidden',
  },
  fill: { backgroundColor: p.lime, height: '100%' },
  stats: { flexDirection: 'row', gap: 8 },
  stat: {
    backgroundColor: p.surfaceElevated,
    borderColor: p.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statLabel: {
    color: p.textMuted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statValue: { color: p.text, fontSize: 14, fontWeight: '800', marginTop: 4 },
});
