import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { fitnessPalette as p } from '../../../constants/fitnessPalette';
import { ActivityRings } from './ActivityRings';

const METRICS = [
  {
    key: 'burn',
    label: 'Burn',
    value: '640 / 850 kcal',
    color: p.burn,
    icon: 'flame' as const,
  },
  {
    key: 'active',
    label: 'Active',
    value: '48 / 60 min',
    color: p.active,
    icon: 'time' as const,
  },
  {
    key: 'steps',
    label: 'Steps',
    value: '8,420 / 10k',
    color: p.hydrate,
    icon: 'walk' as const,
  },
];

export function DailyFuelCard() {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Fuel & Rings</Text>
        <View style={styles.avgPill}>
          <Text style={styles.avgText}>78% Avg</Text>
        </View>
      </View>

      <View style={styles.body}>
        <ActivityRings
          rings={[
            { progress: 0.75, color: p.burn, track: 'rgba(255,77,141,0.18)' },
            { progress: 0.8, color: p.active, track: 'rgba(245,197,24,0.18)' },
            { progress: 0.84, color: p.hydrate, track: 'rgba(46,230,214,0.18)' },
          ]}
          totalPts="1,840"
        />

        <View style={styles.metrics}>
          {METRICS.map((metric) => (
            <View key={metric.key} style={styles.metricRow}>
              <View style={[styles.metricIcon, { backgroundColor: `${metric.color}22` }]}>
                <Ionicons color={metric.color} name={metric.icon} size={14} />
              </View>
              <View style={styles.metricCopy}>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <Text style={styles.metricValue}>{metric.value}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: p.surface,
    borderColor: p.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 16,
    padding: 18,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: p.text,
    fontSize: 16,
    fontWeight: '700',
  },
  avgPill: {
    backgroundColor: p.limeDim,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  avgText: {
    color: p.lime,
    fontSize: 11,
    fontWeight: '700',
  },
  body: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  metrics: {
    flex: 1,
    gap: 14,
  },
  metricRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  metricIcon: {
    alignItems: 'center',
    borderRadius: 10,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  metricCopy: {
    flex: 1,
    gap: 2,
  },
  metricLabel: {
    color: p.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  metricValue: {
    color: p.text,
    fontSize: 14,
    fontWeight: '700',
  },
});
