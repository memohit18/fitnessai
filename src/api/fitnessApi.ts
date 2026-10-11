import axios from 'axios';

import { baseApi } from './baseApi';
import { env } from '../constants';
import {
  isFitnessErrorEnvelope,
  isMissingFitnessProfileStatus,
  unwrapFitnessData,
  unwrapFitnessProfile,
} from '../lib/fitness/fitnessResponse';
import type {
  FitnessProfile,
  FitnessProfilePayload,
  PhysiqueGoal,
} from '../types/fitness';

const PROFILE_READ_PATHS = ['/fitness/profile', '/fitness-profile'] as const;

function toFitnessApiError(error: unknown, fallback: string): Error {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error : new Error(fallback);
  }

  if (!error.response) {
    return new Error(
      `Cannot reach fitness API at ${env.apiUrl}. Check EXPO_PUBLIC_API_URL and restart Metro.`,
    );
  }

  const data = error.response.data;
  if (data && typeof data === 'object') {
    const record = data as { message?: unknown };
    if (typeof record.message === 'string' && record.message.trim()) {
      return new Error(record.message);
    }
  }

  if (error.response.status === 401) {
    return new Error('Session expired. Log out and sign in again.');
  }

  return new Error(error.message || fallback);
}

function normalizePhysiqueGoal(raw: unknown): PhysiqueGoal | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const id = typeof record.id === 'string' ? record.id : '';
  if (!id) return null;
  return {
    id,
    title:
      typeof record.title === 'string' && record.title.trim()
        ? record.title.trim()
        : 'Physique goal',
    description:
      typeof record.description === 'string' ? record.description : '',
    imageUrl:
      typeof record.imageUrl === 'string'
        ? record.imageUrl
        : typeof record.image_url === 'string'
          ? record.image_url
          : '',
  };
}

export async function getFitnessProfile(): Promise<FitnessProfile | null> {
  let lastError: unknown;

  for (const path of PROFILE_READ_PATHS) {
    try {
      const { data } = await baseApi.get<unknown>(path);

      if (isFitnessErrorEnvelope(data)) {
        if (isMissingFitnessProfileStatus(data.statusCode)) return null;
        throw new Error(data.message || 'Unable to load fitness profile.');
      }

      return unwrapFitnessProfile(data);
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        isMissingFitnessProfileStatus(error.response?.status)
      ) {
        return null;
      }
      lastError = error;
    }
  }

  if (lastError) throw toFitnessApiError(lastError, 'Unable to load fitness profile.');
  return null;
}

export async function getFitnessGoals(): Promise<PhysiqueGoal[]> {
  try {
    const { data } = await baseApi.get<unknown>('/fitness/goals');
    if (isFitnessErrorEnvelope(data)) {
      throw new Error(data.message || 'Unable to load physique goals.');
    }

    const payload = unwrapFitnessData<
      PhysiqueGoal[] | { goals?: unknown[]; items?: unknown[] }
    >(data);

    if (!payload) return [];
    if (Array.isArray(payload)) {
      return payload
        .map(normalizePhysiqueGoal)
        .filter((item): item is PhysiqueGoal => item !== null);
    }

    const list = Array.isArray(payload.goals)
      ? payload.goals
      : Array.isArray(payload.items)
        ? payload.items
        : [];

    return list
      .map(normalizePhysiqueGoal)
      .filter((item): item is PhysiqueGoal => item !== null);
  } catch (error) {
    throw toFitnessApiError(error, 'Unable to load physique goals.');
  }
}

export async function saveFitnessProfile(
  payload: FitnessProfilePayload,
  existingId?: string | null,
): Promise<FitnessProfile | null> {
  try {
    const { data } = existingId
      ? await baseApi.patch<unknown>('/fitness/profile', payload)
      : await baseApi.post<unknown>('/fitness/profile', payload);

    if (isFitnessErrorEnvelope(data)) {
      throw new Error(data.message || 'Unable to save fitness profile.');
    }

    return unwrapFitnessProfile(data);
  } catch (error) {
    throw toFitnessApiError(error, 'Unable to save fitness profile.');
  }
}
