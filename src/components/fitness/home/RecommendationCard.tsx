import { Ionicons } from '@expo/vector-icons';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { fitnessPalette as p } from '../../../constants/fitnessPalette';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80';

type RecommendationCardProps = {
  onExplore?: () => void;
  onStart?: () => void;
};

export function RecommendationCard({ onExplore, onStart }: RecommendationCardProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Daily Recommendation</Text>
        <Pressable accessibilityRole="button" onPress={onExplore}>
          <Text style={styles.explore}>Explore All</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <ImageBackground source={{ uri: HERO_IMAGE }} style={styles.image}>
          <LinearGradient
            colors={['rgba(14,14,14,0.15)', 'rgba(14,14,14,0.92)']}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.badges}>
            <View style={[styles.badge, styles.badgeYellow]}>
              <Text style={styles.badgeYellowText}>INTERMEDIATE</Text>
            </View>
            <View style={[styles.badge, styles.badgeHot]}>
              <Text style={styles.badgeHotText}>HOT PICK</Text>
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.coachRow}>
              <View style={styles.coachDot} />
              <Text style={styles.coach}>Coach Maya</Text>
            </View>
            <Text style={styles.title}>HIIT & Core Conditioning</Text>
            <Text style={styles.subtitle}>
              Explosive intervals with core finishers tailored for today&apos;s readiness.
            </Text>

            <View style={styles.metaRow}>
              <Meta icon="time-outline" label="35 Min" />
              <Meta icon="flame-outline" label="380 kcal" />
              <Meta icon="flash-outline" label="High Effort" />
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={onStart}
              style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.9 : 1 }]}
            >
              <Text style={styles.ctaText}>START SESSION</Text>
              <Ionicons color={p.text} name="arrow-forward" size={16} />
            </Pressable>
          </View>
        </ImageBackground>
      </View>
    </View>
  );
}

function Meta({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.meta}>
      <Ionicons color={p.textSecondary} name={icon} size={14} />
      <Text style={styles.metaText}>{label}</Text>
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
  explore: {
    color: p.lime,
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  image: {
    minHeight: 320,
    justifyContent: 'space-between',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    padding: 14,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeYellow: {
    backgroundColor: p.active,
  },
  badgeYellowText: {
    color: p.onLime,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeHot: {
    backgroundColor: p.hot,
  },
  badgeHotText: {
    color: p.text,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  content: {
    gap: 8,
    padding: 16,
  },
  coachRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  coachDot: {
    backgroundColor: p.lime,
    borderRadius: 999,
    height: 18,
    width: 18,
  },
  coach: {
    color: p.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    color: p.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    color: p.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 4,
  },
  meta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  metaText: {
    color: p.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  cta: {
    alignItems: 'center',
    backgroundColor: p.surfaceElevated,
    borderColor: p.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 46,
  },
  ctaText: {
    color: p.text,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
