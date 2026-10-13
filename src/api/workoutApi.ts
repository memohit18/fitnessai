import axios from 'axios';

import { baseApi } from './baseApi';
import {
  isFitnessErrorEnvelope,
  isMissingFitnessProfileStatus,
} from '../lib/fitness/fitnessResponse';
import {
  unwrapActiveWorkoutToday,
  unwrapTodayWorkout,
  unwrapWorkoutSession,
} from '../lib/fitness/workoutResponse';
import type { WorkoutDay, WorkoutSession } from '../types/fitness';
import { getApiErrorMessage } from '../utils/api';

function isAbsent(error: unknown) {
  if (!axios.isAxiosError(error)) return false;
  if (isMissingFitnessProfileStatus(error.response?.status)) return true;
  const message = getApiErrorMessage(error, '').toLowerCase();
  return /not found|no active workout|no workout|no active session/.test(
    message,
  );
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

export async function getActiveWorkoutSession(): Promise<WorkoutSession | null> {
  try {
    const { data } = await baseApi.get<unknown>('/workouts/session/active');
    if (isFitnessErrorEnvelope(data)) return null;
    return unwrapWorkoutSession(data);
  } catch (error) {
    if (isAbsent(error)) return null;
    throw new Error(getApiErrorMessage(error, 'Unable to load session.'));
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

export async function startWorkoutSession(
  workoutPlanDayId?: string,
): Promise<WorkoutSession> {
  try {
    const { data } = await baseApi.post<unknown>('/workouts/session/start', {
      ...(workoutPlanDayId ? { workoutPlanDayId } : {}),
    });
    const session = unwrapWorkoutSession(data);
    if (!session) {
      throw new Error('Unable to start workout session.');
    }
    return session;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to start workout session.'));
  }
}

export async function pauseWorkoutSession(
  sessionId: string,
): Promise<WorkoutSession | null> {
  try {
    const { data } = await baseApi.post<unknown>('/workouts/session/pause', {
      sessionId,
    });
    return unwrapWorkoutSession(data);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to pause workout.'));
  }
}

export async function resumeWorkoutSession(
  sessionId: string,
): Promise<WorkoutSession | null> {
  try {
    const { data } = await baseApi.post<unknown>('/workouts/session/resume', {
      sessionId,
    });
    return unwrapWorkoutSession(data);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to resume workout.'));
  }
}

export async function endWorkoutSession(
  sessionId: string,
  options?: { force?: boolean; caloriesBurned?: number },
): Promise<void> {
  try {
    await baseApi.post('/workouts/session/end', {
      sessionId,
      ...(options?.force != null ? { force: options.force } : {}),
      ...(options?.caloriesBurned != null
        ? { caloriesBurned: options.caloriesBurned }
        : {}),
    });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to finish workout.'));
  }
}

export async function logWorkoutSet(input: {
  exerciseId: string;
  sessionId: string;
  reps: number;
  weight: number;
  setNumber: number;
  restSeconds?: number;
}): Promise<void> {
  try {
    await baseApi.post(`/workouts/exercises/${input.exerciseId}/set`, {
      sessionId: input.sessionId,
      reps: input.reps,
      weight: input.weight,
      setNumber: input.setNumber,
      ...(input.restSeconds != null ? { restSeconds: input.restSeconds } : {}),
    });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to log set.'));
  }
}

export async function completeWorkoutExercise(input: {
  exerciseId: string;
  sessionId?: string;
  skip?: boolean;
}): Promise<void> {
  try {
    await baseApi.post(`/workouts/exercises/${input.exerciseId}/complete`, {
      ...(input.sessionId ? { sessionId: input.sessionId } : {}),
      ...(input.skip != null ? { skip: input.skip } : {}),
    });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to complete exercise.'));
  }
}

export async function replaceWorkoutExercise(input: {
  exerciseId: string;
  sessionId?: string;
  replacementName: string;
  sets?: number;
  reps?: string;
  weightKg?: number;
  notes?: string;
}): Promise<void> {
  try {
    await baseApi.post(`/workouts/exercises/${input.exerciseId}/replace`, {
      replacementName: input.replacementName,
      ...(input.sessionId ? { sessionId: input.sessionId } : {}),
      ...(input.sets != null ? { sets: input.sets } : {}),
      ...(input.reps ? { reps: input.reps } : {}),
      ...(input.weightKg != null ? { weightKg: input.weightKg } : {}),
      ...(input.notes ? { notes: input.notes } : {}),
    });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to replace exercise.'));
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
      if (
        axios.isAxiosError(error) &&
        [404, 405].includes(error.response?.status ?? 0)
      ) {
        continue;
      }
      if (axios.isAxiosError(error) && (error.response?.status ?? 0) >= 500) {
        throw new Error(
          getApiErrorMessage(error, 'Unable to save exercise image.'),
        );
      }
    }
  }

  return false;
}
