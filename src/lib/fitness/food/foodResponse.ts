import { unwrapFitnessData } from '../fitnessResponse';
import type {
  Food,
  FoodCategory,
  FoodCategoriesResult,
  FoodPreferenceItem,
  FoodPreferenceType,
  FoodPreferences,
  FoodPreferencesFormValues,
  FoodsListResult,
  PaginationMeta,
  UpdateFoodPreferencesPayload,
} from './types';

function readString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function readNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
}

const DEFAULT_PAGINATION_META: PaginationMeta = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
};

function normalizePaginationMeta(raw: unknown): PaginationMeta {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_PAGINATION_META;
  }

  const record = raw as Record<string, unknown>;

  return {
    page: Number(record.page) || 1,
    limit: Number(record.limit) || 20,
    total: Number(record.total) || 0,
    totalPages: Number(record.totalPages ?? record.total_pages) || 0,
  };
}

export function normalizeFood(raw: unknown): Food | null {
  if (!raw || typeof raw !== 'object') return null;

  const record = raw as Record<string, unknown>;
  const id = readString(record.id ?? record._id);

  if (!id) return null;

  const category = readString(
    record.categoryId ?? record.category_id ?? record.category,
  );

  const name = readString(record.name ?? record.title);
  if (!name) return null;

  return {
    id,
    name,
    categoryId: category || 'uncategorized',
    categoryName: readString(record.categoryName ?? record.category_name ?? record.category) || undefined,
    dietType: readString(record.dietType ?? record.diet_type) || null,
    servingSize: readString(record.servingSize ?? record.serving_size) || null,
    imageUrl: readString(record.imageUrl ?? record.image_url) || null,
    calories: readNullableNumber(record.calories),
    protein: readNullableNumber(record.protein),
    carbs: readNullableNumber(record.carbs),
    fats: readNullableNumber(record.fats),
    averageCost: readNullableNumber(record.averageCost ?? record.average_cost),
    isCustom: Boolean(record.isCustom ?? record.is_custom),
    isVerified: Boolean(record.isVerified ?? record.is_verified ?? true),
  };
}

function normalizeFoodList(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => normalizeFood(item))
    .filter((item): item is Food => item !== null);
}

function normalizePreferenceType(value: unknown): FoodPreferenceType {
  const type = readString(value, 'favorite');
  if (type === 'favorite' || type === 'restricted' || type === 'available') {
    return type;
  }
  return 'favorite';
}

function normalizePreferenceItem(raw: unknown): FoodPreferenceItem | null {
  if (!raw || typeof raw !== 'object') return null;

  const record = raw as Record<string, unknown>;
  const id = readString(record.id);
  const foodId =
    readString(record.foodId ?? record.food_id) ||
    readString((record.food as { id?: string } | undefined)?.id);

  if (!id || !foodId) return null;

  return {
    id,
    userId: readString(record.userId ?? record.user_id) || undefined,
    foodId,
    preferenceType: normalizePreferenceType(
      record.preferenceType ?? record.preference_type,
    ),
    createdAt: readString(record.createdAt ?? record.created_at) || undefined,
    food: normalizeFood(record.food),
  };
}

function normalizePreferenceItems(raw: unknown) {
  if (!Array.isArray(raw)) return [] as FoodPreferenceItem[];
  return raw
    .map((item) => normalizePreferenceItem(item))
    .filter((item): item is FoodPreferenceItem => item !== null);
}

function extractFoodIdsFromPreferenceItems(items: FoodPreferenceItem[]) {
  return items.map((item) => item.foodId).filter(Boolean);
}

function extractFoodsFromPreferenceItems(items: FoodPreferenceItem[]) {
  const foods: Food[] = [];

  for (const item of items) {
    if (item.food) {
      foods.push(item.food);
    }
  }

  return foods;
}

function extractFoodIds(ids: unknown, items: FoodPreferenceItem[]) {
  const fromIds = readStringArray(ids);
  if (fromIds.length > 0) return fromIds;
  return extractFoodIdsFromPreferenceItems(items);
}

export function normalizeFoodPreferences(raw: unknown): FoodPreferences | null {
  if (!raw || typeof raw !== 'object') return null;

  const record = raw as Record<string, unknown>;

  const favoriteItems = normalizePreferenceItems(record.favorites);
  const restrictedItems = normalizePreferenceItems(record.restricted);
  const availableItems = normalizePreferenceItems(record.available);

  const favoriteFoodIds = extractFoodIds(record.favoriteFoodIds ?? record.favorite_food_ids, favoriteItems);
  const restrictedFoodIds = extractFoodIds(record.restrictedFoodIds ?? record.restricted_food_ids, restrictedItems);
  const availableFoodIds = extractFoodIds(record.availableFoodIds ?? record.available_food_ids, availableItems);

  const hasData =
    favoriteItems.length > 0 ||
    restrictedItems.length > 0 ||
    availableItems.length > 0 ||
    'favorites' in record ||
    'available' in record ||
    'restricted' in record;

  if (!hasData) return null;

  return {
    favoriteFoodIds,
    restrictedFoodIds,
    availableFoodIds,
    favoriteFoods: extractFoodsFromPreferenceItems(favoriteItems),
    restrictedFoods: extractFoodsFromPreferenceItems(restrictedItems),
    availableFoods: extractFoodsFromPreferenceItems(availableItems),
    favoriteItems,
    restrictedItems,
    availableItems,
  };
}

