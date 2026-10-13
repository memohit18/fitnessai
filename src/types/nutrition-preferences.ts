export type NutritionBudget = 'budget' | 'moderate' | 'premium';

export type PreferredCuisine =
  | 'indian'
  | 'north_indian'
  | 'south_indian'
  | 'mixed'
  | 'international';

export type MealsPerDay = 3 | 4 | 5 | 6;

export type MealTimingPreference = 'early' | 'flexible' | 'late';

export type NutritionPreferences = {
  id?: string;
  userId?: string;
  budgetCategory: NutritionBudget;
  preferredCuisine: PreferredCuisine;
  mealsPerDay: MealsPerDay;
  cookingTimeMinutes: number;
  preferredMealTiming: MealTimingPreference;
  createdAt?: string;
  updatedAt?: string;
};

export type NutritionPreferencesPayload = {
  budgetCategory?: NutritionBudget;
  preferredCuisine?: PreferredCuisine;
  mealsPerDay?: MealsPerDay;
  cookingTimeMinutes?: number;
  preferredMealTiming?: MealTimingPreference;
};

export type NutritionPreferencesFormValues = {
  budgetCategory?: NutritionBudget;
  preferredCuisine?: PreferredCuisine;
  mealsPerDay?: MealsPerDay;
  cookingTimeMinutes?: number;
  preferredMealTiming?: MealTimingPreference;
};

export const BUDGET_OPTIONS: {
  value: NutritionBudget;
  label: string;
  hint: string;
}[] = [
  {
    value: 'budget',
    label: 'Budget',
    hint: 'Affordable staples',
  },
  {
    value: 'moderate',
    label: 'Moderate',
    hint: 'Balanced variety',
  },
  {
    value: 'premium',
    label: 'Premium',
    hint: 'Premium ingredients',
  },
];

export const CUISINE_OPTIONS: { value: PreferredCuisine; label: string }[] = [
  { value: 'indian', label: 'Indian' },
  { value: 'north_indian', label: 'North Indian' },
  { value: 'south_indian', label: 'South Indian' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'international', label: 'International' },
];

export const MEALS_PER_DAY_OPTIONS: MealsPerDay[] = [3, 4, 5, 6];

export const MEAL_TIMING_OPTIONS: {
  value: MealTimingPreference;
  label: string;
  hint: string;
}[] = [
  { value: 'early', label: 'Early', hint: 'Earlier meals' },
  { value: 'flexible', label: 'Flexible', hint: 'Adaptable timing' },
  { value: 'late', label: 'Late', hint: 'Later meals' },
];

export const DEFAULT_NUTRITION_PREFERENCES: NutritionPreferencesFormValues = {
  budgetCategory: 'moderate',
  preferredCuisine: 'indian',
  mealsPerDay: 4,
  cookingTimeMinutes: 30,
  preferredMealTiming: 'flexible',
};
