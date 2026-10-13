import axios from 'axios';

import { baseApi } from './baseApi';
import {
  isFitnessErrorEnvelope,
  isMissingFitnessProfileStatus,
  unwrapFitnessData,
} from '../lib/fitness/fitnessResponse';
import { unwrapTodayMeals } from '../lib/fitness/mealResponse';
import type { NutritionBudget, TodayMeals } from '../types/fitness';
import { getApiErrorMessage } from '../utils/api';

function isAbsent(error: unknown) {
  return (
    axios.isAxiosError(error) &&
    isMissingFitnessProfileStatus(error.response?.status)
  );
}

export async function getTodayMeals(): Promise<TodayMeals | null> {
  try {
    const { data } = await baseApi.get<unknown>('/meal-plans/today');
    if (isFitnessErrorEnvelope(data)) {
      if (isMissingFitnessProfileStatus(data.statusCode)) return null;
      throw new Error(data.message || 'Unable to load meals.');
    }
    return unwrapTodayMeals(data);
  } catch (error) {
    if (isAbsent(error)) return null;
    throw new Error(getApiErrorMessage(error, 'Unable to load meals.'));
  }
}

export async function getNutritionSummary(): Promise<NutritionBudget | null> {
  try {
    const { data } = await baseApi.get<unknown>('/meal-plans/nutrition-summary');
    if (isFitnessErrorEnvelope(data)) {
      if (isMissingFitnessProfileStatus(data.statusCode)) return null;
      throw new Error(data.message || 'Unable to load nutrition.');
    }
    return unwrapNutritionBudget(data);
  } catch (error) {
    if (isAbsent(error)) return null;
    throw new Error(getApiErrorMessage(error, 'Unable to load nutrition.'));
  }
}

function unwrapNutritionBudget(response: unknown): NutritionBudget | null {
  const data = unwrapFitnessData<Record<string, unknown>>(response);
  if (!data) return null;
  const num = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  return {
    calories: num(data.calories),
    calorieTarget: num(data.calorieTarget),
    protein: num(data.protein),
    proteinTarget: num(data.proteinTarget),
    carbs: num(data.carbs),
    carbsTarget: num(data.carbsTarget),
    fats: num(data.fats),
    fatsTarget: num(data.fatsTarget),
  };
}

export async function generateMealPlan(): Promise<void> {
  try {
    await baseApi.post('/meal-plans/generate', { planType: 'weekly' });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to generate meal plan.'));
  }
}

export async function completeMeal(
  mealId: string,
  consumedQuantity = 1,
): Promise<void> {
  try {
    await baseApi.post(`/meals/${mealId}/complete`, { consumedQuantity });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to log meal.'));
  }
}

export async function logMealEaten(
  mealId: string,
  consumedQuantity: number,
): Promise<void> {
  const amount = Math.round(consumedQuantity * 100) / 100;
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0.');
  }
  if (amount < 1) {
    try {
      await baseApi.post(`/meals/${mealId}/partial`, {
        consumedQuantity: amount,
      });
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Unable to log meal.'));
    }
    return;
  }
  await completeMeal(mealId, Math.min(2, amount));
}

export async function addEatenMeal(input: {
  mealPlanId: string;
  dayNumber: number;
  mealType: string;
  foodId: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}): Promise<void> {
  try {
    await baseApi.post('/meals/log-eaten', {
      foodId: input.foodId,
      mealType: input.mealType,
      quantity: input.quantity,
    });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to add meal.'));
  }
}

export async function replaceMeal(
  mealId: string,
  foodId: string,
  quantity = 1,
): Promise<void> {
  try {
    await baseApi.post(`/meals/${mealId}/replace`, { foodId, quantity });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to swap meal.'));
  }
}

export async function skipMeal(mealId: string): Promise<void> {
  try {
    await baseApi.post(`/meals/${mealId}/skip`);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to skip meal.'));
  }
}

export async function undoMeal(mealId: string): Promise<void> {
  try {
    await baseApi.post(`/meals/${mealId}/undo`);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to undo meal.'));
  }
}
