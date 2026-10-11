import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { fitnessPalette as p } from '../../../constants/fitnessPalette';

type CrewMilestonesProps = {
  onLike?: () => void;
};

export function CrewMilestones({ onLike }: CrewMilestonesProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Crew Milestones</Text>
        <Text style={styles.live}>Live Feed</Text>
      </View>

      <View style={styles.card}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
          }}
          style={styles.avatar}
        />
        <View style={styles.copy}>
          <Text style={styles.name}>
            Liam Vance <Text style={styles.action}>Smashed a 10k Run PR</Text>
          </Text>
          <Text style={styles.meta}>44:12 · 8m ago</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onLike}
          style={({ pressed }) => [styles.like, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Ionicons color={p.lime} name="thumbs-up" size={16} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: p.text,
    fontSize: 17,
    fontWeight: '700',
  },
  live: {
    color: p.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    alignItems: 'center',
    backgroundColor: p.surface,
    borderColor: p.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  avatar: {
    borderRadius: 999,
    height: 42,
    width: 42,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  name: {
    color: p.text,
    fontSize: 14,
    fontWeight: '700',
  },
  action: {
    color: p.textSecondary,
    fontWeight: '600',
  },
  meta: {
    color: p.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  like: {
    alignItems: 'center',
    backgroundColor: p.limeDim,
    borderRadius: 12,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
});
