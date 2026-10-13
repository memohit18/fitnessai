import type { FitnessProfile, FitnessReviewSection } from '../../types/fitness';
import {
  ACTIVITY_LEVEL_OPTIONS,
  DIET_TYPE_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  FITNESS_GOAL_OPTIONS,
  GENDER_OPTIONS,
  WORKOUT_MODE_OPTIONS,
} from './constants';

function labelFor<T extends string>(
  options: { value: T; label: string }[],
  value: T | string | null | undefined,
) {
  if (!value) return '—';
  return options.find((option) => option.value === value)?.label ?? '—';
}

export function buildFitnessReviewSectionsFromProfile(
  profile: FitnessProfile,
): FitnessReviewSection[] {
  return [
    {
      id: 'basic-info',
      title: 'Basic information',
      items: [
        { label: 'Age', value: profile.age ? `${profile.age} years` : '—' },
        { label: 'Gender', value: labelFor(GENDER_OPTIONS, profile.gender) },
        {
          label: 'Height',
          value: profile.heightCm ? `${profile.heightCm} cm` : '—',
        },
        {
          label: 'Weight',
          value: profile.weightKg ? `${profile.weightKg} kg` : '—',
        },
      ],
    },
    {
      id: 'activity',
      title: 'Activity',
      items: [
        {
          label: 'Activity level',
          value: labelFor(ACTIVITY_LEVEL_OPTIONS, profile.activityLevel),
        },
      ],
    },
    {
      id: 'goal',
      title: 'Fitness goal',
      items: [
        {
          label: 'Selected goal',
          value: profile.physiqueGoal?.title ?? '—',
        },
        {
          label: 'Training focus',
          value: labelFor(FITNESS_GOAL_OPTIONS, profile.fitnessGoal),
        },
      ],
    },
    {
      id: 'diet',
      title: 'Diet & training',
      items: [
        {
          label: 'Diet type',
          value: labelFor(DIET_TYPE_OPTIONS, profile.dietType),
        },
        {
          label: 'Experience',
          value: labelFor(EXPERIENCE_LEVEL_OPTIONS, profile.workoutExperience),
        },
        {
          label: 'Workout mode',
          value: labelFor(WORKOUT_MODE_OPTIONS, profile.workoutMode),
        },
        {
          label: 'Workout days',
          value: profile.workoutDaysPerWeek
            ? `${profile.workoutDaysPerWeek} days / week`
            : '—',
        },
        {
          label: 'Target weight',
          value:
            profile.targetWeightKg == null || profile.targetWeightKg === 0
              ? 'Not set'
              : `${profile.targetWeightKg} kg`,
        },
        {
          label: 'Target body fat',
          value:
            profile.targetBodyFatPercent == null ||
            profile.targetBodyFatPercent === 0
              ? 'Not set'
              : `${profile.targetBodyFatPercent}%`,
        },
      ],
    },
    {
      id: 'allergy',
      title: 'Allergies',
      items: [
        {
          label: 'Restrictions',
          value: profile.allergies?.trim()
            ? profile.allergies.trim()
            : 'None listed',
        },
      ],
    },
  ];
}

export function formatFitnessUpdatedAt(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
