import type { MealItem, MealServingUnit } from '../../types/fitness';

export type MealMacros = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export function scaleMealMacros(base: MealMacros, amount: number): MealMacros {
  const quantity = Number.isFinite(amount) && amount > 0 ? amount : 0;
  return {
    calories: Math.round(base.calories * quantity),
    protein: Math.round(base.protein * quantity * 10) / 10,
    carbs: Math.round(base.carbs * quantity * 10) / 10,
    fats: Math.round(base.fats * quantity * 10) / 10,
  };
}

export function formatAmount(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export function formatMacro(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function formatUnitLabel(amount: number, unit: MealServingUnit) {
  const rounded = Math.round(amount * 10) / 10;
  const value = Number.isInteger(rounded) ? String(rounded) : String(rounded);
  if (unit === 'piece') {
    return `${value} ${rounded === 1 ? 'piece' : 'pieces'}`;
  }
  if (unit === 'serving') {
    return `${value} ${rounded === 1 ? 'serving' : 'servings'}`;
  }
  if (unit === 'tbsp') return `${value} tbsp`;
  return `${value} ${unit}`;
}

/**
 * Prefer API amountLabel; otherwise build from servingAmount/unit × quantity.
 * `portion` scales the planned quantity (e.g. half = 0.5).
 */
export function formatMealAmount(
  meal: Pick<
    MealItem,
    | 'quantity'
    | 'servingAmount'
    | 'servingUnit'
    | 'servingSize'
    | 'amount'
    | 'amountLabel'
    | 'consumedAmountLabel'
  >,
  portion = 1,
): string {
  const scale =
    Number.isFinite(portion) && portion > 0
      ? Math.round(portion * 100) / 100
      : 1;

  if (scale === 1 && meal.amountLabel?.trim()) {
    return meal.amountLabel.trim();
  }

  if (
    meal.servingAmount != null &&
    meal.servingAmount > 0 &&
    meal.servingUnit
  ) {
    const qty = (meal.quantity ?? 1) * scale;
    return formatUnitLabel(meal.servingAmount * qty, meal.servingUnit);
  }

  if (scale === 1 && meal.amount != null && meal.servingUnit) {
    return formatUnitLabel(meal.amount, meal.servingUnit);
  }

  // Legacy free-text servingSize fallback
  const qty = (meal.quantity ?? 1) * scale;
  const serving = meal.servingSize?.trim() || '';
  if (serving) {
    const grams = serving.match(/(\d+(?:\.\d+)?)\s*(g|grams?)\b/i);
    if (grams) {
      return `${Math.round(Number(grams[1]) * qty)} g`;
    }
    const ml = serving.match(/(\d+(?:\.\d+)?)\s*(ml)\b/i);
    if (ml) {
      return `${Math.round(Number(ml[1]) * qty)} ml`;
    }
    return qty === 1 ? serving : `${formatAmount(qty)} × ${serving}`;
  }

  return qty === 1 ? '1 serving' : `${formatAmount(qty)} servings`;
}

/** Label shown on a meal card (uses consumed amount when already logged). */
export function mealAmountDisplay(meal: MealItem, portion = 1): string {
  if (isMealEaten(meal.status) && meal.consumedAmountLabel?.trim()) {
    return meal.consumedAmountLabel.trim();
  }
  return formatMealAmount(meal, portion);
}

export function isMealEaten(status: string) {
  const normalized = status.toLowerCase();
  return (
    normalized === 'completed' ||
    normalized === 'partial' ||
    normalized === 'replaced'
  );
}
