import { unwrapFitnessData, isFitnessErrorEnvelope } from '../fitnessResponse';
import {
  DIET_DAY_ORDER,
  DIET_MEAL_ORDER,
} from './constants';
import type {
  DietDayKey,
  DietDayPlan,
  DietGroceryItem,
  DietGroceryPreview,
  DietHistoryItem,
  DietHistoryMeta,
  DietHistoryResponse,
  DietMacroProgress,
  DietMeal,
  DietMealType,
  DietNutritionSummary,
  DietPlan,
  DietPlanner,
} from './types';

function readString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function readNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDayKey(value: unknown): DietDayKey | null {
  const raw = readString(value).toLowerCase();
  const aliases: Record<string, DietDayKey> = {
    mon: 'monday',
    monday: 'monday',
    tue: 'tuesday',
    tues: 'tuesday',
    tuesday: 'tuesday',
    wed: 'wednesday',
    wednesday: 'wednesday',
    thu: 'thursday',
    thur: 'thursday',
    thurs: 'thursday',
    thursday: 'thursday',
    fri: 'friday',
    friday: 'friday',
    sat: 'saturday',
    saturday: 'saturday',
    sun: 'sunday',
    sunday: 'sunday',
  };

  return aliases[raw] ?? null;
}

function parseLocalYmd(value: unknown): Date | null {
  const raw = readString(value);
  if (!raw) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (match) {
    return new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
    );
  }
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatLocalYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dayKeyFromDate(value: unknown): DietDayKey | null {
  const date = parseLocalYmd(value);
  if (!date) return null;
  const weekday = date.getDay(); // 0 Sun … 6 Sat
  return DIET_DAY_ORDER[weekday === 0 ? 6 : weekday - 1] ?? null;
}

/** ISO date (YYYY-MM-DD) for a weekday in the same week as `weekDate`. */
export function getDateForDietDay(
  weekDate: string | null | undefined,
  day: DietDayKey,
): string {
  const base = parseLocalYmd(weekDate) ?? new Date();
  const baseDay = dayKeyFromDate(formatLocalYmd(base)) ?? 'monday';
  const diff =
    DIET_DAY_ORDER.indexOf(day) - DIET_DAY_ORDER.indexOf(baseDay);
  const next = new Date(base);
  next.setDate(next.getDate() + diff);
  return formatLocalYmd(next);
}

export function getDietDayKeyFromDate(
  value: string | null | undefined,
): DietDayKey | null {
  return dayKeyFromDate(value);
}

function normalizeMealType(value: unknown): DietMealType | null {
  const raw = readString(value).toLowerCase();
  if (
    raw === 'breakfast' ||
    raw === 'lunch' ||
    raw === 'snack' ||
    raw === 'dinner'
  ) {
    return raw;
  }
  return null;
}

function normalizeMacroProgress(raw: unknown): DietMacroProgress | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return { current: raw, goal: raw };
  }

  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const goal = readNumber(
    record.goal ??
      record.target ??
      record.total ??
      record.goalMl ??
      record.goal_ml,
  );
  const current = readNumber(
    record.current ??
      record.value ??
      record.consumed ??
      record.amount ??
      record.amountMl ??
      record.amount_ml,
  );

  if (goal <= 0 && current <= 0) return null;
  return { current, goal: goal > 0 ? goal : current };
}

