import axios from 'axios';

import { baseApi } from './baseApi';
import { unwrapHydrationToday } from '../lib/fitness/dashboardResponse';
import {
  isFitnessErrorEnvelope,
  isMissingFitnessProfileStatus,
} from '../lib/fitness/fitnessResponse';
import type { HydrationToday } from '../types/dashboard';
import { getApiErrorMessage } from '../utils/api';

export async function getHydrationToday(): Promise<HydrationToday | null> {
  try {
    const { data } = await baseApi.get<unknown>('/hydration/today');
    if (isFitnessErrorEnvelope(data)) {
      if (isMissingFitnessProfileStatus(data.statusCode)) return null;
      return null;
    }
    return unwrapHydrationToday(data);
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      isMissingFitnessProfileStatus(error.response?.status)
    ) {
      return null;
    }
    throw new Error(getApiErrorMessage(error, 'Unable to load hydration.'));
  }
}

export async function logHydration(amountMl: number): Promise<HydrationToday> {
  try {
    const { data } = await baseApi.post<unknown>('/hydration', { amountMl });
    if (isFitnessErrorEnvelope(data)) {
      throw new Error(data.message || 'Unable to log water.');
    }
    const hydration = unwrapHydrationToday(data);
    if (!hydration) {
      throw new Error('Water logged but response was empty.');
    }
    return hydration;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to log water.'));
  }
}
