import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ProgressRing } from './ProgressRing';
import { fitnessPalette as p } from '../../../constants/fitnessPalette';
import type { DashboardWaterProgress } from '../../../types/dashboard';

const QUICK_ADDS = [250, 500, 750] as const;

type WaterTrackerCardProps = {
  water: DashboardWaterProgress;
  isLogging?: boolean;
  onAdd: (amountMl: number) => void;
};

export function WaterTrackerCard({
  water,
  isLogging,
  onAdd,
}: WaterTrackerCardProps) {
  const liters = (water.currentMl / 1000).toFixed(1);
  const goalLiters = (water.goalMl / 1000).toFixed(1);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons color={p.hydrate} name="water" size={16} />
        <Text style={styles.title}>Water Progress</Text>
      </View>
      <View style={styles.body}>
        <ProgressRing
          color={p.hydrate}
          label="L"
          max={Math.max(0.1, water.goalMl / 1000)}
          size={88}
          stroke={7}
          sublabel={`${liters}/${goalLiters}`}
          value={water.currentMl / 1000}
        />
        <View style={styles.side}>
          <Text style={styles.muted}>
            {water.remainingMl > 0
              ? `${(water.remainingMl / 1000).toFixed(1)}L remaining`
              : 'Goal reached'}
          </Text>
          <View style={styles.adds}>
            {QUICK_ADDS.map((amount) => (
              <Pressable
                key={amount}
                disabled={isLogging}
                onPress={() => onAdd(amount)}
                style={({ pressed }) => [
                  styles.addBtn,
                  { opacity: pressed || isLogging ? 0.65 : 1 },
                ]}
              >
                <Text style={styles.addText}>+{amount}ml</Text>
              </Pressable>
            ))}
          </View>
        </View>
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
    gap: 12,
    padding: 16,
  },
  header: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  title: { color: p.text, fontSize: 15, fontWeight: '800' },
  body: { alignItems: 'center', flexDirection: 'row', gap: 14 },
  side: { flex: 1, gap: 10 },
  muted: { color: p.textSecondary, fontSize: 12 },
  adds: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  addBtn: {
    backgroundColor: p.surfaceElevated,
    borderColor: p.border,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  addText: { color: p.text, fontSize: 11, fontWeight: '800' },
});
