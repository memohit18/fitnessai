import type { FoodPreferencesFormValues } from './types';

export type FoodPreferenceAction = 'favorite' | 'restricted' | 'available';

function toggleId(ids: string[], foodId: string, enabled: boolean) {
  if (enabled) {
    return ids.includes(foodId) ? ids : [...ids, foodId];
  }
  return ids.filter((id) => id !== foodId);
}

export function applyFoodPreferenceToggle(
  values: FoodPreferencesFormValues,
  foodId: string,
  action: FoodPreferenceAction,
): FoodPreferencesFormValues {
  const isFavorite = values.favoriteFoodIds.includes(foodId);
  const isRestricted = values.restrictedFoodIds.includes(foodId);
  const isAvailable = values.availableFoodIds.includes(foodId);

  if (action === 'favorite') {
    const nextFavorite = !isFavorite;
    return {
      ...values,
      favoriteFoodIds: toggleId(values.favoriteFoodIds, foodId, nextFavorite),
      restrictedFoodIds: nextFavorite
        ? values.restrictedFoodIds.filter((id) => id !== foodId)
        : values.restrictedFoodIds,
      availableFoodIds: nextFavorite
        ? toggleId(values.availableFoodIds, foodId, true)
        : values.availableFoodIds,
    };
  }

  if (action === 'restricted') {
    const nextRestricted = !isRestricted;
    return {
      ...values,
      restrictedFoodIds: toggleId(values.restrictedFoodIds, foodId, nextRestricted),
      favoriteFoodIds: nextRestricted
        ? values.favoriteFoodIds.filter((id) => id !== foodId)
        : values.favoriteFoodIds,
      availableFoodIds: nextRestricted
        ? values.availableFoodIds.filter((id) => id !== foodId)
        : values.availableFoodIds,
    };
  }

  const nextAvailable = !isAvailable;
  return {
    ...values,
    availableFoodIds: toggleId(values.availableFoodIds, foodId, nextAvailable),
    favoriteFoodIds: nextAvailable
      ? values.favoriteFoodIds
      : values.favoriteFoodIds.filter((id) => id !== foodId),
    restrictedFoodIds: nextAvailable
      ? values.restrictedFoodIds
      : values.restrictedFoodIds.filter((id) => id !== foodId),
  };
}
