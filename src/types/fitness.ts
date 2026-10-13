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

export type WorkoutMode = 'gym' | 'home' | 'calisthenics';

export type HomeEquipment =
  | 'dumbbells'
  | 'resistance_bands'
  | 'pull_up_bar'
  | 'kettlebell'
  | 'bench'
  | 'barbell'
  | 'yoga_mat';

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
  workoutMode?: WorkoutMode;
  /** Optional gear when training at home / calisthenics. */
  equipmentAvailable?: HomeEquipment[] | null;
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
  workoutMode: WorkoutMode | '';
  equipmentAvailable: HomeEquipment[];
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

export type MealServingUnit = 'g' | 'ml' | 'piece' | 'tbsp' | 'serving' | string;

export type MealItem = {
  id: string;
  foodId?: string | null;
  type: MealType | string;
  name: string;
  /** Planned servings. Macros on the item are already scaled by this amount. */
  quantity: number | null;
  /** Base portion size from the food catalog (e.g. 240). */
  servingAmount?: number | null;
  /** Base portion unit (g / ml / piece / tbsp / serving). */
  servingUnit?: MealServingUnit | null;
  servingSize?: string | null;
  /** quantity × servingAmount (e.g. 360). */
  amount?: number | null;
  /** Human label from API, e.g. "360 ml" or "150 g". */
  amountLabel?: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  status: string;
  /** Fraction of the planned amount that was logged. */
  consumedQuantity?: number | null;
  /** Absolute amount eaten when logged (quantity × servingAmount × consumedQuantity). */
  consumedAmount?: number | null;
  consumedAmountLabel?: string | null;
  actualCalories?: number | null;
  actualProtein?: number | null;
  replacementFoodName?: string | null;
  originalFoodName?: string | null;
  scheduledTime?: string | null;
  imageUrl?: string | null;
};

export type NutritionBudget = {
  calories: number;
  calorieTarget: number;
  protein: number;
  proteinTarget: number;
  carbs: number;
  carbsTarget: number;
  fats: number;
  fatsTarget: number;
};

export type TodayMeals = {
  date?: string | null;
  mealPlanId?: string | null;
  dayNumber?: number | null;
  meals: MealItem[];
};

export type FoodOption = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize?: string | null;
  servingAmount?: number | null;
  servingUnit?: MealServingUnit | null;
};

export type WorkoutSetLog = {
  id: string;
  setNumber: number;
  reps: number | null;
  weightKg: number | null;
  completed: boolean;
};

export type WorkoutExercise = {
  id: string;
  /** Catalog exercise id when distinct from plan-row id. */
  exerciseId?: string | null;
  name: string;
  muscleGroup?: string | null;
  difficulty?: string | null;
  notes?: string | null;
  targetSets: number;
  targetReps: string | number | null;
  targetWeightKg: number | null;
  restSeconds: number;
  sortOrder?: number | null;
  completed: boolean;
  skipped?: boolean;
  replaced?: boolean;
  replacementName?: string | null;
  loggedSets: WorkoutSetLog[];
  imageUrl?: string | null;
};

export type WorkoutDay = {
  id: string;
  label?: string | null;
  focus?: string | null;
  estimatedMinutes?: number | null;
  exercises: WorkoutExercise[];
};

export type WorkoutSessionStatus = 'idle' | 'active' | 'paused' | 'finished';

export type WorkoutSessionAnalytics = {
  volumeKg: number;
  workoutVolume?: number;
  durationMinutes?: number | null;
  durationSeconds?: number | null;
  elapsedSeconds?: number | null;
  exercisesCompleted: number;
  exercisesSkipped: number;
  exercisesTotal: number;
  setsCompleted: number;
  setsPlanned: number;
  caloriesBurned: number | null;
  completionPercent: number;
};

export type WorkoutSession = {
  sessionId: string;
  status: string;
  workoutPlanDayId?: string | null;
  startedAt?: string | null;
  createdAt?: string | null;
  pausedAt?: string | null;
  completedAt?: string | null;
  totalPausedSeconds?: number | null;
  durationSeconds?: number | null;
  elapsedSeconds?: number | null;
  durationMinutes?: number | null;
  caloriesBurned?: number | null;
  volumeKg?: number | null;
  workoutVolume?: number | null;
  exercisesCompleted?: number | null;
  exercisesSkipped?: number | null;
  exercisesTotal?: number | null;
  setsCompleted?: number | null;
  setsPlanned?: number | null;
  completionPercent?: number | null;
  resumed?: boolean;
  exercises?: WorkoutExercise[];
  analytics?: WorkoutSessionAnalytics | null;
};
