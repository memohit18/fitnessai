import { unwrapFitnessData } from './fitnessResponse';
import { pickMediaUrl } from './mediaUrl';
import type { WorkoutDay, WorkoutExercise } from '../../types/fitness';

function readString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function readNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readNullableNumber(value: unknown) {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function normalizeExercise(raw: unknown, index: number): WorkoutExercise | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const nested = asRecord(record.exercise);
  const media = asRecord(record.media) ?? asRecord(nested?.media);

  const planRowId = readString(
    record.id ?? record.workoutPlanExerciseId ?? record.workout_plan_exercise_id,
  );
  const exerciseId =
    readString(nested?.id ?? record.exerciseId ?? record.exercise_id) || null;
  const id = planRowId || exerciseId;
  const name = readString(
    nested?.name ?? record.name ?? record.exerciseName ?? record.title,
    `Exercise ${index + 1}`,
  );
  if (!id && !name) return null;

  return {
    id: id || `exercise-${index}`,
    exerciseId,
    name,
    targetSets: readNumber(record.targetSets ?? record.sets, 3),
    targetReps: (record.targetReps ?? record.reps ?? null) as string | number | null,
    targetWeightKg: readNullableNumber(
      record.targetWeightKg ?? record.weightKg ?? record.weight,
    ),
    completed: Boolean(record.completed ?? record.isCompleted),
    imageUrl:
      pickMediaUrl(record) ??
      pickMediaUrl(nested) ??
      pickMediaUrl(media),
  };
}

export function unwrapTodayWorkout(response: unknown): WorkoutDay | null {
  const data = unwrapFitnessData<Record<string, unknown>>(response);
  if (!data || typeof data !== 'object') return null;

  const dayRaw =
    (data.today && typeof data.today === 'object' ? data.today : null) ??
    (data.day && typeof data.day === 'object' ? data.day : null) ??
    data;

  const record = dayRaw as Record<string, unknown>;
  const id = readString(record.id ?? record.workoutPlanDayId);
  const exercisesRaw = Array.isArray(record.exercises) ? record.exercises : [];
  const exercises = exercisesRaw
    .map((item, index) => normalizeExercise(item, index))
    .filter((item): item is WorkoutExercise => item !== null);

  if (!id && exercises.length === 0) return null;

  return {
    id: id || 'today',
    label: readString(record.label ?? record.name) || null,
    focus: readString(record.focus ?? record.focusArea) || null,
    estimatedMinutes: readNullableNumber(
      record.estimatedMinutes ?? record.durationMinutes,
    ),
    exercises,
  };
}

export function unwrapActiveWorkoutToday(response: unknown): WorkoutDay | null {
  const data = unwrapFitnessData<Record<string, unknown>>(response);
  if (!data || typeof data !== 'object') return null;

  if (data.today && typeof data.today === 'object') {
    return unwrapTodayWorkout({ success: true, message: '', data: data.today });
  }

  const days = Array.isArray(data.days) ? data.days : [];
  if (days[0]) {
    return unwrapTodayWorkout({ success: true, message: '', data: days[0] });
  }

  return null;
}