function normalizeMeal(raw: unknown, fallbackType?: DietMealType): DietMeal | null {
  if (!raw || typeof raw !== 'object') return null;

  const record = raw as Record<string, unknown>;
  const nestedFood =
    record.food && typeof record.food === 'object'
      ? (record.food as Record<string, unknown>)
      : null;

  const id =
    readString(
      record.id ??
        record._id ??
        record.mealId ??
        record.meal_id ??
        record.mealPlanItemId ??
        record.meal_plan_item_id,
    ) ||
    [
      readString(record.foodId ?? record.food_id),
      readString(record.foodName ?? record.food_name ?? record.name),
      readString(record.mealType ?? record.meal_type),
      readString(record.dayNumber ?? record.day_number),
    ]
      .filter(Boolean)
      .join('-');
  const name = readString(
    record.name ??
      record.title ??
      record.foodName ??
      record.food_name ??
      nestedFood?.name ??
      nestedFood?.title,
  );
  const type =
    normalizeMealType(
      record.type ??
        record.mealType ??
        record.meal_type ??
        record.slot ??
        record.category ??
        record.mealSlot,
    ) ?? fallbackType ?? null;

  if (!id || !name || !type) return null;

  return {
    id,
    type,
    name,
    imageUrl:
      readString(
        record.imageUrl ??
          record.image_url ??
          record.image ??
          record.photoUrl ??
          nestedFood?.imageUrl ??
          nestedFood?.image_url,
      ) || null,
    servingSize:
      readString(
        record.servingSize ??
          record.serving_size ??
          record.serving ??
          record.portion ??
          nestedFood?.servingSize,
      ) ||
      (record.quantity !== undefined && record.quantity !== null
        ? String(record.quantity)
        : null),
    calories: readNumber(
      record.calories ??
        record.cals ??
        record.kcal ??
        record.energy ??
        nestedFood?.calories,
    ),
    protein: readNumber(
      record.protein ?? record.proteinG ?? record.protein_g ?? nestedFood?.protein,
    ),
    carbs: readNumber(
      record.carbs ??
        record.carbohydrates ??
        record.carb ??
        record.carbsG ??
        nestedFood?.carbs,
    ),
    fats: readNumber(
      record.fats ?? record.fat ?? record.fatG ?? record.fats_g ?? nestedFood?.fats,
    ),
  };
}

function normalizeMeals(raw: unknown): DietMeal[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => normalizeMeal(item))
    .filter((item): item is DietMeal => item !== null)
    .sort(
      (a, b) =>
        DIET_MEAL_ORDER.indexOf(a.type) - DIET_MEAL_ORDER.indexOf(b.type),
    );
}

function normalizeDayPlan(raw: unknown, fallbackDay?: DietDayKey): DietDayPlan | null {
  if (!raw || typeof raw !== 'object') return null;

  const record = raw as Record<string, unknown>;
  const date = readString(record.date ?? record.planDate ?? record.plan_date) || null;
  const day =
    normalizeDayKey(
      record.day ??
        record.dayOfWeek ??
        record.day_of_week ??
        record.dayName ??
        record.name,
    ) ??
    dayKeyFromDate(date) ??
    fallbackDay ??
    null;

  if (!day) return null;

  const meals = normalizeMeals(
    record.meals ??
      record.items ??
      record.mealItems ??
      record.meal_items ??
      record.mealPlanItems ??
      record.meal_plan_items,
  );

  return { day, date, meals };
}

function dayKeyFromDayNumber(value: unknown): DietDayKey | null {
  const dayNumber = readNumber(value);
  if (dayNumber < 1 || dayNumber > 7) return null;
  return DIET_DAY_ORDER[dayNumber - 1] ?? null;
}

function normalizeDaysFromMealItems(raw: unknown): DietDayPlan[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];

  const byDay = new Map<DietDayKey, DietMeal[]>();

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const day =
      dayKeyFromDayNumber(record.dayNumber ?? record.day_number ?? record.day) ??
      normalizeDayKey(record.dayName ?? record.day_name);

    if (!day) continue;

    const meal = normalizeMeal(item);
    if (!meal) continue;

    const existing = byDay.get(day) ?? [];
    existing.push(meal);
    byDay.set(day, existing);
  }

  return DIET_DAY_ORDER.filter((day) => byDay.has(day)).map((day) => ({
    day,
    meals: (byDay.get(day) ?? []).sort(
      (a, b) =>
        DIET_MEAL_ORDER.indexOf(a.type) - DIET_MEAL_ORDER.indexOf(b.type),
    ),
  }));
}

function normalizeDays(raw: unknown): DietDayPlan[] {
  if (Array.isArray(raw)) {
    // Phase 4 meal-plan items use dayNumber + mealType + foodName
    if (
      raw.length > 0 &&
      raw.every(
        (item) =>
          item &&
          typeof item === 'object' &&
          ('dayNumber' in item ||
            'day_number' in item ||
            'mealType' in item ||
            'meal_type' in item ||
            'foodName' in item),
      )
    ) {
      const fromItems = normalizeDaysFromMealItems(raw);
      if (fromItems.length > 0) return fromItems;
    }

    return raw
      .map((item, index) => normalizeDayPlan(item, DIET_DAY_ORDER[index]))
      .filter((item): item is DietDayPlan => item !== null)
      .sort(
        (a, b) =>
          DIET_DAY_ORDER.indexOf(a.day) - DIET_DAY_ORDER.indexOf(b.day),
      );
  }

  if (raw && typeof raw === 'object') {
    const record = raw as Record<string, unknown>;
    return DIET_DAY_ORDER.map((day) => {
      const dayRaw = record[day] ?? record[day.slice(0, 3)];
      if (!dayRaw) return null;
      if (Array.isArray(dayRaw)) {
        return { day, meals: normalizeMeals(dayRaw) };
      }
      return normalizeDayPlan(dayRaw, day);
    }).filter((item): item is DietDayPlan => item !== null);
  }

  return [];
}

