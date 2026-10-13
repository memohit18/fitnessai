import type {
  FitnessProfile,
  HomeEquipment,
  PhysiqueGoal,
} from '../../types/fitness';
import { HOME_EQUIPMENT_OPTIONS } from './constants';

const HOME_EQUIPMENT_VALUES = new Set(
  HOME_EQUIPMENT_OPTIONS.map((option) => option.value),
);

function normalizeEquipmentAvailable(value: unknown): HomeEquipment[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is string => typeof item === 'string' && item.trim().length > 0,
    )
    .map((item) => item.trim())
    .filter((item): item is HomeEquipment =>
      HOME_EQUIPMENT_VALUES.has(item as HomeEquipment),
    );
}

type FitnessApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

type FitnessApiErrorEnvelope = {
  statusCode: number;
  error: string;
  message: string;
};

export function isMissingFitnessProfileStatus(status: unknown) {
  return status === 404 || status === '404';
}

export function isFitnessErrorEnvelope(
  response: unknown,
): response is FitnessApiErrorEnvelope {
  return (
    !!response &&
    typeof response === 'object' &&
    'statusCode' in response &&
    typeof (response as FitnessApiErrorEnvelope).statusCode === 'number'
  );
}

export function unwrapFitnessData<T>(response: unknown): T | null {
  if (!response || typeof response !== 'object') {
    return null;
  }

  if (isFitnessErrorEnvelope(response)) {
    return null;
  }

  if ('success' in response) {
    const envelope = response as FitnessApiEnvelope<T>;
    if (!envelope.success) return null;
    if ('data' in envelope) return envelope.data ?? null;
    return null;
  }

  return response as T;
}

function readString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function readNumber(record: Record<string, unknown>, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return fallback;
}

function readNullableNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (value == null || value === '') return null;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function normalizePhysiqueGoal(raw: unknown): PhysiqueGoal | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const id = readString(record, ['id', '_id']);
  if (!id) return null;

  return {
    id,
    title: readString(record, ['title', 'name']) || 'Physique goal',
    description: readString(record, ['description']) || '',
    imageUrl: readString(record, ['imageUrl', 'image_url']),
    targetBodyFatMin: readNullableNumber(record, ['targetBodyFatMin', 'target_body_fat_min']),
    targetBodyFatMax: readNullableNumber(record, ['targetBodyFatMax', 'target_body_fat_max']),
  };
}

export function unwrapFitnessProfile(response: unknown): FitnessProfile | null {
  const data = unwrapFitnessData<
    FitnessProfile | null | { profile: FitnessProfile | null }
  >(response);

  if (!data) return null;

  let profile: Record<string, unknown> | null = null;
  if (typeof data === 'object' && data && 'profile' in data) {
    profile = (data.profile as Record<string, unknown> | null) ?? null;
  } else if (typeof data === 'object' && data && 'id' in data) {
    profile = data as Record<string, unknown>;
  }

  if (!profile?.id) return null;

  const nestedPhysiqueGoal =
    profile.physiqueGoal ?? profile.physique_goal ?? null;

  return {
    id: String(profile.id),
    age: readNumber(profile, ['age']),
    gender: (readString(profile, ['gender']) || 'prefer_not_to_say') as FitnessProfile['gender'],
    heightCm: readNumber(profile, ['heightCm', 'height_cm']),
    weightKg: readNumber(profile, ['weightKg', 'weight_kg']),
    activityLevel: (readString(profile, ['activityLevel', 'activity_level']) ||
      'sedentary') as FitnessProfile['activityLevel'],
    fitnessGoal: (readString(profile, ['fitnessGoal', 'fitness_goal']) ||
      'maintain_weight') as FitnessProfile['fitnessGoal'],
    physiqueGoalId: String(
      profile.physiqueGoalId ?? profile.physique_goal_id ?? '',
    ),
    dietType: (readString(profile, ['dietType', 'diet_type']) ||
      'balanced') as FitnessProfile['dietType'],
    workoutExperience: (readString(profile, [
      'workoutExperience',
      'workout_experience',
    ]) || 'beginner') as FitnessProfile['workoutExperience'],
    workoutDaysPerWeek: readNumber(profile, [
      'workoutDaysPerWeek',
      'workout_days_per_week',
    ]),
    workoutMode: (readString(profile, ['workoutMode', 'workout_mode']) ||
      'gym') as FitnessProfile['workoutMode'],
    equipmentAvailable: normalizeEquipmentAvailable(
      profile.equipmentAvailable ?? profile.equipment_available,
    ),
    targetWeightKg: readNullableNumber(profile, [
      'targetWeightKg',
      'target_weight_kg',
    ]),
    targetBodyFatPercent: readNullableNumber(profile, [
      'targetBodyFatPercent',
      'target_body_fat_percent',
    ]),
    allergies:
      typeof profile.allergies === 'string' ? profile.allergies : profile.allergies == null
        ? null
        : String(profile.allergies),
    onboardingCompleted: Boolean(
      profile.onboardingCompleted ?? profile.onboarding_completed,
    ),
    physiqueGoal: normalizePhysiqueGoal(nestedPhysiqueGoal),
    createdAt:
      typeof profile.createdAt === 'string'
        ? profile.createdAt
        : typeof profile.created_at === 'string'
          ? profile.created_at
          : undefined,
    updatedAt:
      typeof profile.updatedAt === 'string'
        ? profile.updatedAt
        : typeof profile.updated_at === 'string'
          ? profile.updated_at
          : undefined,
  };
}

export function hasCompletedFitnessOnboarding(
  profile: FitnessProfile | null | undefined,
) {
  if (!profile?.id) return false;
  if (profile.onboardingCompleted) return true;

  return Boolean(
    profile.age &&
      profile.gender &&
      profile.heightCm &&
      profile.weightKg &&
      profile.activityLevel &&
      profile.fitnessGoal &&
      profile.physiqueGoalId &&
      profile.dietType &&
      profile.workoutExperience &&
      profile.workoutDaysPerWeek,
  );
}
