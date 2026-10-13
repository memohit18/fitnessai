import { unwrapFitnessData } from './fitnessResponse';
import { pickMediaUrl } from './mediaUrl';
import type {
  WorkoutDay,
  WorkoutExercise,
  WorkoutSession,
  WorkoutSetLog,
} from '../../types/fitness';

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

function normalizeSet(raw: unknown, index: number): WorkoutSetLog | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const id = readString(record.id) || `set-${index + 1}`;
  return {
    id,
    setNumber: readNumber(record.setNumber ?? record.set ?? index + 1, index + 1),
    reps: readNullableNumber(record.reps),
    weightKg: readNullableNumber(record.weightKg ?? record.weight),
    completed: Boolean(record.completed ?? record.isCompleted ?? true),
  };
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

  const setsRaw = Array.isArray(record.loggedSets)
    ? record.loggedSets
    : Array.isArray(record.sets)
      ? record.sets
      : [];
  const loggedSets = setsRaw
    .map((item, setIndex) => normalizeSet(item, setIndex))
    .filter((item): item is WorkoutSetLog => item !== null);

  const status = readString(record.status).toLowerCase();

  return {
    id: id || `exercise-${index}`,
    exerciseId,
    name,
    targetSets: readNumber(record.targetSets ?? record.sets, 3),
    targetReps: (record.targetReps ?? record.reps ?? null) as
      | string
      | number
      | null,
    targetWeightKg: readNullableNumber(
      record.targetWeightKg ?? record.weightKg ?? record.weight,
    ),
    restSeconds: readNumber(
      record.restSeconds ?? record.rest ?? record.restTime,
      60,
    ),
    completed: Boolean(
      record.completed === true ||
        record.isCompleted === true ||
        status === 'completed' ||
        status === 'done',
    ),
    skipped: Boolean(
      record.skipped === true ||
        record.isSkipped === true ||
        status === 'skipped',
    ),
    loggedSets,
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

export function unwrapWorkoutSession(response: unknown): WorkoutSession | null {
  const data = unwrapFitnessData<Record<string, unknown>>(response);
  if (!data || typeof data !== 'object') return null;
  const record = data;
  const nested =
    record.session && typeof record.session === 'object'
      ? (record.session as Record<string, unknown>)
      : record;
  const sessionId = readString(
    nested.sessionId ?? nested.id ?? nested.workoutSessionId ?? record.sessionId,
  );
  if (!sessionId) return null;

  const exercisesRaw = Array.isArray(nested.exercises)
    ? nested.exercises
    : Array.isArray(record.exercises)
      ? record.exercises
      : [];

  return {
    sessionId,
    status: readString(nested.status ?? record.status) || 'active',
    durationSeconds: readNullableNumber(
      nested.durationSeconds ?? nested.elapsedSeconds,
    ),
    exercises: exercisesRaw
      .map((item, index) => normalizeExercise(item, index))
      .filter((item): item is WorkoutExercise => item !== null),
  };
}

export function formatClock(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function mergeSessionExercises(
  planned: WorkoutExercise[],
  sessionExercises?: WorkoutExercise[],
): WorkoutExercise[] {
  if (!sessionExercises?.length) return planned;
  const byId = new Map(sessionExercises.map((item) => [item.id, item]));
  return planned.map((exercise) => {
    const live = byId.get(exercise.id);
    if (!live) return exercise;
    return {
      ...exercise,
      ...live,
      name: live.name || exercise.name,
      imageUrl: live.imageUrl ?? exercise.imageUrl,
      restSeconds: live.restSeconds || exercise.restSeconds,
      loggedSets: live.loggedSets.length ? live.loggedSets : exercise.loggedSets,
    };
  });
}
