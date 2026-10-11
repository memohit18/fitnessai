import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { fitnessPalette as p } from '../../../constants/fitnessPalette';
import type { DashboardBreakdown } from '../../../types/dashboard';

type ComplianceCardProps = {
  compliancePercent: number | null;
  streakDays: number | null;
  longestStreak?: number | null;
  breakdown?: DashboardBreakdown | null;
};

export function ComplianceCard({
  compliancePercent,
  streakDays,
  longestStreak,
  breakdown,
}: ComplianceCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Compliance & Streak</Text>
      <Text style={styles.muted}>
        Consistency across meals, workout, and hydration.
      </Text>
      <View style={styles.row}>
        <View style={[styles.panel, styles.compliance]}>
          <View style={styles.panelHead}>
            <Ionicons color={p.lime} name="locate" size={14} />
            <Text style={styles.panelLabel}>Compliance</Text>
          </View>
          <Text style={styles.big}>
            {compliancePercent != null
              ? `${Math.round(compliancePercent)}%`
              : '—'}
          </Text>
        </View>
        <View style={styles.panel}>
          <View style={styles.panelHead}>
            <Ionicons color={p.active} name="flame" size={14} />
            <Text style={styles.panelLabel}>Current streak</Text>
          </View>
          <Text style={styles.big}>
            {streakDays != null ? streakDays : '—'}
            <Text style={styles.days}> days</Text>
          </Text>
          {longestStreak != null ? (
            <Text style={styles.best}>Best: {longestStreak} days</Text>
          ) : null}
        </View>
      </View>
      {breakdown ? (
        <View style={styles.minis}>
          <Mini label="Meals" value={breakdown.meals} />
          <Mini label="Workout" value={breakdown.workout} />
          <Mini label="Cals" value={breakdown.calories} />
          <Mini label="Protein" value={breakdown.protein} />
          <Mini label="Water" value={breakdown.water} />
        </View>
      ) : null}
    </View>
  );
}

function Mini({ label, value }: { label: string; value: number | null }) {
  return (
    <View style={styles.mini}>
      <Text style={styles.miniLabel}>{label}</Text>
      <Text style={styles.miniValue}>
        {value != null ? Math.round(value) : '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: p.surface,
    borderColor: p.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  title: { color: p.text, fontSize: 15, fontWeight: '800' },
  muted: { color: p.textSecondary, fontSize: 12 },
  row: { flexDirection: 'row', gap: 8 },
  panel: {
    backgroundColor: p.surfaceElevated,
    borderColor: p.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    padding: 12,
  },
  compliance: {
    backgroundColor: p.limeDim,
    borderColor: 'rgba(200,255,0,0.28)',
  },
  panelHead: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  panelLabel: {
    color: p.textMuted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  big: { color: p.text, fontSize: 28, fontWeight: '800', marginTop: 6 },
  days: { color: p.textSecondary, fontSize: 13, fontWeight: '600' },
  best: { color: p.textMuted, fontSize: 11, marginTop: 4 },
  minis: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  mini: {
    backgroundColor: p.surfaceElevated,
    borderColor: p.border,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: '18%',
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexGrow: 1,
  },
  miniLabel: {
    color: p.textMuted,
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  miniValue: {
    color: p.text,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
    textAlign: 'center',
  },
});