function normalizeNutrition(
  raw: unknown,
  plan: {
    dailyCalories: number;
    dailyProtein: number;
    dailyCarbs?: number;
    dailyFats?: number;
  },
): DietNutritionSummary | null {
  if (!raw || typeof raw !== 'object') {
    if (plan.dailyCalories <= 0) return null;
    return {
      calories: { current: 0, goal: plan.dailyCalories },
      protein: { current: 0, goal: plan.dailyProtein },
      carbs: { current: 0, goal: plan.dailyCarbs ?? 0 },
      fats: { current: 0, goal: plan.dailyFats ?? 0 },
    };
  }

  const record = raw as Record<string, unknown>;
  return {
    calories:
      normalizeMacroProgress(record.calories ?? record.calorie) ?? {
        current: 0,
        goal: plan.dailyCalories,
      },
    protein:
      normalizeMacroProgress(record.protein) ?? {
        current: 0,
        goal: plan.dailyProtein,
      },
    carbs:
      normalizeMacroProgress(record.carbs ?? record.carbohydrates) ?? {
        current: 0,
        goal: plan.dailyCarbs ?? 0,
      },
    fats:
      normalizeMacroProgress(record.fats ?? record.fat) ?? {
        current: 0,
        goal: plan.dailyFats ?? 0,
      },
    water: normalizeMacroProgress(record.water ?? record.hydration),
    fiber: normalizeMacroProgress(record.fiber ?? record.fibre),
  };
}

function normalizeGroceryItem(raw: unknown): DietGroceryItem | null {
  if (!raw || typeof raw !== 'object') {
    if (typeof raw === 'string' && raw.trim()) {
      return { name: raw.trim(), quantity: '' };
    }
    return null;
  }

  const record = raw as Record<string, unknown>;
  const name = readString(record.name ?? record.item ?? record.title);
  if (!name) return null;

  return {
    id: readString(record.id) || undefined,
    name,
    quantity: readString(
      record.quantity ?? record.amount ?? record.qty ?? record.serving,
    ),
  };
}

function normalizeGrocery(raw: unknown): DietGroceryPreview | null {
  if (!raw) return null;

  if (Array.isArray(raw)) {
    const items = raw
      .map((item) => normalizeGroceryItem(item))
      .filter((item): item is DietGroceryItem => item !== null);
    return items.length > 0 ? { items } : null;
  }

  if (typeof raw !== 'object') return null;

  const record = raw as Record<string, unknown>;
  const items = (
    Array.isArray(record.items)
      ? record.items
      : Array.isArray(record.topItems)
        ? record.topItems
        : Array.isArray(record.top_items)
          ? record.top_items
          : []
  )
    .map((item) => normalizeGroceryItem(item))
    .filter((item): item is DietGroceryItem => item !== null);

  if (items.length === 0) return null;

  return {
    items,
    estimatedWeeklyCost: readNullableNumber(
      record.estimatedWeeklyCost ??
        record.estimated_weekly_cost ??
        record.weeklyCost ??
        record.cost,
    ),
    currency: readString(record.currency) || null,
  };
}

function readTargets(record: Record<string, unknown>) {
  const nestedTargets =
    record.targets && typeof record.targets === 'object'
      ? (record.targets as Record<string, unknown>)
      : null;
  const responseJson =
    record.responseJson && typeof record.responseJson === 'object'
      ? (record.responseJson as Record<string, unknown>)
      : record.response_json && typeof record.response_json === 'object'
        ? (record.response_json as Record<string, unknown>)
        : null;

  const dailyCalories = readNumber(
    record.dailyCalories ??
      record.daily_calories ??
      record.caloriesTarget ??
      record.calories_target ??
      record.calories ??
      record.targetCalories ??
      nestedTargets?.calories ??
      nestedTargets?.dailyCalories ??
      responseJson?.dailyCalories ??
      responseJson?.calories,
  );
  const dailyProtein = readNumber(
    record.dailyProtein ??
      record.daily_protein ??
      record.proteinTarget ??
      record.protein_target ??
      record.protein ??
      record.targetProtein ??
      nestedTargets?.protein ??
      nestedTargets?.dailyProtein ??
      responseJson?.dailyProtein ??
      responseJson?.protein,
  );
  const dailyCarbs = readNullableNumber(
    record.dailyCarbs ??
      record.daily_carbs ??
      record.carbsTarget ??
      record.carbs_target ??
      record.carbs ??
      nestedTargets?.carbs ??
      nestedTargets?.dailyCarbs ??
      responseJson?.dailyCarbs ??
      responseJson?.carbs,
  );
  const dailyFats = readNullableNumber(
    record.dailyFats ??
      record.daily_fats ??
      record.fatsTarget ??
      record.fats_target ??
      record.fats ??
      nestedTargets?.fats ??
      nestedTargets?.dailyFats ??
      responseJson?.dailyFats ??
      responseJson?.fats,
  );

  return { dailyCalories, dailyProtein, dailyCarbs, dailyFats };
}

