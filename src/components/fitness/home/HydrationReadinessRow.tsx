import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fitnessPalette as p } from '../../../constants/fitnessPalette';

type HydrationReadinessRowProps = {
  onAddWater?: () => void;
};

export function HydrationReadinessRow({ onAddWater }: HydrationReadinessRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.card}>
        <Text style={styles.label}>Hydration</Text>
        <Text style={styles.value}>
          2.1 <Text style={styles.valueMuted}>/ 3.0 L</Text>
        </Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: '70%' }]} />
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onAddWater}
          style={({ pressed }) => [styles.waterBtn, { opacity: pressed ? 0.88 : 1 }]}
        >
          <Text style={styles.waterBtnText}>+ 250 ml</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Readiness</Text>
        <Text style={[styles.value, { color: p.lime }]}>88% Score</Text>
        <Text style={styles.copy}>Optimal physical status for heavy loading.</Text>
        <View style={styles.readyPill}>
          <Text style={styles.readyText}>Primed for Workout</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    backgroundColor: p.surface,
    borderColor: p.border,
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    gap: 10,
    padding: 14,
  },
  label: {
    color: p.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  value: {
    color: p.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  valueMuted: {
    color: p.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  track: {
    backgroundColor: 'rgba(46,230,214,0.16)',
    borderRadius: 999,
    height: 8,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: p.hydrate,
    borderRadius: 999,
    height: '100%',
  },
  waterBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(46,230,214,0.14)',
    borderRadius: 12,
    minHeight: 36,
    justifyContent: 'center',
  },
  waterBtnText: {
    color: p.hydrate,
    fontSize: 12,
    fontWeight: '800',
  },
  copy: {
    color: p.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  readyPill: {
    alignSelf: 'flex-start',
    backgroundColor: p.limeDim,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  readyText: {
    color: p.lime,
    fontSize: 11,
    fontWeight: '700',
  },
});
