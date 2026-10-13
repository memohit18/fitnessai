import axios from 'axios';

import { baseApi } from './baseApi';
import {
  isFitnessErrorEnvelope,
  isMissingFitnessProfileStatus,
} from '../lib/fitness/fitnessResponse';
import {
  unwrapTransformation,
  unwrapTransformationHistory,
} from '../lib/fitness/transformationResponse';
import type {
  Transformation,
  TransformationHistoryResponse,
} from '../types/transformation';
import { getApiErrorMessage } from '../utils/api';

function isAbsent(error: unknown) {
  if (!axios.isAxiosError(error)) return false;
  if (isMissingFitnessProfileStatus(error.response?.status)) return true;
  const message = getApiErrorMessage(error, '').toLowerCase();
  return /not found|no active transformation|no transformation/.test(message);
}

export async function getActiveTransformation(): Promise<Transformation | null> {
  try {
    const { data } = await baseApi.get<unknown>('/transformation/active');
    if (isFitnessErrorEnvelope(data)) {
      if (isMissingFitnessProfileStatus(data.statusCode)) return null;
      return null;
    }
    return unwrapTransformation(data);
  } catch (error) {
    if (isAbsent(error)) return null;
    throw new Error(
      getApiErrorMessage(error, 'Unable to load transformation plan.'),
    );
  }
}

export async function generateTransformation(): Promise<Transformation> {
  try {
    const { data } = await baseApi.post<unknown>('/transformation/generate', {});
    if (isFitnessErrorEnvelope(data)) {
      throw new Error(data.message || 'Unable to generate transformation.');
    }
    const plan = unwrapTransformation(data);
    if (!plan) {
      throw new Error('Invalid transformation response.');
    }
    return plan;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, 'Unable to generate transformation.'),
    );
  }
}

export async function getTransformationHistory(params?: {
  page?: number;
  limit?: number;
}): Promise<TransformationHistoryResponse> {
  try {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const { data } = await baseApi.get<unknown>(
      `/transformation/history?page=${page}&limit=${limit}`,
    );
    if (isFitnessErrorEnvelope(data)) {
      return { items: [] };
    }
    return unwrapTransformationHistory(data);
  } catch (error) {
    if (isAbsent(error)) return { items: [] };
    throw new Error(
      getApiErrorMessage(error, 'Unable to load transformation history.'),
    );
  }
}
