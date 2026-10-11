import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fitnessPalette as p } from '../../../constants/fitnessPalette';
import type { FitnessModuleId } from '../ModuleTile';

const MODULES: {
  id: FitnessModuleId;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
}[] = [
  {
    id: 'workout',
    title: 'Workout',
    description: "Today's session and sets",
    icon: 'barbell-outline',
    accent: p.lime,
  },
  {
    id: 'meals',
    title: 'Meals',
    description: 'Log plan and portions',
    icon: 'restaurant-outline',
    accent: p.active,
  },
  {
    id: 'hydration',
    title: 'Hydration',
    description: 'Daily water pace',
    icon: 'water-outline',
    accent: p.hydrate,
  },
  {
    id: 'diet',
    title: 'Diet',
    description: 'Targets and meal plan',
    icon: 'nutrition-outline',
    accent: p.burn,
  },
  {
    id: 'progress',
    title: 'Progress',
    description: 'Weight and body trends',
    icon: 'trending-up-outline',
    accent: p.sleep,
  },
  {
    id: 'transformation',
    title: 'Plan',
    description: 'Roadmap to your goal',
    icon: 'sparkles-outline',
    accent: p.lime,
  },
];

type FitnessHubProps = {
  onModulePress: (id: FitnessModuleId, title: string) => void;
};

export function FitnessHub({ onModulePress }: FitnessHubProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Your fitness hub</Text>
        <Text style={styles.subtitle}>Screens from FitForge — opening on mobile next.</Text>
      </View>

      <View style={styles.grid}>
        {MODULES.map((module) => (
          <Pressable
            key={module.id}
            accessibilityRole="button"
            onPress={() => onModulePress(module.id, module.title)}
            style={({ pressed }) => [styles.tile, { opacity: pressed ? 0.88 : 1 }]}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${module.accent}22` }]}>
              <Ionicons color={module.accent} name={module.icon} size={20} />
            </View>
            <Text style={styles.tileTitle}>{module.title}</Text>
            <Text style={styles.tileDescription}>{module.description}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 14,
  },
  header: {
    gap: 4,
  },
  title: {
    color: p.text,
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    color: p.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    backgroundColor: p.surface,
    borderColor: p.border,
    borderRadius: 18,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    gap: 8,
    maxWidth: '48.5%',
    padding: 14,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 12,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  tileTitle: {
    color: p.text,
    fontSize: 15,
    fontWeight: '700',
  },
  tileDescription: {
    color: p.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
});