function isValidDietPlan(plan: DietPlan) {
  return Boolean(plan.id) && (plan.dailyCalories > 0 || plan.days.length > 0);
}

export function normalizeDietPlan(raw: unknown): DietPlan | null {
  if (!raw || typeof raw !== 'object') return null;

  const record = raw as Record<string, unknown>;
  const id = readString(record.id ?? record._id ?? record.dietId ?? record.diet_id);
  if (!id) return null;

  const targets = readTargets(record);
  const mealPlan =
    record.mealPlan && typeof record.mealPlan === 'object'
      ? (record.mealPlan as Record<string, unknown>)
      : record.meal_plan && typeof record.meal_plan === 'object'
        ? (record.meal_plan as Record<string, unknown>)
        : null;
  const responseJson =
    record.responseJson && typeof record.responseJson === 'object'
      ? (record.responseJson as Record<string, unknown>)
      : record.response_json && typeof record.response_json === 'object'
        ? (record.response_json as Record<string, unknown>)
        : null;

  const daysFromMealPlan = normalizeDays(
    mealPlan?.items ?? mealPlan?.meals ?? mealPlan?.schedule,
  );
  const daysFromResponseJson = normalizeDays(
    responseJson?.meals ?? responseJson?.items,
  );
  const daysFromRoot = normalizeDays(
    record.days ??
      record.weeklyPlan ??
      record.weekly_plan ??
      record.mealPlan ??
      record.meal_plan ??
      record.plan ??
      record.schedule ??
      record.items,
  );

  const days =
    daysFromMealPlan.length > 0
      ? daysFromMealPlan
      : daysFromResponseJson.length > 0
        ? daysFromResponseJson
        : daysFromRoot;

  const plan: DietPlan = {
    id,
    goal:
      readString(
        record.goal ??
          record.fitnessGoal ??
          record.fitness_goal ??
          record.targetGoal ??
          responseJson?.goal,
      ) || null,
    dailyCalories: targets.dailyCalories,
    dailyProtein: targets.dailyProtein,
    dailyCarbs: targets.dailyCarbs ?? undefined,
    dailyFats: targets.dailyFats ?? undefined,
    mealsPerDay: Math.max(
      1,
      readNumber(
        record.mealsPerDay ??
          record.meals_per_day ??
          record.mealCount ??
          (days[0]?.meals.length || 0),
        days[0]?.meals.length || 4,
      ),
    ),
    durationWeeks: Math.max(
      1,
      readNumber(
        record.durationWeeks ??
          record.duration_weeks ??
          record.estimatedWeeks ??
          record.weeks ??
          days.length,
        days.length || 1,
      ),
    ),
    version: readNullableNumber(record.version ?? record.planVersion),
    status: readString(record.status, 'ACTIVE'),
    days,
    nutrition: normalizeNutrition(
      record.nutrition ??
        record.macros ??
        record.summary ??
        record.targets ??
        responseJson,
      {
        dailyCalories: targets.dailyCalories,
        dailyProtein: targets.dailyProtein,
        dailyCarbs: targets.dailyCarbs ?? undefined,
        dailyFats: targets.dailyFats ?? undefined,
      },
    ),
    grocery: normalizeGrocery(
      record.grocery ??
        record.groceryList ??
        record.grocery_list ??
        record.shoppingList,
    ),
    createdAt: readString(record.createdAt ?? record.created_at) || undefined,
    updatedAt: readString(record.updatedAt ?? record.updated_at) || undefined,
  };

  return isValidDietPlan(plan) ? plan : null;
}

