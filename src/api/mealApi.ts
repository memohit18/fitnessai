import axios from 'axios';

import { baseApi } from './baseApi';
import {
  isFitnessErrorEnvelope,
  isMissingFitnessProfileStatus,
} from '../lib/fitness/fitnessResponse';
import { unwrapTodayMeals } from '../lib/fitness/mealResponse';
import type { TodayMeals } from '../types/fitness';
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

export async function generateMealPlan(): Promise<void> {
  try {
    await baseApi.post('/meal-plans/generate', { planType: 'weekly' });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to generate meal plan.'));
  }
}

export async function completeMeal(mealId: string): Promise<void> {
  try {
    await baseApi.post(`/meals/${mealId}/complete`, { consumedQuantity: 1 });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to log meal.'));
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
