import { StyleSheet, Text, View } from 'react-native';

import { fitnessPalette as p } from '../../../constants/fitnessPalette';
import { HeartWave } from './HeartWave';

export function HeartRateCard() {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Resting Heart Rate</Text>
        <View style={styles.zonePill}>
          <Text style={styles.zoneText}>Zone 2 • Aerobic</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View>
          <Text style={styles.bpm}>72 BPM</Text>
          <Text style={styles.delta}>+4 bpm vs yesterday</Text>
        </View>
      </View>

      <HeartWave height={52} width={300} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: p.surface,
    borderColor: p.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 12,
    overflow: 'hidden',
    padding: 18,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: p.text,
    fontSize: 15,
    fontWeight: '700',
  },
  zonePill: {
    backgroundColor: 'rgba(46,230,214,0.14)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  zoneText: {
    color: p.hydrate,
    fontSize: 11,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bpm: {
    color: p.text,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
  },
  delta: {
    color: p.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