export function unwrapDietPlan(response: unknown): DietPlan | null {
  if (isFitnessErrorEnvelope(response)) {
    return null;
  }

  const data = unwrapFitnessData<
    | DietPlan
    | {
        diet?: unknown;
        plan?: unknown;
        active?: unknown;
        dietPlan?: unknown;
        diet_plan?: unknown;
      }
  >(response);

  if (!data) {
    return normalizeDietPlan(response);
  }

  if (typeof data === 'object' && data !== null) {
    if ('dietPlan' in data) return normalizeDietPlan(data.dietPlan);
    if ('diet_plan' in data) return normalizeDietPlan(data.diet_plan);
    if ('diet' in data) return normalizeDietPlan(data.diet);
    if ('plan' in data) return normalizeDietPlan(data.plan);
    if ('active' in data) return normalizeDietPlan(data.active);
  }

  return normalizeDietPlan(data);
}

function normalizeProgressMacro(
  progressRaw: unknown,
  goalFallback: number,
): DietMacroProgress {
  if (progressRaw && typeof progressRaw === 'object') {
    const record = progressRaw as Record<string, unknown>;
    const current = readNumber(
      record.consumed ?? record.current ?? record.value ?? record.amount,
    );
    const goal = readNumber(
      record.goal ??
        record.target ??
        record.total ??
        (goalFallback > 0
          ? goalFallback
          : readNumber(record.remaining) + current),
      goalFallback,
    );
    return {
      current,
      goal: goal > 0 ? goal : goalFallback,
      remaining: readNullableNumber(record.remaining) ?? undefined,
      percent: readNullableNumber(record.percent) ?? undefined,
    };
  }

  return { current: 0, goal: goalFallback };
}

function normalizePlannerMealSlot(raw: unknown): DietMeal | null {
  if (!raw || typeof raw !== 'object') return null;

  const record = raw as Record<string, unknown>;
  const items = Array.isArray(record.items) ? record.items : [];
  const firstItem =
    items[0] && typeof items[0] === 'object'
      ? (items[0] as Record<string, unknown>)
      : null;
  const macros =
    record.macros && typeof record.macros === 'object'
      ? (record.macros as Record<string, unknown>)
      : null;

  const type = normalizeMealType(
    record.mealType ?? record.meal_type ?? record.type ?? record.slot,
  );
  if (!type) return null;

  const id =
    readString(
      record.id ??
        firstItem?.id ??
        firstItem?.foodId ??
        record.mealPlanItemId,
    ) || `${type}-${readString(record.scheduledTime ?? record.displayName)}`;

  const name =
    readString(
      record.description ??
        record.displayName ??
        record.name ??
        firstItem?.foodName ??
        firstItem?.name,
    ) || type;

  const quantity = firstItem?.quantity ?? record.quantity;
  const servingSize =
    readString(record.servingSize ?? firstItem?.servingSize) ||
    (quantity !== undefined && quantity !== null ? String(quantity) : null);

  return {
    id,
    type,
    name,
    imageUrl:
      readString(record.imageUrl ?? firstItem?.imageUrl ?? firstItem?.image_url) ||
      null,
    servingSize,
    scheduledTime: readString(record.scheduledTime ?? record.scheduled_time) || null,
    calories: readNumber(
      macros?.calories ?? record.calories ?? firstItem?.calories,
    ),
    protein: readNumber(
      macros?.protein ?? record.protein ?? firstItem?.protein,
    ),
    carbs: readNumber(macros?.carbs ?? record.carbs ?? firstItem?.carbs),
    fats: readNumber(macros?.fats ?? record.fats ?? firstItem?.fats),
    canSwap: Boolean(record.canSwap ?? record.can_swap),
    canEdit: Boolean(record.canEdit ?? record.can_edit),
    tag: readString(record.tag) || null,
    status: readString(record.status) || null,
  };
}

function normalizePlannerMeals(raw: unknown): DietMeal[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => normalizePlannerMealSlot(item))
    .filter((item): item is DietMeal => item !== null)
    .sort(
      (a, b) =>
        DIET_MEAL_ORDER.indexOf(a.type) - DIET_MEAL_ORDER.indexOf(b.type),
    );
}

