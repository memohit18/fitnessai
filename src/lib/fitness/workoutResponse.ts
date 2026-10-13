import { unwrapFitnessData } from './fitnessResponse';
import { pickMediaUrl } from './mediaUrl';
import type {
  WorkoutDay,
  WorkoutExercise,
  WorkoutSession,
  WorkoutSessionAnalytics,
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

function toIsoOrNull(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (value instanceof Date) return value.toISOString();
  return null;
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
    : Array.isArray(record.sets) &&
        record.sets.some(
          (item) =>
            item &&
            typeof item === 'object' &&
            ('reps' in (item as object) || 'setNumber' in (item as object)),
        )
      ? record.sets
      : [];
  const loggedSets = setsRaw
    .map((item, setIndex) => normalizeSet(item, setIndex))
    .filter((item): item is WorkoutSetLog => item !== null);

  const status = readString(record.status).toLowerCase();
  const replacementName =
    readString(record.replacementName ?? record.replacement_name) ||
    parseReplacementName(readString(record.notes)) ||
    null;
  const replaced = Boolean(
    record.replaced === true || status === 'replaced' || replacementName,
  );

  return {
    id: id || `exercise-${index}`,
    exerciseId,
    name,
    muscleGroup:
      readString(
        nested?.muscleGroup ??
          record.muscleGroup ??
          record.muscle_group ??
          record.focus,
      ) || null,
    difficulty:
      readString(nested?.difficulty ?? record.difficulty) || null,
    notes: readString(record.notes) || null,
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
    sortOrder: readNullableNumber(record.sortOrder ?? record.order),
    completed: Boolean(
      record.completed === true ||
        record.isCompleted === true ||
        status === 'completed' ||
        status === 'done' ||
        replaced,
    ),
    skipped: Boolean(
      record.skipped === true ||
        record.isSkipped === true ||
        status === 'skipped',
    ),
    replaced,
    replacementName,
    loggedSets,
    imageUrl:
      pickMediaUrl(record) ??
      pickMediaUrl(nested) ??
      pickMediaUrl(media),
  };
}

function parseReplacementName(notes: string) {
  if (!notes) return '';
  const match = notes.match(/Replaced with:\s*([^|]+)/i);
  return match?.[1]?.trim() || '';
}

function normalizeAnalytics(
  raw: unknown,
  fallback: Partial<WorkoutSessionAnalytics> = {},
): WorkoutSessionAnalytics | null {
  const record = asRecord(raw);
  if (!record && !Object.keys(fallback).length) return null;
  const source = record ?? {};
  return {
    volumeKg: readNumber(
      source.volumeKg ?? source.workoutVolume ?? fallback.volumeKg,
    ),
    workoutVolume: readNumber(
      source.workoutVolume ?? source.volumeKg ?? fallback.workoutVolume,
    ),
    durationMinutes: readNullableNumber(
      source.durationMinutes ??
        source.workoutDurationMinutes ??
        fallback.durationMinutes,
    ),
    durationSeconds: readNullableNumber(
      source.durationSeconds ?? source.elapsedSeconds ?? fallback.durationSeconds,
    ),
    elapsedSeconds: readNullableNumber(
      source.elapsedSeconds ?? source.durationSeconds ?? fallback.elapsedSeconds,
    ),
    exercisesCompleted: readNumber(
      source.exercisesCompleted ?? fallback.exercisesCompleted,
    ),
    exercisesSkipped: readNumber(
      source.exercisesSkipped ?? fallback.exercisesSkipped,
    ),
    exercisesTotal: readNumber(
      source.exercisesTotal ?? fallback.exercisesTotal,
    ),
    setsCompleted: readNumber(source.setsCompleted ?? fallback.setsCompleted),
    setsPlanned: readNumber(source.setsPlanned ?? fallback.setsPlanned),
    caloriesBurned: readNullableNumber(
      source.caloriesBurned ?? source.calories ?? fallback.caloriesBurned,
    ),
    completionPercent: readNumber(
      source.completionPercent ?? fallback.completionPercent,
    ),
  };
}

/**
 * Active workout seconds excluding paused time.
 * While paused, freezes at pausedAt so the clock does not keep growing.
 */
export function computeElapsedSeconds(input: {
  startedAt?: string | null;
  createdAt?: string | null;
  pausedAt?: string | null;
  completedAt?: string | null;
  totalPausedSeconds?: number | null;
  elapsedSeconds?: number | null;
  durationSeconds?: number | null;
  durationMinutes?: number | null;
  nowMs?: number;
}): number {
  if (
    input.elapsedSeconds != null &&
    Number.isFinite(input.elapsedSeconds) &&
    input.elapsedSeconds >= 0
  ) {
    return Math.floor(input.elapsedSeconds);
  }
  if (
    input.durationSeconds != null &&
    Number.isFinite(input.durationSeconds) &&
    input.durationSeconds >= 0
  ) {
    return Math.floor(input.durationSeconds);
  }

  const started =
    Date.parse(input.startedAt ?? '') || Date.parse(input.createdAt ?? '');
  if (!Number.isFinite(started) || started <= 0) {
    if (input.durationMinutes != null && Number.isFinite(input.durationMinutes)) {
      return Math.max(0, Math.round(input.durationMinutes * 60));
    }
    return 0;
  }

  const completed = input.completedAt ? Date.parse(input.completedAt) : NaN;
  const paused = input.pausedAt ? Date.parse(input.pausedAt) : NaN;
  const end = Number.isFinite(completed)
    ? completed
    : Number.isFinite(paused)
      ? paused
      : (input.nowMs ?? Date.now());
  const pausedTotal = Math.max(0, input.totalPausedSeconds ?? 0);
  return Math.max(0, Math.floor((end - started) / 1000) - pausedTotal);
}

export function unwrapTodayWorkout(response: unknown): WorkoutDay | null {
  const data = unwrapFitnessData<Record<string, unknown>>(response);
  if (!data || typeof data !== 'object') return null;

  const dayRaw =
    (data.today && typeof data.today === 'object' ? data.today : null) ??
    (data.workoutPlanDay && typeof data.workoutPlanDay === 'object'
      ? data.workoutPlanDay
      : null) ??
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
    label:
      readString(record.label ?? record.title ?? record.name) || null,
    focus: readString(record.focus ?? record.focusArea ?? record.title) || null,
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

  if (data.workoutPlanDay && typeof data.workoutPlanDay === 'object') {
    return unwrapTodayWorkout({
      success: true,
      message: '',
      data: data.workoutPlanDay,
    });
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
  const analyticsRaw = asRecord(record.analytics) ?? asRecord(nested.analytics);
  const sessionId = readString(
    record.sessionId ??
      nested.sessionId ??
      nested.id ??
      nested.workoutSessionId,
  );
  if (!sessionId) return null;

  const day =
    nested.workoutPlanDay && typeof nested.workoutPlanDay === 'object'
      ? (nested.workoutPlanDay as Record<string, unknown>)
      : null;

  const exercisesRaw = Array.isArray(record.exercises)
    ? record.exercises
    : Array.isArray(nested.exercises)
      ? nested.exercises
      : Array.isArray(day?.exercises)
        ? day.exercises
        : [];

  const createdAt =
    toIsoOrNull(record.createdAt) ??
    toIsoOrNull(record.startedAt) ??
    toIsoOrNull(nested.createdAt) ??
    toIsoOrNull(nested.startedAt);
  const pausedAt =
    toIsoOrNull(record.pausedAt) ?? toIsoOrNull(nested.pausedAt);
  const completedAt =
    toIsoOrNull(record.completedAt) ?? toIsoOrNull(nested.completedAt);
  const totalPausedSeconds = readNullableNumber(
    record.totalPausedSeconds ?? nested.totalPausedSeconds,
  );

  const analytics = normalizeAnalytics(analyticsRaw, {
    volumeKg: readNumber(record.volumeKg ?? record.workoutVolume),
    caloriesBurned: readNullableNumber(record.caloriesBurned),
    exercisesCompleted: readNumber(record.exercisesCompleted),
    exercisesSkipped: readNumber(record.exercisesSkipped),
    exercisesTotal: readNumber(record.exercisesTotal),
    setsCompleted: readNumber(record.setsCompleted),
    setsPlanned: readNumber(record.setsPlanned),
    completionPercent: readNumber(record.completionPercent),
  });

  const elapsedSeconds = computeElapsedSeconds({
    startedAt: createdAt,
    createdAt,
    pausedAt,
    completedAt,
    totalPausedSeconds,
    elapsedSeconds: readNullableNumber(
      record.elapsedSeconds ??
        nested.elapsedSeconds ??
        analytics?.elapsedSeconds,
    ),
    durationSeconds: readNullableNumber(
      record.durationSeconds ?? nested.durationSeconds,
    ),
    durationMinutes: readNullableNumber(
      record.durationMinutes ?? nested.durationMinutes,
    ),
  });

  return {
    sessionId,
    status: readString(record.status ?? nested.status) || 'active',
    workoutPlanDayId:
      readString(
        record.workoutPlanDayId ?? nested.workoutPlanDayId ?? day?.id,
      ) || null,
    startedAt: createdAt,
    createdAt,
    pausedAt,
    completedAt,
    totalPausedSeconds,
    durationSeconds: elapsedSeconds,
    elapsedSeconds,
    durationMinutes: readNullableNumber(
      record.durationMinutes ??
        nested.durationMinutes ??
        analytics?.durationMinutes,
    ),
    caloriesBurned: readNullableNumber(
      record.caloriesBurned ??
        nested.caloriesBurned ??
        analytics?.caloriesBurned,
    ),
    volumeKg: readNullableNumber(
      record.volumeKg ??
        record.workoutVolume ??
        nested.volumeKg ??
        analytics?.volumeKg,
    ),
    workoutVolume: readNullableNumber(
      record.workoutVolume ?? record.volumeKg ?? analytics?.workoutVolume,
    ),
    exercisesCompleted: readNullableNumber(
      record.exercisesCompleted ?? analytics?.exercisesCompleted,
    ),
    exercisesSkipped: readNullableNumber(
      record.exercisesSkipped ?? analytics?.exercisesSkipped,
    ),
    exercisesTotal: readNullableNumber(
      record.exercisesTotal ?? analytics?.exercisesTotal,
    ),
    setsCompleted: readNullableNumber(
      record.setsCompleted ?? analytics?.setsCompleted,
    ),
    setsPlanned: readNullableNumber(
      record.setsPlanned ?? analytics?.setsPlanned,
    ),
    completionPercent: readNullableNumber(
      record.completionPercent ?? analytics?.completionPercent,
    ),
    resumed: Boolean(record.resumed),
    analytics,
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
      muscleGroup: live.muscleGroup ?? exercise.muscleGroup,
      difficulty: live.difficulty ?? exercise.difficulty,
      notes: live.notes ?? exercise.notes,
      imageUrl: live.imageUrl ?? exercise.imageUrl,
      restSeconds: live.restSeconds || exercise.restSeconds,
      loggedSets: live.loggedSets.length ? live.loggedSets : exercise.loggedSets,
      completed: live.completed || exercise.completed,
      skipped: live.skipped || exercise.skipped,
      replaced: live.replaced || exercise.replaced,
      replacementName: live.replacementName ?? exercise.replacementName,
    };
  });
}
