export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'athlete';

export type FitnessGoal =
  | 'weight_loss'
  | 'fat_loss'
  | 'lean_bulk'
  | 'muscle_gain'
  | 'body_recomposition'
  | 'maintain_weight';

export type DietType =
  | 'balanced'
  | 'vegetarian'
  | 'vegan'
  | 'keto'
  | 'paleo'
  | 'mediterranean'
  | 'high_protein';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type FitnessSetupStepId =
  | 'welcome'
  | 'basic-info'
  | 'activity'
  | 'goal'
  | 'diet'
  | 'allergy'
  | 'review';

export type PhysiqueGoal = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  targetBodyFatMin?: number | null;
  targetBodyFatMax?: number | null;
};

export type FitnessProfilePayload = {
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  fitnessGoal: FitnessGoal;
  physiqueGoalId: string;
  dietType: DietType;
  workoutExperience: ExperienceLevel;
  workoutDaysPerWeek: number;
  targetWeightKg?: number | null;
  targetBodyFatPercent?: number | null;
  allergies?: string | null;
  onboardingCompleted?: boolean;
};

export type FitnessSetupFormValues = {
  age: number | '';
  gender: Gender | '';
  heightCm: number | '';
  weightKg: number | '';
  activityLevel: ActivityLevel | '';
  fitnessGoal: FitnessGoal | '';
  physiqueGoalId: string;
  dietType: DietType | '';
  workoutExperience: ExperienceLevel | '';
  workoutDaysPerWeek: number | '';
  targetWeightKg: number | '';
  targetBodyFatPercent: number | '';
  allergies: string;
};

export type FitnessProfile = FitnessProfilePayload & {
  id: string;
  onboardingCompleted: boolean;
  physiqueGoal?: PhysiqueGoal | null;
  createdAt?: string;
  updatedAt?: string;
};

export type FitnessReviewItem = {
  label: string;
  value: string;
};

export type FitnessReviewSection = {
  id: string;
  title: string;
  items: FitnessReviewItem[];
};

export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export type MealItem = {
  id: string;
  foodId?: string | null;
  type: MealType | string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  status: string;
  scheduledTime?: string | null;
  imageUrl?: string | null;
};

export type TodayMeals = {
  date?: string | null;
  meals: MealItem[];
};

export type WorkoutExercise = {
  id: string;
  /** Catalog exercise id when distinct from plan-row id. */
  exerciseId?: string | null;
  name: string;
  targetSets: number;
  targetReps: string | number | null;
  targetWeightKg: number | null;
  completed: boolean;
  imageUrl?: string | null;
};

export type WorkoutDay = {
  id: string;
  label?: string | null;
  focus?: string | null;
  estimatedMinutes?: number | null;
  exercises: WorkoutExercise[];
};