function normalizePlannerHydration(raw: unknown): {
  hydration: DietMacroProgress | null;
  quickAdds: number[];
} {
  if (!raw || typeof raw !== 'object') {
    return { hydration: null, quickAdds: [250, 500, 750, 1000] };
  }

  const record = raw as Record<string, unknown>;
  const currentLiters = readNullableNumber(
    record.currentLiters ?? record.current_liters,
  );
  const targetLiters = readNullableNumber(
    record.targetLiters ?? record.target_liters,
  );
  const currentMl = readNumber(
    record.currentMl ?? record.current_ml ?? record.current,
  );
  const targetMl = readNumber(
    record.targetMl ?? record.target_ml ?? record.target ?? record.goal,
  );

  const hydration: DietMacroProgress = {
    current:
      currentLiters !== null
        ? currentLiters
        : currentMl > 0
          ? currentMl / 1000
          : 0,
    goal:
      targetLiters !== null && targetLiters > 0
        ? targetLiters
        : targetMl > 0
          ? targetMl / 1000
          : 4,
    percent: readNullableNumber(record.percent) ?? undefined,
  };

  const quickAdds = Array.isArray(record.quickAddOptionsMl)
    ? record.quickAddOptionsMl
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0)
    : Array.isArray(record.quick_add_options_ml)
      ? record.quick_add_options_ml
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value) && value > 0)
      : [250, 500, 750, 1000];

  return { hydration, quickAdds };
}

