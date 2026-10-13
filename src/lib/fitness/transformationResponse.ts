import {
  isFitnessErrorEnvelope,
  unwrapFitnessData,
} from './fitnessResponse';
import type {
  Transformation,
  TransformationHistoryItem,
  TransformationHistoryMeta,
  TransformationHistoryResponse,
  TransformationMilestone,
} from '../../types/transformation';

function readNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function normalizeMilestone(raw: unknown): TransformationMilestone | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const weekNumber = readNumber(record.weekNumber ?? record.week_number);
  if (!weekNumber) return null;

  return {
    id: readString(record.id) || undefined,
    transformationTargetId:
      readString(
        record.transformationTargetId ?? record.transformation_target_id,
      ) || undefined,
    weekNumber,
    targetWeightKg: readNumber(
      record.targetWeightKg ?? record.target_weight_kg,
    ),
    targetBodyFat: readNullableNumber(
      record.targetBodyFat ?? record.target_body_fat,
    ),
    status: readString(record.status, 'pending'),
    createdAt: readString(record.createdAt ?? record.created_at) || undefined,
  };
}

function normalizeMilestones(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => normalizeMilestone(item))
    .filter((item): item is TransformationMilestone => item !== null)
    .sort((a, b) => a.weekNumber - b.weekNumber);
}

function isValidTransformation(transformation: Transformation) {
  return (
    transformation.currentWeightKg > 0 &&
    transformation.targetWeightKg > 0 &&
    transformation.dailyCalories > 0 &&
    transformation.estimatedWeeks > 0
  );
}

export function normalizeTransformation(raw: unknown): Transformation | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const id = readString(record.id);
  if (!id) return null;

  const dailyCalories = readNumber(
    record.dailyCalories ??
      record.daily_calories ??
      record.dailyCalorieTarget ??
      record.calories ??
      record.dailyTarget,
  );
  const dailyProtein = readNumber(
    record.dailyProtein ??
      record.daily_protein ??
      record.proteinTarget ??
      record.protein ??
      record.proteinGoal,
  );

  const result: Transformation = {
    id,
    currentWeightKg: readNumber(
      record.currentWeightKg ?? record.current_weight_kg,
    ),
    targetWeightKg: readNumber(
      record.targetWeightKg ?? record.target_weight_kg,
    ),
    currentBodyFat: readNullableNumber(
      record.currentBodyFat ?? record.current_body_fat,
    ),
    targetBodyFat: readNullableNumber(
      record.targetBodyFat ?? record.target_body_fat,
    ),
    bmi: readNumber(record.bmi),
    bmr: readNumber(record.bmr),
    tdee: readNumber(record.tdee),
    dailyCalories,
    dailyProtein,
    estimatedWeeks: readNumber(
      record.estimatedWeeks ?? record.estimated_weeks,
    ),
    targetPhysique:
      readString(record.targetPhysique ?? record.target_physique) || null,
    goal: readString(record.goal) || null,
    status: readString(record.status, 'ACTIVE'),
    milestones: normalizeMilestones(record.milestones),
    createdAt: readString(record.createdAt ?? record.created_at) || undefined,
    updatedAt: readString(record.updatedAt ?? record.updated_at) || undefined,
  };

  return isValidTransformation(result) ? result : null;
}

export function unwrapTransformation(response: unknown): Transformation | null {
  if (isFitnessErrorEnvelope(response)) return null;

  const data = unwrapFitnessData<
    Transformation | { transformation: Transformation }
  >(response);

  if (!data) return normalizeTransformation(response);

  if (typeof data === 'object' && 'transformation' in data) {
    return normalizeTransformation(
      (data as { transformation: unknown }).transformation,
    );
  }

  return normalizeTransformation(data);
}

export function unwrapTransformationHistory(
  response: unknown,
): TransformationHistoryResponse {
  const data = unwrapFitnessData<
    TransformationHistoryItem[] | TransformationHistoryResponse
  >(response);

  if (!data) return { items: [] };

  if (Array.isArray(data)) {
    return {
      items: data
        .map((item) => normalizeTransformation(item))
        .filter((item): item is TransformationHistoryItem => item !== null),
    };
  }

  if (typeof data === 'object' && 'items' in data) {
    const meta = (data as TransformationHistoryResponse).meta as
      | TransformationHistoryMeta
      | undefined;
    return {
      items: ((data as TransformationHistoryResponse).items ?? [])
        .map((item) => normalizeTransformation(item))
        .filter((item): item is TransformationHistoryItem => item !== null),
      meta,
    };
  }

  return { items: [] };
}
