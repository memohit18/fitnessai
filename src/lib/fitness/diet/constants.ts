import type { DietDayKey, DietMealType } from './types';

export const DIET_DAY_ORDER: DietDayKey[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export const DIET_DAY_LABELS: Record<DietDayKey, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

export const DIET_DAY_FULL_LABELS: Record<DietDayKey, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

export const DIET_MEAL_ORDER: DietMealType[] = [
  'breakfast',
  'lunch',
  'snack',
  'dinner',
];

export const DIET_MEAL_LABELS: Record<DietMealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snack: 'Snack',
  dinner: 'Dinner',
};

export const DIET_GENERATION_STEPS = [
  'Analyzing nutrition preferences',
  'Matching preferred foods',
  'Balancing macros across the week',
  'Building grocery list',
  'Finalizing your 7-day plan',
] as const;
