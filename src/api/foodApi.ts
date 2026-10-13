import { baseApi } from './baseApi';
import { unwrapFitnessData } from '../lib/fitness/fitnessResponse';
import type { FoodOption } from '../types/fitness';
import { getApiErrorMessage } from '../utils/api';

export async function updateFoodImage(
  foodId: string,
  imageUrl: string,
): Promise<void> {
  try {
    await baseApi.patch(`/foods/${foodId}`, { imageUrl });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to save food image.'));
  }
}

export async function searchFoods(search: string): Promise<FoodOption[]> {
  try {
    const { data } = await baseApi.get<unknown>('/foods', {
      params: { search, limit: 12, page: 1 },
    });
    const payload = unwrapFitnessData<{ items?: unknown[] }>(data);
    const items = Array.isArray(payload?.items) ? payload.items : [];
    return items
      .map(normalizeFood)
      .filter((item): item is FoodOption => item !== null);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to search foods.'));
  }
}

export type FoodNutritionEstimate = {
  name: string;
  servingSize: string;
  servingAmount: number | null;
  servingUnit: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  note: string | null;
};

export async function estimateFoodNutrition(input: {
  name: string;
  servingSize?: string;
}): Promise<FoodNutritionEstimate> {
  try {
    const { data } = await baseApi.post<unknown>('/foods/estimate-nutrition', {
      name: input.name.trim(),
      servingSize: input.servingSize?.trim() || undefined,
    });
    const payload = unwrapFitnessData<Record<string, unknown>>(data) ?? {};
    const number = (value: unknown, fallback = 0) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };
    const str = (value: unknown, fallback = '') =>
      typeof value === 'string' && value.trim() ? value.trim() : fallback;
    const servingAmountRaw = payload.servingAmount ?? payload.serving_amount;
    return {
      name: str(payload.name, input.name.trim()),
      servingSize: str(
        payload.servingSize ?? payload.serving_size,
        input.servingSize?.trim() || '1 serving',
      ),
      servingAmount:
        servingAmountRaw == null || servingAmountRaw === ''
          ? null
          : number(servingAmountRaw),
      servingUnit: str(payload.servingUnit ?? payload.serving_unit) || null,
      calories: Math.round(number(payload.calories)),
      protein: number(payload.protein),
      carbs: number(payload.carbs),
      fats: number(payload.fats),
      note: str(payload.note) || null,
    };
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, 'Unable to estimate nutrition for that food.'),
    );
  }
}

export async function createCustomFood(input: {
  name: string;
  servingSize?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}): Promise<FoodOption> {
  try {
    const { data } = await baseApi.post<unknown>('/foods/custom', {
      name: input.name,
      servingSize: input.servingSize || undefined,
      calories: Math.round(input.calories),
      protein: input.protein,
      carbs: input.carbs,
      fats: input.fats,
    });
    const food = normalizeFood(unwrapFitnessData(data) ?? data);
    if (!food) {
      throw new Error('Unable to save that food.');
    }
    return food;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to save that food.'));
  }
}

function normalizeFood(raw: unknown): FoodOption | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const id = typeof record.id === 'string' ? record.id : '';
  const name = typeof record.name === 'string' ? record.name.trim() : '';
  if (!id || !name) return null;
  const number = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const serving =
    typeof record.servingSize === 'string' && record.servingSize.trim()
      ? record.servingSize.trim()
      : null;
  const servingAmountRaw = Number(record.servingAmount ?? record.serving_amount);
  const servingUnit =
    typeof record.servingUnit === 'string' && record.servingUnit.trim()
      ? record.servingUnit.trim()
      : typeof record.serving_unit === 'string' && record.serving_unit.trim()
        ? record.serving_unit.trim()
        : null;

  return {
    id,
    name,
    calories: number(record.calories),
    protein: number(record.protein),
    carbs: number(record.carbs),
    fats: number(record.fats),
    servingSize: serving,
    servingAmount: Number.isFinite(servingAmountRaw) ? servingAmountRaw : null,
    servingUnit,
  };
}
