import { unwrapFitnessData } from '../fitnessResponse';
import type {
  MealTimingPreference,
  MealsPerDay,
  NutritionBudget,
  NutritionPreferences,
  NutritionPreferencesFormValues,
  NutritionPreferencesPayload,
  PreferredCuisine,
} from '../../../types/nutrition-preferences';

function readString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function readNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBudget(value: unknown): NutritionBudget | null {
  const budget = readString(value).toLowerCase();
  if (budget === 'budget' || budget === 'moderate' || budget === 'premium') {
    return budget;
  }
  if (budget === 'low') return 'budget';
  if (budget === 'high') return 'premium';
  return null;
}

function parseCuisine(value: unknown): PreferredCuisine | null {
  const cuisine = readString(value).toLowerCase();
  if (
    cuisine === 'indian' ||
    cuisine === 'north_indian' ||
    cuisine === 'south_indian' ||
    cuisine === 'mixed' ||
    cuisine === 'international'
  ) {
    return cuisine;
  }
  if (cuisine === 'north indian') return 'north_indian';
  if (cuisine === 'south indian') return 'south_indian';
  return null;
}

function parseMealsPerDay(value: unknown): MealsPerDay | null {
  const mealsPerDay = readNumber(value);
  if (
    mealsPerDay === 3 ||
    mealsPerDay === 4 ||
    mealsPerDay === 5 ||
    mealsPerDay === 6
  ) {
    return mealsPerDay;
  }
  return null;
}

function parseMealTiming(value: unknown): MealTimingPreference | null {
  const mealTiming = readString(value).toLowerCase();
  if (mealTiming === 'early' || mealTiming === 'flexible' || mealTiming === 'late') {
    return mealTiming;
  }
  return null;
}

export function unwrapNutritionPreferences(
  response: unknown,
): NutritionPreferences | null {
  const data = unwrapFitnessData<
    NutritionPreferences | { preferences: NutritionPreferences } | null
  >(response);

  if (!data) return null;

  const record =
    typeof data === 'object' && data !== null && 'preferences' in data
      ? data.preferences
      : data;

  if (!record || typeof record !== 'object') {
    return null;
  }

  const raw = record as Record<string, unknown>;
  const budgetCategory = parseBudget(
    raw.budgetCategory ?? raw.budget_category ?? raw.budget,
  );
  const preferredCuisine = parseCuisine(
    raw.preferredCuisine ?? raw.preferred_cuisine ?? raw.cuisine,
  );
  const mealsPerDay = parseMealsPerDay(
    raw.mealsPerDay ?? raw.meals_per_day ?? raw.mealCount ?? raw.meal_count,
  );
  const cookingTimeMinutes = readNumber(
    raw.cookingTimeMinutes ??
      raw.cooking_time_minutes ??
      raw.cookingTime ??
      raw.cooking_time,
  );
  const preferredMealTiming = parseMealTiming(
    raw.preferredMealTiming ??
      raw.preferred_meal_timing ??
      raw.mealTiming ??
      raw.meal_timing,
  );

  if (
    !budgetCategory ||
    !preferredCuisine ||
    !mealsPerDay ||
    cookingTimeMinutes === null ||
    cookingTimeMinutes < 15 ||
    cookingTimeMinutes > 120 ||
    !preferredMealTiming
  ) {
    return null;
  }

  return {
    id: readString(raw.id) || undefined,
    userId: readString(raw.userId ?? raw.user_id) || undefined,
    budgetCategory,
    preferredCuisine,
    mealsPerDay,
    cookingTimeMinutes,
    preferredMealTiming,
    createdAt: readString(raw.createdAt ?? raw.created_at) || undefined,
    updatedAt: readString(raw.updatedAt ?? raw.updated_at) || undefined,
  };
}

export function toNutritionPreferencesPayload(
  values: NutritionPreferencesFormValues,
): NutritionPreferencesPayload {
  return {
    budgetCategory: values.budgetCategory,
    preferredCuisine: values.preferredCuisine,
    mealsPerDay: values.mealsPerDay,
    cookingTimeMinutes: values.cookingTimeMinutes,
    preferredMealTiming: values.preferredMealTiming,
  };
}

export function mapNutritionPreferencesToFormValues(
  preferences: NutritionPreferences | null | undefined,
): NutritionPreferencesFormValues {
  if (!preferences) return {};
  return {
    budgetCategory: preferences.budgetCategory,
    preferredCuisine: preferences.preferredCuisine,
    mealsPerDay: preferences.mealsPerDay,
    cookingTimeMinutes: preferences.cookingTimeMinutes,
    preferredMealTiming: preferences.preferredMealTiming,
  };
}
