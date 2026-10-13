import { StyleSheet, Text, View } from 'react-native';

import { ProgressRing } from './ProgressRing';
import type { FitnessPalette } from '../../../constants/fitnessPalette';
import { useFitnessPalette, useFitnessStyles } from '../../../hooks/useFitnessPalette';
import type { DashboardMacro } from '../../../types/dashboard';

type MacroSummaryCardProps = {
  calories: DashboardMacro;
  protein: DashboardMacro;
};

export function MacroSummaryCard({ calories, protein }: MacroSummaryCardProps) {
  const p = useFitnessPalette();
  const styles = useFitnessStyles(buildStyles);
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Calories & Protein</Text>
      <Text style={styles.muted}>Remaining macros for today.</Text>
      <View style={styles.rings}>
        <ProgressRing
          color={p.active}
          label="kcal"
          max={Math.max(1, calories.goal)}
          size={100}
          sublabel={`${Math.round(calories.current)}/${Math.round(calories.goal)}`}
          value={calories.current}
        />
        <ProgressRing
          color={p.burn}
          label="protein"
          max={Math.max(1, protein.goal)}
          size={100}
          sublabel={`${Math.round(protein.current)}/${Math.round(protein.goal)}g`}
          value={protein.current}
        />
      </View>
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Remaining cal</Text>
          <Text style={styles.statValue}>{Math.round(calories.remaining)}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Remaining protein</Text>
          <Text style={styles.statValue}>{Math.round(protein.remaining)}g</Text>
        </View>
      </View>
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
    gap: 8,
    padding: 16,
  },
  title: { color: p.text, fontSize: 15, fontWeight: '800' },
  muted: { color: p.textSecondary, fontSize: 12 },
  rings: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
    paddingVertical: 4,
  },
  stats: { flexDirection: 'row', gap: 8, marginTop: 4 },
  stat: {
    backgroundColor: p.surfaceElevated,
    borderColor: p.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statLabel: {
    color: p.textMuted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statValue: { color: p.text, fontSize: 16, fontWeight: '800', marginTop: 4 },
});
}

