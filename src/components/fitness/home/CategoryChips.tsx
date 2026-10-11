import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { fitnessPalette as p } from '../../../constants/fitnessPalette';

const CATEGORIES: {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: 'warmup', label: 'Warm Up', icon: 'body-outline' },
  { id: 'cardio', label: 'Cardio', icon: 'heart-outline' },
  { id: 'strength', label: 'Strength', icon: 'barbell-outline' },
  { id: 'mobility', label: 'Mobility', icon: 'walk-outline' },
];

type CategoryChipsProps = {
  activeId: string;
  onChange: (id: string) => void;
};

export function CategoryChips({ activeId, onChange }: CategoryChipsProps) {
  return (
    <ScrollView
      contentContainerStyle={styles.row}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {CATEGORIES.map((category) => {
        const active = category.id === activeId;
        return (
          <Pressable
            key={category.id}
            accessibilityRole="button"
            onPress={() => onChange(category.id)}
            style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}
          >
            <Ionicons
              color={active ? p.lime : p.text}
              name={category.icon}
              size={16}
            />
            <Text style={[styles.label, active && styles.labelActive]}>{category.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 10,
    paddingRight: 8,
  },
  chip: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chipActive: {
    backgroundColor: 'transparent',
    borderColor: p.lime,
    borderWidth: 1.5,
  },
  chipIdle: {
    backgroundColor: p.surfaceElevated,
  },
  label: {
    color: p.text,
    fontSize: 13,
    fontWeight: '700',
  },
  labelActive: {
    color: p.text,
  },
});
