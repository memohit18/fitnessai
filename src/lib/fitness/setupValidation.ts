import type {
  FitnessGoal,
  FitnessProfilePayload,
  FitnessSetupFormValues,
  FitnessSetupStepId,
  PhysiqueGoal,
} from '../../types/fitness';

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const TITLE_TO_GOAL: Record<string, FitnessGoal> = {
  athletic: 'body_recomposition',
  bodybuilder: 'muscle_gain',
  lean: 'lean_bulk',
  muscular: 'lean_bulk',
  powerlifter: 'muscle_gain',
  slim: 'weight_loss',
  fat_loss: 'fat_loss',
  weight_loss: 'weight_loss',
};

export function mapPhysiqueGoalToFitnessGoal(
  goal: Pick<PhysiqueGoal, 'id' | 'title'>,
): FitnessGoal {
  return (
    TITLE_TO_GOAL[slugify(goal.title)] ??
    TITLE_TO_GOAL[slugify(goal.id)] ??
    'maintain_weight'
  );
}

export function validateFitnessSetupStep(
  step: FitnessSetupStepId,
  values: FitnessSetupFormValues,
): string | null {
  if (step === 'welcome' || step === 'review') return null;

  if (step === 'basic-info') {
    if (values.age === '' || Number(values.age) < 13 || Number(values.age) > 100) {
      return 'Enter a valid age (13–100).';
    }
    if (!values.gender) return 'Select a gender.';
    if (
      values.heightCm === '' ||
      Number(values.heightCm) < 100 ||
      Number(values.heightCm) > 250
    ) {
      return 'Enter height in cm (100–250).';
    }
    if (
      values.weightKg === '' ||
      Number(values.weightKg) < 30 ||
      Number(values.weightKg) > 300
    ) {
      return 'Enter weight in kg (30–300).';
    }
  }

  if (step === 'activity' && !values.activityLevel) {
    return 'Select an activity level.';
  }

  if (step === 'goal') {
    if (!values.physiqueGoalId) return 'Select a physique goal.';
    if (!values.fitnessGoal) return 'Fitness goal is missing.';
  }

  if (step === 'diet') {
    if (!values.dietType) return 'Select a diet type.';
    if (!values.workoutExperience) return 'Select workout experience.';
    if (!values.workoutMode) return 'Select workout mode (gym, home, or calisthenics).';
    if (
      values.workoutDaysPerWeek === '' ||
      Number(values.workoutDaysPerWeek) < 2 ||
      Number(values.workoutDaysPerWeek) > 7
    ) {
      return 'Choose workout days (2–7).';
    }
  }

  if (step === 'allergy' && values.allergies.length > 1000) {
    return 'Allergies must be under 1000 characters.';
  }

  return null;
}

export function toFitnessProfilePayload(
  values: FitnessSetupFormValues,
): FitnessProfilePayload {
  return {
    age: Number(values.age),
    gender: values.gender as FitnessProfilePayload['gender'],
    heightCm: Number(values.heightCm),
    weightKg: Number(values.weightKg),
    activityLevel: values.activityLevel as FitnessProfilePayload['activityLevel'],
    fitnessGoal: values.fitnessGoal as FitnessProfilePayload['fitnessGoal'],
    physiqueGoalId: values.physiqueGoalId,
    dietType: values.dietType as FitnessProfilePayload['dietType'],
    workoutExperience:
      values.workoutExperience as FitnessProfilePayload['workoutExperience'],
    workoutDaysPerWeek: Number(values.workoutDaysPerWeek),
    workoutMode: values.workoutMode as FitnessProfilePayload['workoutMode'],
    targetWeightKg:
      values.targetWeightKg === '' ? null : Number(values.targetWeightKg),
    targetBodyFatPercent:
      values.targetBodyFatPercent === ''
        ? null
        : Number(values.targetBodyFatPercent),
    allergies: values.allergies.trim() ? values.allergies.trim() : null,
    onboardingCompleted: true,
  };
}
