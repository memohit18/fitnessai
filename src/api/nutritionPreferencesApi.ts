import axios from 'axios';

import { baseApi } from './baseApi';
import {
  isFitnessErrorEnvelope,
  isMissingFitnessProfileStatus,
} from '../lib/fitness/fitnessResponse';
import {
  toNutritionPreferencesPayload,
  unwrapNutritionPreferences,
} from '../lib/fitness/nutrition/nutritionPreferencesResponse';
import type {
  NutritionPreferences,
  NutritionPreferencesFormValues,
} from '../types/nutrition-preferences';
import { getApiErrorMessage } from '../utils/api';

function isAbsent(error: unknown) {
  return (
    axios.isAxiosError(error) &&
    isMissingFitnessProfileStatus(error.response?.status)
  );
}

export async function getNutritionPreferences(): Promise<NutritionPreferences | null> {
  try {
    const { data } = await baseApi.get<unknown>('/nutrition-preferences');
    if (isFitnessErrorEnvelope(data)) {
      if (isMissingFitnessProfileStatus(data.statusCode)) return null;
      throw new Error(data.message || 'Unable to load nutrition preferences.');
    }
    return unwrapNutritionPreferences(data);
  } catch (error) {
    if (isAbsent(error)) return null;
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw new Error(
      getApiErrorMessage(error, 'Unable to load nutrition preferences.'),
    );
  }
}

export async function saveNutritionPreferences(
  values: NutritionPreferencesFormValues,
  hasExisting: boolean,
): Promise<NutritionPreferences> {
  const payload = toNutritionPreferencesPayload(values);
  try {
    const { data } = hasExisting
      ? await baseApi.patch<unknown>('/nutrition-preferences', payload)
      : await baseApi.post<unknown>('/nutrition-preferences', payload);
    if (isFitnessErrorEnvelope(data)) {
      throw new Error(data.message || 'Unable to save nutrition preferences.');
    }
    const next = unwrapNutritionPreferences(data);
    if (!next) throw new Error('Invalid nutrition preferences response');
    return next;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, 'Unable to save nutrition preferences.'),
    );
  }
}