export function normalizeDietPlanner(raw: unknown): DietPlanner | null {
  if (!raw || typeof raw !== 'object') return null;

  const record = raw as Record<string, unknown>;
  const planRecord =
    record.plan && typeof record.plan === 'object'
      ? (record.plan as Record<string, unknown>)
      : record.dietPlan && typeof record.dietPlan === 'object'
        ? (record.dietPlan as Record<string, unknown>)
        : {};

  const targets = readTargets({ ...planRecord, ...record });
  const progress =
    record.progress && typeof record.progress === 'object'
      ? (record.progress as Record<string, unknown>)
      : {};
  const vitals =
    record.vitals && typeof record.vitals === 'object'
      ? (record.vitals as Record<string, unknown>)
      : {};
  const transformation =
    record.transformation && typeof record.transformation === 'object'
      ? (record.transformation as Record<string, unknown>)
      : {};

  const date =
    readString(record.date ?? record.planDate ?? record.plan_date) || null;
  const dayKey = dayKeyFromDate(date) ?? DIET_DAY_ORDER[0];

  const meals = normalizePlannerMeals(record.meals);
  const daysFromWeekly = normalizeDays(
    record.days ??
      record.weeklyPlan ??
      record.weekly_plan ??
      record.schedule ??
      record.mealsByDay,
  );

  const days: DietDayPlan[] =
    daysFromWeekly.length > 0
      ? daysFromWeekly
      : meals.length > 0
        ? [{ day: dayKey, date, meals }]
        : [];

  const dietPlanId =
    readString(
      planRecord.dietPlanId ??
        planRecord.diet_plan_id ??
        record.dietPlanId ??
        record.diet_plan_id ??
        planRecord.id ??
        record.id,
    ) || null;

  if (!dietPlanId && meals.length === 0 && targets.dailyCalories <= 0) {
    return null;
  }

  const mealsPerDay = Math.max(
    1,
    readNumber(
      progress.mealsAssigned ??
        record.mealsPerDay ??
        record.meals_per_day ??
        meals.length,
      meals.length || 3,
    ),
  );

  const durationWeeks = Math.max(
    1,
    readNumber(
      transformation.estimatedWeeks ??
        transformation.estimated_weeks ??
        record.durationWeeks ??
        record.duration_weeks ??
        planRecord.durationWeeks,
      1,
    ),
  );

  const nutrition: DietNutritionSummary = {
    calories: normalizeProgressMacro(progress.calories, targets.dailyCalories),
    protein: normalizeProgressMacro(progress.protein, targets.dailyProtein),
    carbs: normalizeProgressMacro(
      progress.carbs ?? progress.carbohydrates,
      targets.dailyCarbs ?? 0,
    ),
    fats: normalizeProgressMacro(progress.fats ?? progress.fat, targets.dailyFats ?? 0),
  };

  // If progress lacks carbs/fats objects, still show target goals at 0 consumed.
  if (!progress.carbs && !progress.carbohydrates && (targets.dailyCarbs ?? 0) > 0) {
    nutrition.carbs = { current: 0, goal: targets.dailyCarbs ?? 0 };
  }
  if (!progress.fats && !progress.fat && (targets.dailyFats ?? 0) > 0) {
    nutrition.fats = { current: 0, goal: targets.dailyFats ?? 0 };
  }

  const fiberRaw =
    vitals.fiber && typeof vitals.fiber === 'object'
      ? (vitals.fiber as Record<string, unknown>)
      : null;
  if (fiberRaw) {
    nutrition.fiber = {
      current: readNumber(fiberRaw.currentG ?? fiberRaw.current_g ?? fiberRaw.current),
      goal: readNumber(fiberRaw.targetG ?? fiberRaw.target_g ?? fiberRaw.target ?? fiberRaw.goal),
      percent: readNullableNumber(fiberRaw.percent) ?? undefined,
    };
  }

  const { hydration, quickAdds } = normalizePlannerHydration(record.hydration);
  if (hydration) {
    nutrition.water = hydration;
  }

  const coachRaw =
    record.coachInsight && typeof record.coachInsight === 'object'
      ? (record.coachInsight as Record<string, unknown>)
      : null;

  const sodiumRaw =
    vitals.sodium && typeof vitals.sodium === 'object'
      ? (vitals.sodium as Record<string, unknown>)
      : null;
  const caffeineRaw =
    vitals.caffeine && typeof vitals.caffeine === 'object'
      ? (vitals.caffeine as Record<string, unknown>)
      : null;

  const actionsRaw =
    record.actions && typeof record.actions === 'object'
      ? (record.actions as Record<string, unknown>)
      : null;

  const swapRaw =
    record.swapSuggestion && typeof record.swapSuggestion === 'object'
      ? (record.swapSuggestion as Record<string, unknown>)
      : null;

  return {
    date,
    dietPlanId,
    mealPlanId:
      readString(
        planRecord.mealPlanId ??
          planRecord.meal_plan_id ??
          record.mealPlanId ??
          record.meal_plan_id,
      ) || null,
    goal: readString(planRecord.goal ?? record.goal) || null,
    label: readString(planRecord.label ?? record.label) || null,
    phase: readString(planRecord.phase ?? record.phase) || null,
    statusMessage:
      readString(planRecord.statusMessage ?? planRecord.status_message) || null,
    dailyCalories: targets.dailyCalories,
    dailyProtein: targets.dailyProtein,
    dailyCarbs: targets.dailyCarbs ?? undefined,
    dailyFats: targets.dailyFats ?? undefined,
    mealsPerDay,
    durationWeeks,
    version: readNullableNumber(planRecord.version ?? record.version),
    status: readString(planRecord.status ?? record.status) || 'ACTIVE',
    meals,
    days,
    nutrition,
    grocery: normalizeGrocery(
      record.grocery ?? record.groceryList ?? record.grocery_list,
    ),
    hydration,
    hydrationQuickAddsMl: quickAdds,
    coachInsight: coachRaw
      ? {
          status: readString(coachRaw.status) || null,
          message: readString(coachRaw.message) || null,
          actionable: Boolean(coachRaw.actionable),
          suggestedAction:
            readString(coachRaw.suggestedAction ?? coachRaw.suggested_action) ||
            null,
        }
      : null,
    vitals: {
      fiber: nutrition.fiber ?? null,
      sodium: sodiumRaw
        ? {
            status: readString(sodiumRaw.status) || null,
            label: readString(sodiumRaw.label) || null,
            estimated: Boolean(sodiumRaw.estimated),
          }
        : null,
      caffeine: caffeineRaw
        ? {
            status: readString(caffeineRaw.status) || null,
            label: readString(caffeineRaw.label) || null,
            current: readNullableNumber(
              caffeineRaw.currentMg ?? caffeineRaw.current_mg ?? caffeineRaw.current,
            ),
            note: readString(caffeineRaw.note) || null,
            estimated: Boolean(caffeineRaw.estimated),
          }
        : null,
    },
    dietCompliance: readNullableNumber(
      progress.dietCompliance ?? progress.diet_compliance,
    ),
    mealsCompleted: readNullableNumber(progress.mealsCompleted),
    mealsSkipped: readNullableNumber(progress.mealsSkipped),
    transformation: {
      id: readString(transformation.id) || null,
      estimatedWeeks: readNullableNumber(
        transformation.estimatedWeeks ?? transformation.estimated_weeks,
      ),
      targetWeightKg: readNullableNumber(
        transformation.targetWeightKg ?? transformation.target_weight_kg,
      ),
      currentWeightKg: readNullableNumber(
        transformation.currentWeightKg ?? transformation.current_weight_kg,
      ),
    },
    actions: actionsRaw
      ? {
          historyUrl: readString(actionsRaw.historyUrl ?? actionsRaw.history_url) || null,
          editPlanUrl:
            readString(actionsRaw.editPlanUrl ?? actionsRaw.edit_plan_url) || null,
          checkinUrl:
            readString(actionsRaw.checkinUrl ?? actionsRaw.checkin_url) || null,
          logMealUrl:
            readString(actionsRaw.logMealUrl ?? actionsRaw.log_meal_url) || null,
        }
      : null,
    swapSuggestion: swapRaw
      ? {
          message: readString(swapRaw.message) || null,
          mealType: readString(swapRaw.mealType ?? swapRaw.meal_type) || null,
          foodName: readString(swapRaw.foodName ?? swapRaw.food_name) || null,
        }
      : null,
  };
}

