import axios from 'axios';

import { baseApi } from './baseApi';
import {
  isFitnessErrorEnvelope,
  isMissingFitnessProfileStatus,
  unwrapFitnessData,
} from '../lib/fitness/fitnessResponse';
import {
  toFoodPreferencesPatchPayload,
  unwrapFoodPreferences,
  unwrapFoodsList,
} from '../lib/fitness/food/foodResponse';
import type {
  Food,
  FoodPreferences,
  FoodPreferencesFormValues,
  FoodsListResult,
} from '../lib/fitness/food/types';
import { getApiErrorMessage } from '../utils/api';

function isAbsent(error: unknown) {
  return (
    axios.isAxiosError(error) &&
    isMissingFitnessProfileStatus(error.response?.status)
  );
}

export async function getFoodPreferences(): Promise<FoodPreferences | null> {
  try {
    const { data } = await baseApi.get<unknown>('/food-preferences');
    if (isFitnessErrorEnvelope(data)) {
      if (isMissingFitnessProfileStatus(data.statusCode)) return null;
      throw new Error(data.message || 'Unable to load food preferences.');
    }
    return unwrapFoodPreferences(data);
  } catch (error) {
    if (isAbsent(error)) return null;
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw new Error(getApiErrorMessage(error, 'Unable to load food preferences.'));
  }
}

export async function saveFoodPreferences(
  values: FoodPreferencesFormValues,
): Promise<FoodPreferences> {
  try {
    const { data } = await baseApi.patch<unknown>(
      '/food-preferences',
      toFoodPreferencesPatchPayload(values),
    );
    if (isFitnessErrorEnvelope(data)) {
      throw new Error(data.message || 'Unable to save food preferences.');
    }
    const next = unwrapFoodPreferences(data);
    if (!next) throw new Error('Invalid food preferences response');
    return next;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to save food preferences.'));
  }
}

export async function listFoods(params?: {
  search?: string;
  page?: number;
  limit?: number;
  categoryId?: string | null;
}): Promise<FoodsListResult> {
  try {
    const { data } = await baseApi.get<unknown>('/foods', {
      params: {
        search: params?.search?.trim() || undefined,
        page: params?.page ?? 1,
        limit: params?.limit ?? 24,
        category: params?.categoryId || undefined,
      },
    });
    if (isFitnessErrorEnvelope(data)) {
      throw new Error(data.message || 'Unable to load foods.');
    }
    return unwrapFoodsList(data);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to load foods.'));
  }
}

export async function listFoodCategories(): Promise<
  { id: string; name: string }[]
> {
  try {
    const { data } = await baseApi.get<unknown>('/foods/categories');
    if (isFitnessErrorEnvelope(data)) {
      throw new Error(data.message || 'Unable to load categories.');
    }
    const payload = unwrapFitnessData<{
      tabs?: { id: string; name: string }[];
      allowedCategories?: { id: string; name: string }[];
      items?: { id: string; name: string }[];
    }>(data);
    const list =
      payload?.tabs ??
      payload?.allowedCategories ??
      payload?.items ??
      (Array.isArray(payload) ? (payload as { id: string; name: string }[]) : []);
    return list
      .map((item) => ({
        id: String(item.id ?? ''),
        name: String(item.name ?? ''),
      }))
      .filter((item) => item.id && item.name);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to load categories.'));
  }
}

export type { Food, FoodPreferences, FoodPreferencesFormValues, FoodsListResult };
