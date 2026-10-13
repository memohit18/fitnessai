import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { FitnessPalette } from '../../../constants/fitnessPalette';
import { useFitnessPalette, useFitnessStyles } from '../../../hooks/useFitnessPalette';
import type { DashboardAchievement } from '../../../types/dashboard';

type AchievementsCardProps = {
  achievements: DashboardAchievement[];
};

export function AchievementsCard({ achievements }: AchievementsCardProps) {
  const p = useFitnessPalette();
  const styles = useFitnessStyles(buildStyles);
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Achievements</Text>
      <Text style={styles.muted}>Unlocks as you execute today’s plan.</Text>
      {achievements.length ? (
        <View style={styles.list}>
          {achievements.map((item) => (
            <View
              key={item.id}
              style={[styles.item, item.unlocked && styles.itemUnlocked]}
            >
              <View
                style={[styles.icon, item.unlocked && styles.iconUnlocked]}
              >
                <Ionicons
                  color={item.unlocked ? p.onLime : p.textMuted}
                  name="trophy"
                  size={14}
                />
              </View>
              <View style={styles.copy}>
                <View style={styles.titleRow}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Ionicons
                    color={item.unlocked ? p.lime : p.textMuted}
                    name={
                      item.unlocked ? 'checkmark-circle' : 'ellipse-outline'
                    }
                    size={14}
                  />
                </View>
                {item.description ? (
                  <Text style={styles.itemDesc}>{item.description}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            Achievements will appear as you build consistency.
          </Text>
        </View>
      )}
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
  list: { gap: 8, marginTop: 4 },
  item: {
    backgroundColor: p.surfaceElevated,
    borderColor: p.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    opacity: 0.75,
    padding: 12,
  },
  itemUnlocked: {
    backgroundColor: p.limeDim,
    borderColor: 'rgba(200,255,0,0.35)',
    opacity: 1,
  },
  icon: {
    alignItems: 'center',
    backgroundColor: p.border,
    borderRadius: 10,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  iconUnlocked: { backgroundColor: p.lime },
  copy: { flex: 1, gap: 2 },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  itemTitle: { color: p.text, flex: 1, fontSize: 13, fontWeight: '800' },
  itemDesc: { color: p.textSecondary, fontSize: 12, lineHeight: 16 },
  empty: {
    borderColor: p.border,
    borderRadius: 14,
    borderStyle: 'dashed',
    borderWidth: 1,
    marginTop: 4,
    padding: 20,
  },
  emptyText: {
    color: p.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
});
}

