import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ProgressRing } from './ProgressRing';
import { fitnessPalette as p } from '../../../constants/fitnessPalette';

type DashboardHeroCardProps = {
  score: number | null;
  compliancePercent?: number | null;
  streakDays?: number | null;
  dateLabel?: string | null;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function DashboardHeroCard({
  score,
  compliancePercent,
  streakDays,
  dateLabel,
  refreshing,
  onRefresh,
}: DashboardHeroCardProps) {
  return (
    <View style={styles.shell}>
      <LinearGradient
        colors={['rgba(200,255,0,0.16)', 'rgba(7,20,15,0.2)', 'transparent']}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>Daily Dashboard</Text>
          <Text style={styles.title}>Today’s Score</Text>
          <Text style={styles.muted}>
            {dateLabel
              ? `Live execution for ${dateLabel}.`
              : 'Live view of meals, workout, water, and macros.'}
          </Text>
          <View style={styles.chips}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                {compliancePercent != null
                  ? `${Math.round(compliancePercent)}% compliance`
                  : 'Compliance pending'}
              </Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                {streakDays != null ? `${streakDays}-day streak` : 'Streak building'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.scoreCol}>
          <ProgressRing
            color={p.lime}
            label="score"
            max={100}
            size={108}
            sublabel={score != null ? 'Daily' : 'Pending'}
            value={score ?? 0}
          />
          {onRefresh ? (
            <Pressable
              accessibilityLabel="Refresh dashboard"
              disabled={refreshing}
              onPress={onRefresh}
              style={({ pressed }) => [
                styles.refresh,
                { opacity: pressed || refreshing ? 0.7 : 1 },
              ]}
            >
              {refreshing ? (
                <ActivityIndicator color={p.lime} size="small" />
              ) : (
                <Ionicons color={p.textSecondary} name="refresh" size={18} />
              )}
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: p.surface,
    borderColor: p.border,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 18,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  copy: {
    flex: 1,
    gap: 6,
    paddingTop: 4,
  },
  eyebrow: {
    color: p.lime,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: p.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  muted: {
    color: p.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  chip: {
    backgroundColor: p.surfaceElevated,
    borderColor: p.border,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    color: p.text,
    fontSize: 11,
    fontWeight: '700',
  },
  scoreCol: {
    alignItems: 'center',
    gap: 10,
  },
  refresh: {
    alignItems: 'center',
    backgroundColor: p.surfaceElevated,
    borderColor: p.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
});
