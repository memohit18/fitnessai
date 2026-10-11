import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import { getFitnessGoals, getFitnessProfile, saveFitnessProfile } from '../../api/fitnessApi';
import { fitnessPalette as p } from '../../constants/fitnessPalette';
import {
  ACTIVITY_LEVEL_OPTIONS,
  ALLERGY_QUICK_TAGS,
  DIET_TYPE_OPTIONS,
  EMPTY_FITNESS_SETUP_VALUES,
  EXPERIENCE_LEVEL_OPTIONS,
  FITNESS_ONBOARDING_BENEFITS,
  FITNESS_SETUP_STEPS,
  GENDER_OPTIONS,
  WORKOUT_DAYS_OPTIONS,
} from '../../lib/fitness/constants';
import { buildFitnessReviewSectionsFromProfile } from '../../lib/fitness/reviewLabels';
import { hasCompletedFitnessOnboarding } from '../../lib/fitness/fitnessResponse';
import {
  mapPhysiqueGoalToFitnessGoal,
  toFitnessProfilePayload,
  validateFitnessSetupStep,
} from '../../lib/fitness/setupValidation';
import type { AppStackParamList } from '../../navigation/types';
import type {
  FitnessProfile,
  FitnessSetupFormValues,
  FitnessSetupStepId,
  PhysiqueGoal,
} from '../../types/fitness';
import { getApiErrorMessage } from '../../utils/api';

type Nav = NativeStackNavigationProp<AppStackParamList, 'FitnessSetup'>;
type SetupRoute = RouteProp<AppStackParamList, 'FitnessSetup'>;