export function unwrapFoodsList(response: unknown): FoodsListResult {
  const data = unwrapFitnessData<
    FoodsListResult | { items: Food[]; meta?: PaginationMeta } | Food[]
  >(response);

  if (!data) {
    const items = normalizeFoodList(response);
    return {
      items,
      meta: {
        ...DEFAULT_PAGINATION_META,
        total: items.length,
        totalPages: items.length > 0 ? 1 : 0,
      },
    };
  }

  if (Array.isArray(data)) {
    return {
      items: normalizeFoodList(data),
      meta: {
        ...DEFAULT_PAGINATION_META,
        total: data.length,
        totalPages: data.length > 0 ? 1 : 0,
      },
    };
  }

  if (typeof data === 'object' && 'items' in data) {
    const record = data as { items?: unknown[]; meta?: unknown };
    const items = normalizeFoodList(record.items);

    return {
      items,
      meta: normalizePaginationMeta(record.meta),
    };
  }

  return { items: [], meta: DEFAULT_PAGINATION_META };
}

export function unwrapFoods(response: unknown): Food[] {
  return unwrapFoodsList(response).items;
}

export function unwrapFoodCategories(response: unknown): FoodCategoriesResult {
  const data = unwrapFitnessData<
    | FoodCategoriesResult
    | {
        allowedCategories?: unknown[];
        categories?: unknown[];
        items?: unknown[];
      }
    | FoodCategory[]
  >(response);

  if (!data) {
    return { allowedCategories: [], categories: [], tabs: [] };
  }

  if (Array.isArray(data)) {
    const categories = normalizeCategoryList(data);
    return {
      allowedCategories: categories,
      categories,
      tabs: categories,
    };
  }

  if (typeof data === 'object' && 'tabs' in data && Array.isArray(data.tabs)) {
    return data as FoodCategoriesResult;
  }

  const record = data as {
    allowedCategories?: unknown[];
    categories?: unknown[];
    items?: unknown[];
  };

  const allowedCategories = normalizeCategoryList(
    record.allowedCategories ?? record.items,
  );
  const categoriesWithCounts = normalizeCategoryList(record.categories);

  if (allowedCategories.length === 0 && categoriesWithCounts.length > 0) {
    return {
      allowedCategories: categoriesWithCounts,
      categories: categoriesWithCounts,
      tabs: categoriesWithCounts,
    };
  }

  const countById = new Map(
    categoriesWithCounts.map((category) => [category.id, category.count]),
  );

  const tabs = allowedCategories.map((category) => ({
    ...category,
    count: countById.get(category.id) ?? category.count,
  }));

  return {
    allowedCategories,
    categories: categoriesWithCounts,
    tabs,
  };
}

function normalizeCategoryList(raw: unknown) {
  if (!Array.isArray(raw)) return [] as FoodCategory[];

  const categories: FoodCategory[] = [];

  for (const item of raw) {
    const category = normalizeCategoryItem(item);
    if (category) categories.push(category);
  }

  return categories;
}

function normalizeCategoryItem(raw: unknown): FoodCategory | null {
  if (!raw || typeof raw !== 'object') {
    if (typeof raw === 'string' && raw.trim()) {
      const id = raw.trim();
      return {
        id,
        name: formatCategoryLabel(id),
        label: formatCategoryLabel(id),
      };
    }
    return null;
  }

  const record = raw as Record<string, unknown>;
  const id = readString(record.id ?? record._id ?? record.slug ?? record.name);

  if (!id) return null;

  const label = readString(record.label ?? record.name ?? record.title, id);

  return {
    id,
    name: label,
    label,
    count:
      typeof record.count === 'number' && Number.isFinite(record.count)
        ? record.count
        : undefined,
  };
}

function formatCategoryLabel(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function unwrapFoodPreferences(response: unknown): FoodPreferences | null {
  const data = unwrapFitnessData<
    FoodPreferences | { preferences: FoodPreferences } | null
  >(response);

  if (data === null) return null;

  if (data && typeof data === 'object' && 'preferences' in data) {
    return normalizeFoodPreferences(data.preferences);
  }

  return normalizeFoodPreferences(data ?? response);
}

export function toFoodPreferencesPatchPayload(
  values: FoodPreferencesFormValues,
): UpdateFoodPreferencesPayload {
  return {
    favorites: values.favoriteFoodIds,
    available: values.availableFoodIds,
    restricted: values.restrictedFoodIds,
  };
}
