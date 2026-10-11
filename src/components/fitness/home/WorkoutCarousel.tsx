import { Ionicons } from '@expo/vector-icons';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { fitnessPalette as p } from '../../../constants/fitnessPalette';

const WORKOUTS = [
  {
    id: 'stretch',
    title: 'Stretch & Flow',
    minutes: 15,
    image:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'partner',
    title: 'Partner Power',
    minutes: 10,
    image:
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'core',
    title: 'Core Ignite',
    minutes: 20,
    image:
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
  },
];

type WorkoutCarouselProps = {
  onPressWorkout?: (title: string) => void;
};

export function WorkoutCarousel({ onPressWorkout }: WorkoutCarouselProps) {
  return (
    <ScrollView
      contentContainerStyle={styles.row}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {WORKOUTS.map((workout) => (
        <Pressable
          key={workout.id}
          accessibilityRole="button"
          onPress={() => onPressWorkout?.(workout.title)}
          style={({ pressed }) => [styles.card, { opacity: pressed ? 0.92 : 1 }]}
        >
          <ImageBackground source={{ uri: workout.image }} style={styles.image}>
            <LinearGradient
              colors={['transparent', 'rgba(7,20,15,0.85)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.meta}>
              <Text style={styles.title}>{workout.title}</Text>
              <View style={styles.timeRow}>
                <Ionicons color={p.textSecondary} name="time-outline" size={14} />
                <Text style={styles.time}>{workout.minutes} min</Text>
              </View>
            </View>
          </ImageBackground>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 14,
    paddingRight: 8,
  },
  card: {
    borderRadius: 28,
    height: 210,
    overflow: 'hidden',
    width: 168,
  },
  image: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  meta: {
    gap: 6,
    padding: 14,
  },
  title: {
    color: p.text,
    fontSize: 16,
    fontWeight: '800',
  },
  timeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  time: {
    color: p.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
});
