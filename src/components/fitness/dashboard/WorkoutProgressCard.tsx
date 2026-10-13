import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { FitnessPalette } from '../../../constants/fitnessPalette';
import { useFitnessPalette, useFitnessStyles } from '../../../hooks/useFitnessPalette';
import type { DashboardWorkoutProgress } from '../../../types/dashboard';

type WorkoutProgressCardProps = {
  workout: DashboardWorkoutProgress;
  onOpen?: () => void;
};

export function WorkoutProgressCard({
  workout,
  onOpen,
}: WorkoutProgressCardProps) {
  const p = useFitnessPalette();
  const styles = useFitnessStyles(buildStyles);
  const percent = workout.completed
    ? 100
    : Math.min(100, Math.max(0, workout.score ?? 0));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={styles.title}>Workout Progress</Text>
          <Text style={styles.muted}>
            {workout.completed ? 'Session complete' : 'Ready when you are'}
          </Text>
        </View>
        {onOpen ? (
          <Pressable onPress={onOpen}>
            <Text style={styles.link}>Open</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
      <View style={styles.stats}>
        <Stat label="Status" value={workout.completed ? 'Done' : 'Pending'} />
        <Stat
          label="Score"
          value={workout.score != null ? `${Math.round(workout.score)}` : '—'}
        />
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const p = useFitnessPalette();
  const styles = useFitnessStyles(buildStyles);
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function buildStyles(p: FitnessPalette) {
  return StyleSheet.create({
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
}

