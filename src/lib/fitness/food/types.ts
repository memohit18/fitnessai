export type FoodPreferenceType = 'favorite' | 'restricted' | 'available';

export type Food = {
  id: string;
  name: string;
  categoryId: string;
  categoryName?: string;
  dietType?: string | null;
  servingSize?: string | null;
  imageUrl?: string | null;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fats?: number | null;
  averageCost?: number | null;
  isCustom?: boolean;
  isVerified?: boolean;
};

export type FoodCategory = {
  id: string;
  name: string;
  label?: string;
  count?: number;
};

export type FoodCategoriesResult = {
  allowedCategories: FoodCategory[];
  categories: FoodCategory[];
  tabs: FoodCategory[];
};

export type FoodsQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  dietType?: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type FoodsListResult = {
  items: Food[];
  meta: PaginationMeta;
};

export type FoodPreferenceItem = {
  id: string;
  userId?: string;
  foodId: string;
  preferenceType: FoodPreferenceType;
  createdAt?: string;
  food?: Food | null;
};

export type FoodPreferences = {
  favoriteFoodIds: string[];
  restrictedFoodIds: string[];
  availableFoodIds: string[];
  favoriteFoods: Food[];
  restrictedFoods: Food[];
  availableFoods: Food[];
  favoriteItems?: FoodPreferenceItem[];
  restrictedItems?: FoodPreferenceItem[];
  availableItems?: FoodPreferenceItem[];
};

export type AddFoodPreferencePayload = {
  foodId: string;
  preferenceType: FoodPreferenceType;
};

export type UpdateFoodPreferencesPayload = {
  favorites: string[];
  available: string[];
  restricted: string[];
};

export type FoodPreferencesFormValues = {
  favoriteFoodIds: string[];
  restrictedFoodIds: string[];
  availableFoodIds: string[];
};

export type FoodPreferencesDraft = {
  values: FoodPreferencesFormValues;
  updatedAt: string;
};

export type CreateFoodPayload = {
  name: string;
  category?: string | null;
  dietType?: string;
  servingSize?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  averageCost?: number;
  imageUrl?: string | null;
};

export type UpdateFoodPayload = Partial<CreateFoodPayload> & {
  category?: string | null;
};

export type FoodFormValues = {
  name: string;
  category: string;
  dietType: string;
  servingSize: string;
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
  averageCost: string;
  imageUrl: string;
};
