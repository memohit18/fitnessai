import type {
  ActivityLevel,
  DietType,
  ExperienceLevel,
  FitnessGoal,
  FitnessSetupFormValues,
  FitnessSetupStepId,
  Gender,
} from '../../types/fitness';

export const FITNESS_SETUP_STEPS: {
  id: FitnessSetupStepId;
  label: string;
}[] = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'basic-info', label: 'Basics' },
  { id: 'activity', label: 'Activity' },
  { id: 'goal', label: 'Goals' },
  { id: 'diet', label: 'Diet' },
  { id: 'allergy', label: 'Allergies' },
  { id: 'review', label: 'Review' },
];

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export const ACTIVITY_LEVEL_OPTIONS: {
  value: ActivityLevel;
  label: string;
  description: string;
}[] = [
  { value: 'sedentary', label: 'Sedentary', description: 'Little or no exercise' },
  { value: 'light', label: 'Light', description: '1–3 days/week' },
  { value: 'moderate', label: 'Moderate', description: '3–5 days/week' },
  { value: 'active', label: 'Active', description: '6–7 days/week' },
  { value: 'athlete', label: 'Athlete', description: 'Very hard training' },
];

export const FITNESS_GOAL_OPTIONS: { value: FitnessGoal; label: string }[] = [
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'fat_loss', label: 'Fat Loss' },
  { value: 'lean_bulk', label: 'Lean Bulk' },
  { value: 'muscle_gain', label: 'Muscle Gain' },
  { value: 'body_recomposition', label: 'Body Recomposition' },
  { value: 'maintain_weight', label: 'Maintain Weight' },
];

export const DIET_TYPE_OPTIONS: { value: DietType; label: string }[] = [
  { value: 'balanced', label: 'Balanced' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'high_protein', label: 'High Protein' },
];

export const EXPERIENCE_LEVEL_OPTIONS: { value: ExperienceLevel; label: string }[] =
  [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ];

export const WORKOUT_DAYS_OPTIONS = [2, 3, 4, 5, 6, 7];

export const FITNESS_ONBOARDING_BENEFITS = [
  'Personalized AI meal and workout plans',
  'Targets aligned to your physique goals',
  'Progress tracking from day one',
  'Adaptive coaching as you improve',
];

export const EMPTY_FITNESS_SETUP_VALUES: FitnessSetupFormValues = {
  age: '',
  gender: '',
  heightCm: '',
  weightKg: '',
  activityLevel: '',
  fitnessGoal: '',
  physiqueGoalId: '',
  dietType: '',
  workoutExperience: '',
  workoutDaysPerWeek: '',
  targetWeightKg: '',
  targetBodyFatPercent: '',
  allergies: '',
};

export const ALLERGY_QUICK_TAGS = [
  'Dairy',
  'Gluten',
  'Nuts',
  'Shellfish',
  'Eggs',
  'Soy',
];
