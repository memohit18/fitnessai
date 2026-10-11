import { unwrapFitnessData } from './fitnessResponse';
import type {
  DailyDashboard,
  DashboardAchievement,
  DashboardBreakdown,
  DashboardCheckinMeta,
  DashboardMacro,
  DashboardMealProgress,
  DashboardScoreWeights,
  DashboardSources,
  DashboardTask,
  DashboardWaterProgress,
  DashboardWorkoutProgress,
} from '../../types/dashboard';

function readString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function readNumber(value: unknown, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readBoolean(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 1 || value === '1') return true;
  if (value === 'false' || value === 0 || value === '0') return false;
  return fallback;
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null;
}

function unwrapWeights(raw: unknown): DashboardScoreWeights | null {
  const record = asRecord(raw);
  if (!record) return null;
  return {
    meals: readNumber(record.meals),
    workout: readNumber(record.workout),
    calories: readNumber(record.calories),
    protein: readNumber(record.protein),
    water: readNumber(record.water),
  };
}

function unwrapBreakdown(raw: unknown): DashboardBreakdown | null {
  const record = asRecord(raw);
  if (!record) return null;
  return {
    meals: readNullableNumber(record.meals),
    workout: readNullableNumber(record.workout),
    calories: readNullableNumber(record.calories),
    protein: readNullableNumber(record.protein),
    water: readNullableNumber(record.water),
  };
}

function unwrapMeals(raw: unknown): DashboardMealProgress {
  const record = asRecord(raw) ?? {};
  const completed = readNumber(record.completed);
  const assigned = readNumber(record.assigned ?? record.total);
  const skipped = readNumber(record.skipped);
  const score = readNullableNumber(record.score);
  return {
    completed,
    assigned,
    skipped,
    score,
    percent:
      assigned > 0
        ? clampPercent((completed / assigned) * 100)
        : score != null
          ? clampPercent(score)
          : 0,
  };
}

function unwrapWorkout(raw: unknown): DashboardWorkoutProgress {
  const record = asRecord(raw) ?? {};
  return {
    completed: readBoolean(record.completed),
    score: readNullableNumber(record.score),
  };
}

function unwrapWater(raw: unknown): DashboardWaterProgress {
  const record = asRecord(raw) ?? {};
  const currentMl = readNumber(
    record.currentMl ?? record.amountMl ?? record.current,
  );
  const targetMl = readNumber(
    record.targetMl ?? record.goalMl ?? record.target ?? record.goal,
    3500,
  );
  const percent =
    readNullableNumber(record.percent ?? record.percentage) ??
    (targetMl > 0 ? (currentMl / targetMl) * 100 : 0);
  return {
    currentMl,
    goalMl: targetMl,
    targetMl,
    remainingMl: Math.max(0, targetMl - currentMl),
    percent: clampPercent(percent),
  };
}

function toMacro(
  current: number,
  goal: number,
  remaining?: number | null,
): DashboardMacro {
  const safeGoal = Math.max(0, goal);
  const safeCurrent = Math.max(0, current);
  return {
    current: safeCurrent,
    goal: safeGoal,
    remaining:
      remaining != null
        ? Math.max(0, remaining)
        : Math.max(0, safeGoal - safeCurrent),
    percent: safeGoal > 0 ? clampPercent((safeCurrent / safeGoal) * 100) : 0,
  };
}

function unwrapAchievement(raw: unknown): DashboardAchievement | null {
  const record = asRecord(raw);
  if (!record) return null;
  const id = readString(record.id);
  if (!id) return null;
  return {
    id,
    title: readString(record.title, 'Achievement'),
    description: readString(record.description),
    unlocked: readBoolean(record.unlocked),
    unlockedAt: readString(record.unlockedAt) || null,
  };
}

function unwrapAchievements(raw: unknown): DashboardAchievement[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(unwrapAchievement)
    .filter((item): item is DashboardAchievement => Boolean(item));
}

function unwrapSources(raw: unknown): DashboardSources | null {
  const record = asRecord(raw);
  if (!record) return null;
  return {
    mealLogs: readNumber(record.mealLogs),
    hydrationLogs: readNumber(record.hydrationLogs),
    workoutSessions: readNumber(record.workoutSessions),
    progressLogs: readNumber(record.progressLogs),
  };
}

