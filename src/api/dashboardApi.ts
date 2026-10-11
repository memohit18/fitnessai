import axios from 'axios';

import { baseApi } from './baseApi';
import { unwrapDailyDashboard } from '../lib/fitness/dashboardResponse';
import {
  isFitnessErrorEnvelope,
  isMissingFitnessProfileStatus,
} from '../lib/fitness/fitnessResponse';
import type { DailyDashboard } from '../types/dashboard';
import { getApiErrorMessage } from '../utils/api';

export async function getDailyDashboard(): Promise<DailyDashboard | null> {
  try {
    const { data } = await baseApi.get<unknown>('/dashboard');
    if (isFitnessErrorEnvelope(data)) {
      if (isMissingFitnessProfileStatus(data.statusCode)) return null;
      throw new Error(data.message || 'Unable to load dashboard.');
    }
    return unwrapDailyDashboard(data);
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      isMissingFitnessProfileStatus(error.response?.status)
    ) {
      return null;
    }
    throw new Error(getApiErrorMessage(error, 'Unable to load dashboard.'));
  }
}