export function unwrapDietPlanner(response: unknown): DietPlanner | null {
  if (isFitnessErrorEnvelope(response)) {
    return null;
  }

  const data = unwrapFitnessData<
    DietPlanner | { planner: unknown; data: unknown }
  >(response);

  if (!data) {
    return normalizeDietPlanner(response);
  }

  if (typeof data === 'object' && data !== null && 'planner' in data) {
    return normalizeDietPlanner(data.planner);
  }

  return normalizeDietPlanner(data);
}

export function mergeDietView(
  active: DietPlan | null,
  planner: DietPlanner | null,
): DietPlan | null {
  if (!active && !planner) return null;

  const id = active?.id ?? planner?.dietPlanId;
  if (!id) return null;

  const plannerDays =
    planner?.days?.length
      ? planner.days
      : planner?.meals?.length && planner.date
        ? [
            {
              day: dayKeyFromDate(planner.date) ?? 'monday',
              date: planner.date,
              meals: planner.meals,
            },
          ]
        : [];

  // Prefer active weekly days when planner only has the selected day.
  const days =
    active?.days && active.days.length > 1
      ? active.days.map((day) => {
          if (!planner?.date) return day;
          const plannerDay = dayKeyFromDate(planner.date);
          if (day.day === plannerDay && planner.meals.length > 0) {
            return { ...day, date: planner.date, meals: planner.meals };
          }
          return day;
        })
      : plannerDays.length > 0
        ? plannerDays
        : active?.days ?? [];

  const dailyCalories =
    planner?.dailyCalories || active?.dailyCalories || 0;
  const dailyProtein =
    planner?.dailyProtein || active?.dailyProtein || 0;

  return {
    id,
    goal: planner?.goal ?? active?.goal ?? null,
    dailyCalories,
    dailyProtein,
    dailyCarbs: planner?.dailyCarbs ?? active?.dailyCarbs,
    dailyFats: planner?.dailyFats ?? active?.dailyFats,
    mealsPerDay: planner?.mealsPerDay || active?.mealsPerDay || 3,
    durationWeeks: planner?.durationWeeks || active?.durationWeeks || 1,
    version: planner?.version ?? active?.version ?? null,
    status: planner?.status ?? active?.status ?? 'ACTIVE',
    days,
    nutrition: planner?.nutrition ?? active?.nutrition ?? null,
    grocery: planner?.grocery ?? active?.grocery ?? null,
    label: planner?.label ?? active?.label ?? null,
    phase: planner?.phase ?? active?.phase ?? null,
    statusMessage: planner?.statusMessage ?? active?.statusMessage ?? null,
    createdAt: active?.createdAt,
    updatedAt: active?.updatedAt,
  };
}

export function unwrapDietHistory(response: unknown): DietHistoryResponse {
  const data = unwrapFitnessData<DietHistoryItem[] | DietHistoryResponse>(
    response,
  );

  if (!data) {
    return { items: [] };
  }

  if (Array.isArray(data)) {
    return {
      items: data
        .map((item) => normalizeDietPlan(item))
        .filter((item): item is DietHistoryItem => item !== null),
    };
  }

  if (typeof data === 'object' && 'items' in data) {
    const meta = data.meta as DietHistoryMeta | undefined;
    const rawItems = Array.isArray(data.items) ? (data.items as unknown[]) : [];
    return {
      items: rawItems
        .map((item) => normalizeDietPlan(item))
        .filter((item): item is DietHistoryItem => item !== null),
      meta,
    };
  }

  return { items: [] };
}

export function getDayMeals(plan: DietPlan, day: DietDayKey): DietMeal[] {
  return plan.days.find((entry) => entry.day === day)?.meals ?? [];
}

export function formatGoalLabel(goal?: string | null) {
  if (!goal) return '—';
  return goal.replace(/_/g, ' ');
}
