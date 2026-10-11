import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  type CompositeNavigationProp,
  useNavigation,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getFitnessProfile } from '../../api/fitnessApi';
import {
  buildFitnessReviewSectionsFromProfile,
  formatFitnessUpdatedAt,
} from '../../lib/fitness/reviewLabels';
import { hasCompletedFitnessOnboarding } from '../../lib/fitness/fitnessResponse';
import { useTheme } from '../../contexts/ThemeContext';
import type { AppStackParamList, MainTabParamList } from '../../navigation/types';
import type { FitnessProfile } from '../../types/fitness';
import { getApiErrorMessage } from '../../utils/api';

type ProfileNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Profile'>,
  NativeStackNavigationProp<AppStackParamList>
>;

function isRemoteImage(url?: string) {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
}

export function FitnessProfilePanel() {
  const { colors } = useTheme();
  const navigation = useNavigation<ProfileNav>();
  const [profile, setProfile] = useState<FitnessProfile | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);
    try {
      const next = await getFitnessProfile();
      setProfile(next);
      setStatus('ready');
    } catch (error) {
      setProfile(null);
      setStatus('error');
      setErrorMessage(
        getApiErrorMessage(error, 'Unable to load your fitness profile.'),
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (status === 'loading') {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading fitness profile…
        </Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionEyebrow, { color: colors.primary }]}>Fitness Profile</Text>
        <Text style={[styles.errorTitle, { color: colors.text }]}>Couldn’t load profile</Text>
        <Text style={[styles.muted, { color: colors.textSecondary }]}>
          {errorMessage ?? 'Something went wrong.'}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void load()}
          style={({ pressed }) => [
            styles.primaryBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Text style={[styles.primaryBtnText, { color: colors.primaryText }]}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!profile || !hasCompletedFitnessOnboarding(profile)) {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionEyebrow, { color: colors.primary }]}>Fitness Profile</Text>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          No fitness profile yet
        </Text>
        <Text style={[styles.muted, { color: colors.textSecondary }]}>
          Finish the FitForge setup steps to unlock meals, workouts, and goals.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('FitnessSetup')}
          style={({ pressed }) => [
            styles.primaryBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Text style={[styles.primaryBtnText, { color: colors.primaryText }]}>
            Start fitness setup
          </Text>
        </Pressable>
      </View>
    );
  }

  const sections = buildFitnessReviewSectionsFromProfile(profile);
  const updatedLabel = formatFitnessUpdatedAt(profile.updatedAt);
  const imageUrl = profile.physiqueGoal?.imageUrl;

  return (
    <View style={styles.stack}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionEyebrow, { color: colors.primary }]}>Fitness Profile</Text>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Your saved fitness profile
        </Text>
        <Text style={[styles.muted, { color: colors.textSecondary }]}>
          Metrics and goals synced from FitForge — same profile as desktop.
        </Text>
        {updatedLabel ? (
          <Text style={[styles.updated, { color: colors.textSecondary }]}>
            Last updated {updatedLabel}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              Toast.show({
                type: 'info',
                text1: 'Transformation is next',
                text2: 'This screen will open on mobile soon.',
                position: 'bottom',
              })
            }
            style={({ pressed }) => [
              styles.secondaryBtn,
              {
                borderColor: colors.border,
                backgroundColor: colors.background,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <Ionicons color={colors.primary} name="sparkles-outline" size={16} />
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
              View transformation
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('FitnessSetup', { mode: 'edit' })}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1, flex: 1 },
            ]}
          >
            <Ionicons color={colors.primaryText} name="pencil" size={16} />
            <Text style={[styles.primaryBtnText, { color: colors.primaryText }]}>
              Edit profile
            </Text>
          </Pressable>
        </View>
      </View>

      {profile.physiqueGoal ? (
        <View
          style={[
            styles.card,
            styles.physiqueCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {isRemoteImage(imageUrl) ? (
            <Image source={{ uri: imageUrl }} style={styles.physiqueImage} />
          ) : (
            <View style={[styles.physiqueImage, styles.physiqueFallback, { backgroundColor: colors.background }]}>
              <Ionicons color={colors.primary} name="body-outline" size={36} />
            </View>
          )}
          <View style={styles.physiqueCopy}>
            <Text style={[styles.sectionEyebrow, { color: colors.primary }]}>Physique goal</Text>
            <Text style={[styles.physiqueTitle, { color: colors.text }]}>
              {profile.physiqueGoal.title}
            </Text>
            {profile.physiqueGoal.description ? (
              <Text style={[styles.muted, { color: colors.textSecondary }]}>
                {profile.physiqueGoal.description}
              </Text>
            ) : null}
            <View style={styles.pills}>
              <View style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <Text style={[styles.pillText, { color: colors.text }]}>
                  {profile.fitnessGoal.replace(/_/g, ' ')}
                </Text>
              </View>
              {profile.targetWeightKg ? (
                <View style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <Text style={[styles.pillText, { color: colors.text }]}>
                    Target {profile.targetWeightKg} kg
                  </Text>
                </View>
              ) : null}
              {profile.targetBodyFatPercent ? (
                <View style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <Text style={[styles.pillText, { color: colors.text }]}>
                    Target {profile.targetBodyFatPercent}% body fat
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      ) : null}

      {sections.map((section) => (
        <View key={section.id} style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
          <View style={styles.grid}>
            {section.items.map((item) => (
              <View
                key={`${section.id}-${item.label}`}
                style={[
                  styles.metricCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                  {item.label}
                </Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 16,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  muted: {
    fontSize: 13,
    lineHeight: 18,
  },
  updated: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  primaryBtn: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryBtn: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  physiqueCard: {
    overflow: 'hidden',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  physiqueImage: {
    height: 180,
    width: '100%',
  },
  physiqueFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  physiqueCopy: {
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  physiqueTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  sectionBlock: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    borderRadius: 16,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    gap: 4,
    maxWidth: '48.5%',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
  },
});
