import { unwrapFitnessData } from './fitnessResponse';
import { pickMediaUrl } from './mediaUrl';
import type { MealItem, TodayMeals } from '../../types/fitness';

function readString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function readNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function normalizeMeal(raw: unknown, index: number): MealItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const nestedFood = asRecord(record.food);
  const items = Array.isArray(record.items) ? record.items : [];
  const firstItem = asRecord(items[0]);
  const nestedItemFood = asRecord(firstItem?.food);

  const id = readString(
    record.id ??
      record.mealId ??
      record.mealPlanItemId ??
      record.meal_plan_item_id ??
      firstItem?.id,
  );
  const name = readString(
    record.description ??
      record.displayName ??
      nestedFood?.name ??
      record.name ??
      record.foodName ??
      firstItem?.foodName ??
      firstItem?.name ??
      nestedItemFood?.name ??
      record.title,
    `Meal ${index + 1}`,
  );
  if (!id) return null;

  const foodId =
    readString(
      nestedFood?.id ??
        nestedItemFood?.id ??
        record.foodId ??
        record.food_id ??
        firstItem?.foodId ??
        firstItem?.food_id,
    ) || null;

  return {
    id,
    foodId,
    type: readString(
      record.type ?? record.mealType ?? record.meal_type ?? firstItem?.mealType,
      'meal',
    ),
    name,
    calories: readNumber(
      record.calories ?? nestedFood?.calories ?? firstItem?.calories ?? record.kcal,
    ),
    protein: readNumber(
      record.protein ?? nestedFood?.protein ?? firstItem?.protein,
    ),
    carbs: readNumber(
      record.carbs ??
        nestedFood?.carbs ??
        record.carbohydrates ??
        firstItem?.carbs,
    ),
    fats: readNumber(
      record.fats ?? nestedFood?.fats ?? record.fat ?? firstItem?.fats,
    ),
    status: readString(
      record.status ?? record.logStatus ?? firstItem?.logStatus,
      'pending',
    ).toLowerCase(),
    scheduledTime:
      readString(record.scheduledTime ?? record.scheduled_time ?? record.time) ||
      null,
    imageUrl:
      pickMediaUrl(record) ??
      pickMediaUrl(nestedFood) ??
      pickMediaUrl(firstItem) ??
      pickMediaUrl(nestedItemFood),
  };
}

export function unwrapTodayMeals(response: unknown): TodayMeals | null {
  const data = unwrapFitnessData<Record<string, unknown> | MealItem[]>(response);
  if (!data) return null;

  if (Array.isArray(data)) {
    return {
      meals: data
        .map((item, index) => normalizeMeal(item, index))
        .filter((item): item is MealItem => item !== null),
    };
  }

  const mealsRaw = Array.isArray(data.meals)
    ? data.meals
    : Array.isArray(data.items)
      ? data.items
      : Array.isArray(data.todayMeals)
        ? data.todayMeals
        : [];

  return {
    date: readString(data.date) || null,
    meals: mealsRaw
      .map((item, index) => normalizeMeal(item, index))
      .filter((item): item is MealItem => item !== null),
  };
}
