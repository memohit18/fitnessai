import axios from 'axios';

import { baseApi } from './baseApi';
import {
  isFitnessErrorEnvelope,
  isMissingFitnessProfileStatus,
} from '../lib/fitness/fitnessResponse';
import {
  unwrapActiveWorkoutToday,
  unwrapTodayWorkout,
} from '../lib/fitness/workoutResponse';
import type { WorkoutDay } from '../types/fitness';
import { getApiErrorMessage } from '../utils/api';

function isAbsent(error: unknown) {
  if (!axios.isAxiosError(error)) return false;
  if (isMissingFitnessProfileStatus(error.response?.status)) return true;
  const message = getApiErrorMessage(error, '').toLowerCase();
  return /not found|no active workout|no workout/.test(message);
}

export async function getTodayWorkout(): Promise<WorkoutDay | null> {
  try {
    const { data } = await baseApi.get<unknown>('/workouts/today');
    if (isFitnessErrorEnvelope(data)) {
      if (isMissingFitnessProfileStatus(data.statusCode)) return null;
      return null;
    }
    const today = unwrapTodayWorkout(data);
    if (today) return today;
  } catch (error) {
    if (!isAbsent(error)) {
      // Fall through to active plan.
    }
  }

  try {
    const { data } = await baseApi.get<unknown>('/workouts/active');
    if (isFitnessErrorEnvelope(data)) return null;
    return unwrapActiveWorkoutToday(data);
  } catch (error) {
    if (isAbsent(error)) return null;
    throw new Error(getApiErrorMessage(error, 'Unable to load workout.'));
  }
}

export async function generateWorkoutPlan(): Promise<void> {
  try {
    const { data } = await baseApi.post<unknown>('/workouts/generate-ai', {});
    if (isFitnessErrorEnvelope(data)) {
      throw new Error(data.message || 'Unable to generate workout plan.');
    }

    const record =
      data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
    const nested =
      record && record.data && typeof record.data === 'object'
        ? (record.data as Record<string, unknown>)
        : record;
    const planId =
      typeof nested?.id === 'string'
        ? nested.id
        : typeof nested?.workoutPlanId === 'string'
          ? nested.workoutPlanId
          : null;
    const status =
      typeof nested?.status === 'string' ? nested.status.toLowerCase() : '';

    if (planId && status === 'draft') {
      await baseApi.post(`/workouts/${planId}/activate`);
    }
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to generate workout plan.'));
  }
}

export async function startWorkoutSession(workoutPlanDayId?: string): Promise<void> {
  try {
    await baseApi.post('/workouts/session/start', {
      ...(workoutPlanDayId ? { workoutPlanDayId } : {}),
    });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to start workout session.'));
  }
}

/**
 * Best-effort attach. Desktop food images use PATCH /foods/:id; exercise
 * image editors are not exposed there yet, so we try common exercise routes.
 */
export async function updateExerciseImage(
  exerciseId: string,
  imageUrl: string,
): Promise<boolean> {
  const paths = [
    `/exercises/${exerciseId}`,
    `/workouts/exercises/${exerciseId}`,
  ];

  for (const path of paths) {
    try {
      await baseApi.patch(path, { imageUrl });
      return true;
    } catch (error) {
      if (axios.isAxiosError(error) && [404, 405].includes(error.response?.status ?? 0)) {
        continue;
      }
      // Non-missing errors still mean attach isn't usable for this build.
      if (axios.isAxiosError(error) && (error.response?.status ?? 0) >= 500) {
        throw new Error(
          getApiErrorMessage(error, 'Unable to save exercise image.'),
        );
      }
    }
  }

  return false;
}
