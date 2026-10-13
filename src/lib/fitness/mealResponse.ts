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

function readNullableNumber(value: unknown) {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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

  const quantity = readNullableNumber(
    record.quantity ?? firstItem?.quantity ?? record.servingQuantity,
  );

  const servingAmount = readNullableNumber(
    record.servingAmount ??
      record.serving_amount ??
      nestedFood?.servingAmount ??
      nestedFood?.serving_amount ??
      nestedItemFood?.servingAmount ??
      firstItem?.servingAmount,
  );
  const servingUnit =
    readString(
      record.servingUnit ??
        record.serving_unit ??
        nestedFood?.servingUnit ??
        nestedFood?.serving_unit ??
        nestedItemFood?.servingUnit ??
        firstItem?.servingUnit,
    ) || null;
  const amount = readNullableNumber(
    record.amount ?? firstItem?.amount,
  );
  const amountLabel =
    readString(
      record.amountLabel ??
        record.amount_label ??
        firstItem?.amountLabel ??
        firstItem?.amount_label,
    ) || null;

  return {
    id,
    foodId,
    type: readString(
      record.type ?? record.mealType ?? record.meal_type ?? firstItem?.mealType,
      'meal',
    ),
    name,
    quantity,
    servingAmount,
    servingUnit,
    servingSize:
      readString(
        record.servingSize ??
          record.serving_size ??
          nestedFood?.servingSize ??
          nestedItemFood?.servingSize ??
          firstItem?.servingSize,
      ) || null,
    amount,
    amountLabel,
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
    consumedQuantity: readNullableNumber(
      record.consumedQuantity ?? record.consumed_quantity ?? firstItem?.consumedQuantity,
    ),
    consumedAmount: readNullableNumber(
      record.consumedAmount ?? record.consumed_amount,
    ),
    consumedAmountLabel:
      readString(
        record.consumedAmountLabel ?? record.consumed_amount_label,
      ) || null,
    actualCalories: readNullableNumber(
      record.actualCalories ?? record.actual_calories,
    ),
    actualProtein: readNullableNumber(
      record.actualProtein ?? record.actual_protein,
    ),
    replacementFoodName:
      readString(record.replacementFoodName ?? record.replacement_food_name) ||
      null,
    originalFoodName:
      readString(record.originalFoodName ?? record.original_food_name) || null,
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
      mealPlanId: null,
      dayNumber: null,
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
    mealPlanId: readString(data.mealPlanId ?? data.meal_plan_id) || null,
    dayNumber: readNullableNumber(data.dayNumber ?? data.day_number),
    meals: mealsRaw
      .map((item, index) => normalizeMeal(item, index))
      .filter((item): item is MealItem => item !== null),
  };
}