function unwrapCheckinMeta(raw: unknown): DashboardCheckinMeta | null {
  const record = asRecord(raw);
  if (!record) return null;
  return {
    id: readString(record.id) || null,
    userId: readString(record.userId) || null,
    checkInDate: readString(record.checkInDate ?? record.date) || null,
    dietCompliance: readNullableNumber(record.dietCompliance),
    mealsCompleted: readNullableNumber(record.mealsCompleted),
    workoutCompleted:
      record.workoutCompleted == null
        ? null
        : readBoolean(record.workoutCompleted),
  };
}

function buildTasks(input: {
  meals: DashboardMealProgress;
  workout: DashboardWorkoutProgress;
  water: DashboardWaterProgress;
  protein: DashboardMacro;
}): DashboardTask[] {
  const tasks: DashboardTask[] = [];
  const remainingMeals = Math.max(
    0,
    input.meals.assigned - input.meals.completed,
  );

  if (input.meals.assigned > 0) {
    tasks.push({
      id: 'meals',
      label:
        remainingMeals > 0
          ? `Log ${remainingMeals} remaining meal${remainingMeals === 1 ? '' : 's'}`
          : 'All meals logged',
      done: remainingMeals === 0,
      category: 'meals',
    });
  }

  tasks.push({
    id: 'workout',
    label: input.workout.completed
      ? 'Workout completed'
      : "Complete today's workout",
    done: input.workout.completed,
    category: 'workout',
  });

  tasks.push({
    id: 'water',
    label:
      input.water.percent >= 100
        ? 'Hydration goal hit'
        : "Reach today's water goal",
    done: input.water.percent >= 100,
    category: 'water',
  });

  tasks.push({
    id: 'protein',
    label:
      input.protein.percent >= 100
        ? 'Protein target hit'
        : "Hit today's protein target",
    done: input.protein.percent >= 100,
    category: 'macros',
  });

  return tasks;
}

function normalizeDashboardPayload(raw: unknown): DailyDashboard | null {
  const data = asRecord(raw);
  if (!data) return null;

  const meals = unwrapMeals(data.meals);
  const workout = unwrapWorkout(data.workout);
  const water = unwrapWater(data.water);

  const calories = toMacro(
    readNumber(data.calories),
    readNumber(data.calorieTarget ?? data.caloriesTarget ?? data.calorieGoal),
    readNullableNumber(data.remainingCalories),
  );
  const protein = toMacro(
    readNumber(data.protein),
    readNumber(data.proteinTarget ?? data.proteinGoal),
    readNullableNumber(data.remainingProtein),
  );

  return {
    date: readString(data.date) || null,
    todayScore: readNullableNumber(data.todayScore ?? data.score),
    breakdown: unwrapBreakdown(data.breakdown),
    weights: unwrapWeights(data.weights),
    meals,
    workout,
    water,
    calories,
    protein,
    remainingCalories: calories.remaining,
    remainingProtein: protein.remaining,
    compliance: readNullableNumber(data.compliance ?? data.compliancePercent),
    currentStreak: readNullableNumber(
      data.currentStreak ?? data.streakDays ?? data.streak,
    ),
    longestStreak: readNullableNumber(data.longestStreak),
    achievements: unwrapAchievements(data.achievements),
    checkin: unwrapCheckinMeta(data.checkin),
    sources: unwrapSources(data.sources),
    tasks: buildTasks({ meals, workout, water, protein }),
  };
}

export function unwrapDailyDashboard(response: unknown): DailyDashboard | null {
  const data = unwrapFitnessData(response);
  return normalizeDashboardPayload(data);
}

export function unwrapHydrationToday(response: unknown): {
  amountMl: number;
  goalMl: number;
  remainingMl: number;
  percent: number;
} | null {
  const data = unwrapFitnessData(response);
  const record = asRecord(data);
  if (!record) return null;
  const amountMl = readNumber(
    record.amountMl ?? record.currentMl ?? record.totalMl ?? record.consumedMl,
  );
  const goalMl = readNumber(record.goalMl ?? record.targetMl ?? record.goal, 3500);
  const remainingMl = readNullableNumber(record.remainingMl);
  const percent =
    readNullableNumber(record.percent ?? record.percentage) ??
    (goalMl > 0 ? Math.min(100, (amountMl / goalMl) * 100) : 0);

  return {
    amountMl,
    goalMl,
    remainingMl: remainingMl ?? Math.max(0, goalMl - amountMl),
    percent: clampPercent(percent),
  };
}
