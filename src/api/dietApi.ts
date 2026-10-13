import axios from 'axios';

import { baseApi } from './baseApi';
import {
  isFitnessErrorEnvelope,
  isMissingFitnessProfileStatus,
} from '../lib/fitness/fitnessResponse';
import {
  unwrapDietHistory,
  unwrapDietPlan,
  unwrapDietPlanner,
} from '../lib/fitness/diet/dietResponse';
import type {
  DietHistoryResponse,
  DietMacroProgress,
  DietPlan,
  DietPlanner,
} from '../lib/fitness/diet/types';
import { getApiErrorMessage } from '../utils/api';
import { unwrapFitnessData } from '../lib/fitness/fitnessResponse';

function isAbsent(error: unknown) {
  return (
    axios.isAxiosError(error) &&
    isMissingFitnessProfileStatus(error.response?.status)
  );
}

export async function getActiveDiet(): Promise<DietPlan | null> {
  try {
    const { data } = await baseApi.get<unknown>('/diet/active');
    if (isFitnessErrorEnvelope(data)) {
      if (isMissingFitnessProfileStatus(data.statusCode)) return null;
      throw new Error(data.message || 'Unable to load diet.');
    }
    return unwrapDietPlan(data);
  } catch (error) {
    if (isAbsent(error)) return null;
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw new Error(getApiErrorMessage(error, 'Unable to load diet.'));
  }
}

export async function generateDiet(): Promise<DietPlan> {
  try {
    const { data } = await baseApi.post<unknown>('/diet/generate');
    if (isFitnessErrorEnvelope(data)) {
      throw new Error(data.message || 'Unable to generate diet.');
    }
    const plan = unwrapDietPlan(data);
    if (!plan) throw new Error('Invalid diet plan response');
    return plan;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to generate diet.'));
  }
}

export async function regenerateDiet(): Promise<DietPlan> {
  try {
    const { data } = await baseApi.post<unknown>('/diet/regenerate');
    if (isFitnessErrorEnvelope(data)) {
      throw new Error(data.message || 'Unable to regenerate diet.');
    }
    const plan = unwrapDietPlan(data);
    if (!plan) throw new Error('Invalid diet plan response');
    return plan;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to regenerate diet.'));
  }
}

export async function getDietHistory(params?: {
  page?: number;
  limit?: number;
}): Promise<DietHistoryResponse> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  try {
    const { data } = await baseApi.get<unknown>('/diet/history', {
      params: { page, limit },
    });
    if (isFitnessErrorEnvelope(data)) {
      if (isMissingFitnessProfileStatus(data.statusCode)) return { items: [] };
      throw new Error(data.message || 'Unable to load diet history.');
    }
    return unwrapDietHistory(data);
  } catch (error) {
    if (isAbsent(error)) return { items: [] };
    throw new Error(getApiErrorMessage(error, 'Unable to load diet history.'));
  }
}

export async function activateDiet(dietPlanId: string): Promise<DietPlan | null> {
  try {
    const { data } = await baseApi.post<unknown>(`/diet/${dietPlanId}/activate`);
    if (isFitnessErrorEnvelope(data)) {
      throw new Error(data.message || 'Unable to activate diet.');
    }
    return unwrapDietPlan(data);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to activate diet.'));
  }
}

export async function deleteDiet(dietPlanId: string): Promise<void> {
  try {
    const { data } = await baseApi.delete<unknown>(`/diet/${dietPlanId}`);
    if (isFitnessErrorEnvelope(data)) {
      throw new Error(data.message || 'Unable to delete diet.');
    }
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to delete diet.'));
  }
}

export async function getDietPlanner(date?: string): Promise<DietPlanner | null> {
  try {
    const { data } = await baseApi.get<unknown>('/diet/planner', {
      params: date ? { date } : undefined,
    });
    if (isFitnessErrorEnvelope(data)) {
      if (isMissingFitnessProfileStatus(data.statusCode)) return null;
      throw new Error(data.message || 'Unable to load diet planner.');
    }
    return unwrapDietPlanner(data);
  } catch (error) {
    if (isAbsent(error)) return null;
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw new Error(getApiErrorMessage(error, 'Unable to load diet planner.'));
  }
}

export async function addDietHydration(
  amountMl: number,
): Promise<DietMacroProgress | null> {
  try {
    const { data } = await baseApi.patch<unknown>('/diet/planner/hydration', {
      amountMl,
    });
    if (isFitnessErrorEnvelope(data)) {
      throw new Error(data.message || 'Unable to update hydration.');
    }
    const payload = unwrapFitnessData<Record<string, unknown>>(data) ?? {};
    const current = Number(
      payload.current ?? payload.currentMl ?? payload.amountMl ?? 0,
    );
    const goal = Number(payload.goal ?? payload.goalMl ?? payload.targetMl ?? 0);
    return {
      current: Number.isFinite(current) ? current : 0,
      goal: Number.isFinite(goal) ? goal : 0,
      remaining:
        typeof payload.remaining === 'number' ? payload.remaining : undefined,
      percent: typeof payload.percent === 'number' ? payload.percent : undefined,
    };
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to update hydration.'));
  }
}