export function FitnessSetupScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<SetupRoute>();
  const isEditMode = route.params?.mode === 'edit';
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<FitnessSetupFormValues>(EMPTY_FITNESS_SETUP_VALUES);
  const [goals, setGoals] = useState<PhysiqueGoal[]>([]);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [bootStatus, setBootStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [bootError, setBootError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  const step = FITNESS_SETUP_STEPS[stepIndex]?.id ?? 'welcome';

  const boot = useCallback(async () => {
    setBootStatus('loading');
    setBootError(null);
    try {
      const [profile, physiqueGoals] = await Promise.all([
        getFitnessProfile(),
        getFitnessGoals(),
      ]);

      if (hasCompletedFitnessOnboarding(profile) && !isEditMode) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs', params: { screen: 'Home' } }],
        });
        return;
      }

      setGoals(physiqueGoals);
      if (profile?.id) {
        setExistingId(profile.id);
        setValues({
          age: profile.age ?? '',
          gender: profile.gender ?? '',
          heightCm: profile.heightCm ?? '',
          weightKg: profile.weightKg ?? '',
          activityLevel: profile.activityLevel ?? '',
          fitnessGoal: profile.fitnessGoal ?? '',
          physiqueGoalId: profile.physiqueGoalId ?? '',
          dietType: profile.dietType ?? '',
          workoutExperience: profile.workoutExperience ?? '',
          workoutDaysPerWeek: profile.workoutDaysPerWeek ?? '',
          targetWeightKg: profile.targetWeightKg ?? '',
          targetBodyFatPercent: profile.targetBodyFatPercent ?? '',
          allergies: profile.allergies ?? '',
        });
        if (isEditMode) {
          setStepIndex(1);
        }
      }
      setBootStatus('ready');
    } catch (error) {
      setBootError(getApiErrorMessage(error, 'Unable to start fitness setup.'));
      setBootStatus('error');
    }
  }, [isEditMode, navigation]);

  useEffect(() => {
    void boot();
  }, [boot]);

  const patch = <K extends keyof FitnessSetupFormValues>(
    key: K,
    value: FitnessSetupFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    setStepError(null);
  };

  const goNext = async () => {
    const error = validateFitnessSetupStep(step, values);
    if (error) {
      setStepError(error);
      return;
    }

    if (step === 'review') {
      setSubmitting(true);
      try {
        await saveFitnessProfile(toFitnessProfilePayload(values), existingId);
        Toast.show({
          type: 'success',
          text1: 'Fitness profile saved',
          text2: 'Your FitForge plan is ready.',
          position: 'bottom',
        });
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'MainTabs',
              params: { screen: isEditMode ? 'Profile' : 'Home' },
            },
          ],
        });
      } catch (err) {
        setStepError(getApiErrorMessage(err, 'Unable to save profile.'));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setStepIndex((index) => Math.min(index + 1, FITNESS_SETUP_STEPS.length - 1));
  };

  const goBack = () => {
    if (stepIndex === 0) return;
    setStepError(null);
    setStepIndex((index) => index - 1);
  };

  const reviewProfile = useMemo(() => {
    if (step !== 'review') return [];
    try {
      const payload: FitnessProfile = {
        id: existingId ?? 'draft',
        ...toFitnessProfilePayload(values),
        onboardingCompleted: false,
        physiqueGoal: goals.find((goal) => goal.id === values.physiqueGoalId) ?? null,
      };
      return buildFitnessReviewSectionsFromProfile(payload);
    } catch {
      return [];
    }
  }, [existingId, goals, step, values]);

  if (bootStatus === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={p.lime} size="large" />
      </View>
    );
  }

  if (bootStatus === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Setup unavailable</Text>
        <Text style={styles.muted}>{bootError}</Text>
        <Pressable onPress={() => void boot()} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.progressRow}>
        {FITNESS_SETUP_STEPS.map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.progressDot,
              index <= stepIndex ? styles.progressDotActive : null,
            ]}
          />
        ))}
      </View>
      <Text style={styles.stepLabel}>
        Step {stepIndex + 1} of {FITNESS_SETUP_STEPS.length} ·{' '}
        {FITNESS_SETUP_STEPS[stepIndex]?.label}
      </Text>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 'welcome' ? (
          <Welcome />
        ) : null}

        {step === 'basic-info' ? (
          <BasicInfo values={values} onChange={patch} />
        ) : null}

        {step === 'activity' ? (
          <OptionList
            options={ACTIVITY_LEVEL_OPTIONS}
            selected={values.activityLevel}
            onSelect={(value) => patch('activityLevel', value)}
          />
        ) : null}

        {step === 'goal' ? (
          <GoalPicker
            goals={goals}
            selectedId={values.physiqueGoalId}
            onSelect={(goal) => {
              patch('physiqueGoalId', goal.id);
              patch('fitnessGoal', mapPhysiqueGoalToFitnessGoal(goal));
            }}
          />
        ) : null}

        {step === 'diet' ? (
          <DietStep values={values} onChange={patch} />
        ) : null}

        {step === 'allergy' ? (
          <AllergyStep
            value={values.allergies}
            onChange={(text) => patch('allergies', text)}
          />
        ) : null}

        {step === 'review' ? (
          <View style={styles.section}>
            <Text style={styles.title}>Review your profile</Text>
            <Text style={styles.muted}>Confirm details before we sync FitForge.</Text>
            {reviewProfile.map((section) => (
              <View key={section.id} style={styles.reviewBlock}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.items.map((item) => (
                  <View key={`${section.id}-${item.label}`} style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>{item.label}</Text>
                    <Text style={styles.reviewValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {stepError ? <Text style={styles.error}>{stepError}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        {stepIndex > 0 ? (
          <Pressable onPress={goBack} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Back</Text>
          </Pressable>
        ) : (
          <View style={styles.secondaryBtnPlaceholder} />
        )}
        <Pressable
          disabled={submitting}
          onPress={() => void goNext()}
          style={({ pressed }) => [
            styles.primaryBtn,
            styles.footerPrimary,
            { opacity: submitting || pressed ? 0.85 : 1 },
          ]}
        >
          {submitting ? (
            <ActivityIndicator color={p.onLime} />
          ) : (
            <Text style={styles.primaryBtnText}>
              {step === 'welcome'
                ? 'Get started'
                : step === 'review'
                  ? 'Save profile'
                  : 'Continue'}
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Welcome() {
  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>FitForge Setup</Text>
      <Text style={styles.title}>Let’s build your fitness profile</Text>
      <Text style={styles.muted}>
        Same onboarding as desktop — a few steps and your meals & workouts unlock.
      </Text>
      {FITNESS_ONBOARDING_BENEFITS.map((benefit) => (
        <View key={benefit} style={styles.benefitRow}>
          <View style={styles.bullet} />
          <Text style={styles.benefitText}>{benefit}</Text>
        </View>
      ))}
    </View>
  );
}

function BasicInfo({
  values,
  onChange,
}: {
  values: FitnessSetupFormValues;
  onChange: <K extends keyof FitnessSetupFormValues>(
    key: K,
    value: FitnessSetupFormValues[K],
  ) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>Basic information</Text>
      <Text style={styles.fieldLabel}>Gender</Text>
      <View style={styles.chipWrap}>
        {GENDER_OPTIONS.map((option) => {
          const active = values.gender === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange('gender', option.value)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <NumberField
        label="Age"
        value={values.age}
        onChange={(value) => onChange('age', value)}
      />
      <NumberField
        label="Height (cm)"
        value={values.heightCm}
        onChange={(value) => onChange('heightCm', value)}
      />
      <NumberField
        label="Weight (kg)"
        value={values.weightKg}
        onChange={(value) => onChange('weightKg', value)}
      />
    </View>
  );
}

function DietStep({
  values,
  onChange,
}: {
  values: FitnessSetupFormValues;
  onChange: <K extends keyof FitnessSetupFormValues>(
    key: K,
    value: FitnessSetupFormValues[K],
  ) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>Diet & training</Text>
      <Text style={styles.fieldLabel}>Diet type</Text>
      <View style={styles.chipWrap}>
        {DIET_TYPE_OPTIONS.map((option) => {
          const active = values.dietType === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange('dietType', option.value)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.fieldLabel}>Experience</Text>
      <View style={styles.chipWrap}>
        {EXPERIENCE_LEVEL_OPTIONS.map((option) => {
          const active = values.workoutExperience === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange('workoutExperience', option.value)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.fieldLabel}>Workout days / week</Text>
      <View style={styles.chipWrap}>
        {WORKOUT_DAYS_OPTIONS.map((days) => {
          const active = values.workoutDaysPerWeek === days;
          return (
            <Pressable
              key={days}
              onPress={() => onChange('workoutDaysPerWeek', days)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{days}</Text>
            </Pressable>
          );
        })}
      </View>
      <NumberField
        label="Target weight (kg, optional)"
        value={values.targetWeightKg}
        onChange={(value) => onChange('targetWeightKg', value)}
      />
      <NumberField
        label="Target body fat % (optional)"
        value={values.targetBodyFatPercent}
        onChange={(value) => onChange('targetBodyFatPercent', value)}
      />
    </View>
  );
}

function AllergyStep({
  value,
  onChange,
}: {
  value: string;
  onChange: (text: string) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>Allergies & restrictions</Text>
      <Text style={styles.muted}>Optional — leave blank if none.</Text>
      <View style={styles.chipWrap}>
        {ALLERGY_QUICK_TAGS.map((tag) => (
          <Pressable
            key={tag}
            onPress={() => {
              if (value.toLowerCase().includes(tag.toLowerCase())) return;
              onChange(value ? `${value}, ${tag}` : tag);
            }}
            style={styles.chip}
          >
            <Text style={styles.chipText}>{tag}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        multiline
        onChangeText={onChange}
        placeholder="e.g. Peanuts, lactose…"
        placeholderTextColor={p.textMuted}
        style={[styles.input, styles.textArea]}
        value={value}
      />
    </View>
  );
}

function OptionList<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: { value: T; label: string; description?: string }[];
  selected: T | '';
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>Activity level</Text>
      {options.map((option) => {
        const active = selected === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            style={[styles.optionCard, active && styles.optionCardActive]}
          >
            <Text style={[styles.optionTitle, active && styles.optionTitleActive]}>
              {option.label}
            </Text>
            {option.description ? (
              <Text style={styles.muted}>{option.description}</Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function GoalPicker({
  goals,
  selectedId,
  onSelect,
}: {
  goals: PhysiqueGoal[];
  selectedId: string;
  onSelect: (goal: PhysiqueGoal) => void;
}) {
  if (!goals.length) {
    return (
      <View style={styles.section}>
        <Text style={styles.title}>Physique goals</Text>
        <Text style={styles.muted}>No goals returned from the API yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Choose your physique goal</Text>
      {goals.map((goal) => {
        const active = selectedId === goal.id;
        const remote = goal.imageUrl.startsWith('http');
        return (
          <Pressable
            key={goal.id}
            onPress={() => onSelect(goal)}
            style={[styles.goalCard, active && styles.optionCardActive]}
          >
            {remote ? (
              <Image source={{ uri: goal.imageUrl }} style={styles.goalImage} />
            ) : (
              <View style={[styles.goalImage, styles.goalFallback]} />
            )}
            <View style={styles.goalCopy}>
              <Text style={styles.optionTitle}>{goal.title}</Text>
              <Text style={styles.muted} numberOfLines={3}>
                {goal.description}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | '';
  onChange: (value: number | '') => void;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        keyboardType="numeric"
        onChangeText={(text) => {
          if (!text.trim()) {
            onChange('');
            return;
          }
          const parsed = Number(text);
          onChange(Number.isFinite(parsed) ? parsed : '');
        }}
        placeholder="0"
        placeholderTextColor={p.textMuted}
        style={styles.input}
        value={value === '' ? '' : String(value)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: p.bg,
    flex: 1,
  },
  center: {
    alignItems: 'center',
    backgroundColor: p.bg,
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    padding: 24,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  progressDot: {
    backgroundColor: p.surfaceElevated,
    borderRadius: 999,
    flex: 1,
    height: 4,
  },
  progressDotActive: {
    backgroundColor: p.lime,
  },
  stepLabel: {
    color: p.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
    paddingHorizontal: 18,
  },
  content: {
    gap: 16,
    padding: 18,
    paddingBottom: 24,
  },
  section: {
    gap: 12,
  },
  eyebrow: {
    color: p.lime,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: p.text,
    fontSize: 24,
    fontWeight: '800',
  },
  muted: {
    color: p.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  benefitRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  bullet: {
    backgroundColor: p.lime,
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  benefitText: {
    color: p.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  fieldBlock: {
    gap: 6,
  },
  fieldLabel: {
    color: p.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    backgroundColor: p.surface,
    borderColor: p.border,
    borderRadius: 14,
    borderWidth: 1,
    color: p.text,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: p.surfaceElevated,
    borderColor: p.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: p.limeDim,
    borderColor: p.lime,
  },
  chipText: {
    color: p.text,
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextActive: {
    color: p.lime,
  },
  optionCard: {
    backgroundColor: p.surface,
    borderColor: p.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    padding: 14,
  },
  optionCardActive: {
    borderColor: p.lime,
  },
  optionTitle: {
    color: p.text,
    fontSize: 15,
    fontWeight: '700',
  },
  optionTitleActive: {
    color: p.lime,
  },
  goalCard: {
    backgroundColor: p.surface,
    borderColor: p.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    overflow: 'hidden',
    padding: 10,
  },
  goalImage: {
    borderRadius: 12,
    height: 72,
    width: 72,
  },
  goalFallback: {
    backgroundColor: p.surfaceElevated,
  },
  goalCopy: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  reviewBlock: {
    backgroundColor: p.surface,
    borderColor: p.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  sectionTitle: {
    color: p.text,
    fontSize: 14,
    fontWeight: '800',
  },
  reviewRow: {
    gap: 2,
  },
  reviewLabel: {
    color: p.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  reviewValue: {
    color: p.text,
    fontSize: 14,
    fontWeight: '700',
  },
  error: {
    color: '#FF6B6B',
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    borderTopColor: p.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: p.lime,
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 18,
  },
  footerPrimary: {
    flex: 1,
  },
  primaryBtnText: {
    color: p.onLime,
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryBtn: {
    alignItems: 'center',
    borderColor: p.border,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 88,
    paddingHorizontal: 16,
  },
  secondaryBtnPlaceholder: {
    minWidth: 88,
  },
  secondaryBtnText: {
    color: p.text,
    fontSize: 14,
    fontWeight: '700',
  },
});
