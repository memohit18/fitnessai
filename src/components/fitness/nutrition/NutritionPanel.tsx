import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import {
  getFoodPreferences,
  listFoodCategories,
  listFoods,
  saveFoodPreferences,
} from '../../../api/foodPreferencesApi';
import {
  getNutritionPreferences,
  saveNutritionPreferences,
} from '../../../api/nutritionPreferencesApi';
import type { FitnessPalette } from '../../../constants/fitnessPalette';
import { useFitnessPalette, useFitnessStyles } from '../../../hooks/useFitnessPalette';
import { FOOD_PREFERENCE_MIN_FAVORITES } from '../../../lib/fitness/food/constants';
import {
  applyFoodPreferenceToggle,
  type FoodPreferenceAction,
} from '../../../lib/fitness/food/foodPreferenceActions';
import type {
  Food,
  FoodPreferencesFormValues,
} from '../../../lib/fitness/food/types';
import {
  mapNutritionPreferencesToFormValues,
} from '../../../lib/fitness/nutrition/nutritionPreferencesResponse';
import {
  BUDGET_OPTIONS,
  CUISINE_OPTIONS,
  DEFAULT_NUTRITION_PREFERENCES,
  MEALS_PER_DAY_OPTIONS,
  MEAL_TIMING_OPTIONS,
  type MealTimingPreference,
  type MealsPerDay,
  type NutritionPreferencesFormValues,
  type PreferredCuisine,
} from '../../../types/nutrition-preferences';
import { getApiErrorMessage } from '../../../utils/api';

const EMPTY_FOOD: FoodPreferencesFormValues = {
  favoriteFoodIds: [],
  restrictedFoodIds: [],
  availableFoodIds: [],
};

export function NutritionPanel() {
  const p = useFitnessPalette();
  const styles = useFitnessStyles(buildStyles);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [foodsLoading, setFoodsLoading] = useState(false);
  const [foodValues, setFoodValues] =
    useState<FoodPreferencesFormValues>(EMPTY_FOOD);
  const [nutritionValues, setNutritionValues] =
    useState<NutritionPreferencesFormValues>(DEFAULT_NUTRITION_PREFERENCES);
  const [hasExistingNutrition, setHasExistingNutrition] = useState(false);

  const loadPreferences = useCallback(async () => {
    const [foodPrefs, nutritionPrefs, cats] = await Promise.all([
      getFoodPreferences(),
      getNutritionPreferences(),
      listFoodCategories().catch(() => []),
    ]);
    setCategories([{ id: 'all', name: 'All' }, ...cats]);
    if (foodPrefs) {
      setFoodValues({
        favoriteFoodIds: foodPrefs.favoriteFoodIds ?? [],
        restrictedFoodIds: foodPrefs.restrictedFoodIds ?? [],
        availableFoodIds: foodPrefs.availableFoodIds ?? [],
      });
    }
    if (nutritionPrefs) {
      setHasExistingNutrition(true);
      setNutritionValues({
        ...DEFAULT_NUTRITION_PREFERENCES,
        ...mapNutritionPreferencesToFormValues(nutritionPrefs),
      });
    } else {
      setHasExistingNutrition(false);
      setNutritionValues(DEFAULT_NUTRITION_PREFERENCES);
    }
  }, []);

  const loadFoods = useCallback(
    async (nextPage = 1, query = search, cat = categoryId) => {
      setFoodsLoading(true);
      try {
        const result = await listFoods({
          page: nextPage,
          limit: 24,
          search: query,
          categoryId: cat && cat !== 'all' ? cat : null,
        });
        setFoods(result.items);
        setPage(result.meta?.page ?? nextPage);
        setTotalPages(result.meta?.totalPages ?? 1);
      } catch (err) {
        Toast.show({
          type: 'error',
          text1: 'Foods failed',
          text2: getApiErrorMessage(err, 'Unable to load foods.'),
          position: 'bottom',
        });
      } finally {
        setFoodsLoading(false);
      }
    },
    [categoryId, search],
  );

  const load = useCallback(
    async (mode: 'full' | 'soft' = 'full') => {
      if (mode === 'full') {
        setStatus('loading');
        setError(null);
      } else {
        setRefreshing(true);
      }
      try {
        await loadPreferences();
        await loadFoods(1);
        setStatus('ready');
      } catch (err) {
        setError(getApiErrorMessage(err, 'Unable to load nutrition.'));
        if (mode === 'full') setStatus('error');
      } finally {
        setRefreshing(false);
      }
    },
    [loadFoods, loadPreferences],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadFoods(1, search, categoryId);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, categoryId]); // eslint-disable-line react-hooks/exhaustive-deps

  const onToggle = (foodId: string, action: FoodPreferenceAction) => {
    setFoodValues((prev) => applyFoodPreferenceToggle(prev, foodId, action));
  };

  const onSave = async () => {
    if (foodValues.favoriteFoodIds.length < FOOD_PREFERENCE_MIN_FAVORITES) {
      Toast.show({
        type: 'error',
        text1: 'More favorites needed',
        text2: `Select at least ${FOOD_PREFERENCE_MIN_FAVORITES} favorite foods.`,
        position: 'bottom',
      });
      return;
    }
    if (
      !nutritionValues.budgetCategory ||
      !nutritionValues.preferredCuisine ||
      !nutritionValues.mealsPerDay ||
      !nutritionValues.cookingTimeMinutes ||
      !nutritionValues.preferredMealTiming
    ) {
      Toast.show({
        type: 'error',
        text1: 'Incomplete preferences',
        text2: 'Fill every nutrition preference before saving.',
        position: 'bottom',
      });
      return;
    }

    setSaving(true);
    try {
      await Promise.all([
        saveFoodPreferences(foodValues),
        saveNutritionPreferences(nutritionValues, hasExistingNutrition),
      ]);
      setHasExistingNutrition(true);
      Toast.show({
        type: 'success',
        text1: 'Nutrition saved',
        text2: 'Food and meal preferences updated.',
        position: 'bottom',
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Save failed',
        text2: getApiErrorMessage(err, 'Unable to save preferences.'),
        position: 'bottom',
      });
    } finally {
      setSaving(false);
    }
  };

  const favoriteCount = foodValues.favoriteFoodIds.length;

  const cookingLabel = useMemo(() => {
    const mins = nutritionValues.cookingTimeMinutes ?? 30;
    return `${mins} min`;
  }, [nutritionValues.cookingTimeMinutes]);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={p.lime}
          onRefresh={() => void load('soft')}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Nutrition</Text>
        <Text style={styles.title}>Nutrition preferences</Text>
        <Text style={styles.muted}>
          Tag foods you love or avoid, then set meal structure to match desktop.
        </Text>
      </View>

      {status === 'error' ? (
        <View style={styles.card}>
          <Text style={styles.foodName}>Couldn’t load nutrition</Text>
          <Text style={styles.muted}>{error}</Text>
          <Pressable onPress={() => void load()} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {status === 'loading' ? (
        <View style={[styles.card, styles.centered]}>
          <ActivityIndicator color={p.lime} />
          <Text style={styles.muted}>Loading preferences…</Text>
        </View>
      ) : null}

      {status === 'ready' ? (
        <>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionEyebrow}>Section 1</Text>
              <Text style={styles.sectionTitle}>Food preferences</Text>
              <Text style={styles.muted}>
                Mark favorites (min {FOOD_PREFERENCE_MIN_FAVORITES}),
                restrictions, and foods you’re willing to eat.
              </Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statPill}>
                <Text style={styles.statValue}>{favoriteCount}</Text>
                <Text style={styles.statLabel}>Favorites</Text>
              </View>
              <View style={styles.statPill}>
                <Text style={styles.statValue}>
                  {foodValues.restrictedFoodIds.length}
                </Text>
                <Text style={styles.statLabel}>Restricted</Text>
              </View>
              <View style={styles.statPill}>
                <Text style={styles.statValue}>
                  {foodValues.availableFoodIds.length}
                </Text>
                <Text style={styles.statLabel}>Available</Text>
              </View>
            </View>

            <View style={styles.searchRow}>
              <Ionicons color={p.textMuted} name="search" size={16} />
              <TextInput
                placeholder="Search foods"
                placeholderTextColor={p.textMuted}
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
              />
              {search ? (
                <Pressable onPress={() => setSearch('')}>
                  <Ionicons color={p.textMuted} name="close-circle" size={18} />
                </Pressable>
              ) : null}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {categories.map((cat) => {
                const active =
                  (cat.id === 'all' && !categoryId) || categoryId === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() =>
                      setCategoryId(cat.id === 'all' ? null : cat.id)
                    }
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.foodList}>
              {foodsLoading ? (
                <View style={[styles.centered, { paddingVertical: 24 }]}>
                  <ActivityIndicator color={p.lime} />
                </View>
              ) : foods.length === 0 ? (
                <Text style={[styles.muted, { paddingVertical: 16 }]}>
                  No foods found. Try another search.
                </Text>
              ) : (
                foods.map((food) => (
                  <FoodPreferenceRow
                    key={food.id}
                    food={food}
                    isFavorite={foodValues.favoriteFoodIds.includes(food.id)}
                    isRestricted={foodValues.restrictedFoodIds.includes(food.id)}
                    isAvailable={foodValues.availableFoodIds.includes(food.id)}
                    onToggle={(action) => onToggle(food.id, action)}
                  />
                ))
              )}
            </View>

            {totalPages > 1 ? (
              <View style={styles.pagerRow}>
                <Pressable
                  disabled={page <= 1 || foodsLoading}
                  onPress={() => void loadFoods(page - 1)}
                  style={[
                    styles.secondaryBtn,
                    (page <= 1 || foodsLoading) && styles.btnDisabled,
                  ]}
                >
                  <Text style={styles.secondaryBtnText}>Previous</Text>
                </Pressable>
                <Text style={styles.muted}>
                  Page {page} of {totalPages}
                </Text>
                <Pressable
                  disabled={page >= totalPages || foodsLoading}
                  onPress={() => void loadFoods(page + 1)}
                  style={[
                    styles.secondaryBtn,
                    (page >= totalPages || foodsLoading) && styles.btnDisabled,
                  ]}
                >
                  <Text style={styles.secondaryBtnText}>Next</Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionEyebrow}>Section 2</Text>
              <Text style={styles.sectionTitle}>Meal structure</Text>
              <Text style={styles.muted}>
                Budget, cuisine, meals per day, timing, and cooking time.
              </Text>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Budget</Text>
              <View style={styles.wrapChips}>
                {BUDGET_OPTIONS.map((option) => {
                  const active = nutritionValues.budgetCategory === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() =>
                        setNutritionValues((prev) => ({
                          ...prev,
                          budgetCategory: option.value,
                        }))
                      }
                      style={[styles.optionChip, active && styles.chipActive]}
                    >
                      <Text
                        style={[styles.chipText, active && styles.chipTextActive]}
                      >
                        {option.label}
                      </Text>
                      <Text
                        style={[
                          styles.optionHint,
                          active && styles.optionHintActive,
                        ]}
                      >
                        {option.hint}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Cuisine</Text>
              <View style={styles.wrapChips}>
                {CUISINE_OPTIONS.map((option) => {
                  const active =
                    nutritionValues.preferredCuisine === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() =>
                        setNutritionValues((prev) => ({
                          ...prev,
                          preferredCuisine: option.value as PreferredCuisine,
                        }))
                      }
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text
                        style={[styles.chipText, active && styles.chipTextActive]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Meals per day</Text>
              <View style={styles.segmentRow}>
                {MEALS_PER_DAY_OPTIONS.map((value) => {
                  const active = nutritionValues.mealsPerDay === value;
                  return (
                    <Pressable
                      key={value}
                      onPress={() =>
                        setNutritionValues((prev) => ({
                          ...prev,
                          mealsPerDay: value as MealsPerDay,
                        }))
                      }
                      style={[styles.segment, active && styles.chipActive]}
                    >
                      <Text
                        style={[styles.chipText, active && styles.chipTextActive]}
                      >
                        {value}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Meal timing</Text>
              <View style={styles.wrapChips}>
                {MEAL_TIMING_OPTIONS.map((option) => {
                  const active =
                    nutritionValues.preferredMealTiming === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() =>
                        setNutritionValues((prev) => ({
                          ...prev,
                          preferredMealTiming:
                            option.value as MealTimingPreference,
                        }))
                      }
                      style={[styles.optionChip, active && styles.chipActive]}
                    >
                      <Text
                        style={[styles.chipText, active && styles.chipTextActive]}
                      >
                        {option.label}
                      </Text>
                      <Text
                        style={[
                          styles.optionHint,
                          active && styles.optionHintActive,
                        ]}
                      >
                        {option.hint}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>
                Cooking time · {cookingLabel}
              </Text>
              <View style={styles.segmentRow}>
                {[15, 30, 45, 60, 90, 120].map((mins) => {
                  const active = nutritionValues.cookingTimeMinutes === mins;
                  return (
                    <Pressable
                      key={mins}
                      onPress={() =>
                        setNutritionValues((prev) => ({
                          ...prev,
                          cookingTimeMinutes: mins,
                        }))
                      }
                      style={[styles.segment, active && styles.chipActive]}
                    >
                      <Text
                        style={[styles.chipText, active && styles.chipTextActive]}
                      >
                        {mins}m
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          <Pressable
            disabled={saving}
            onPress={() => void onSave()}
            style={[styles.primaryBtn, saving && styles.btnDisabled]}
          >
            {saving ? (
              <ActivityIndicator color={p.onLime} />
            ) : (
              <>
                <Ionicons color={p.onLime} name="save-outline" size={18} />
                <Text style={styles.primaryBtnText}>Save preferences</Text>
              </>
            )}
          </Pressable>
        </>
      ) : null}
    </ScrollView>
  );
}

function FoodPreferenceRow({
  food,
  isFavorite,
  isRestricted,
  isAvailable,
  onToggle,
}: {
  food: Food;
  isFavorite: boolean;
  isRestricted: boolean;
  isAvailable: boolean;
  onToggle: (action: FoodPreferenceAction) => void;
}) {
  const p = useFitnessPalette();
  const styles = useFitnessStyles(buildStyles);
  return (
    <View style={styles.foodRow}>
      <View style={styles.foodCopy}>
        <Text style={styles.foodName} numberOfLines={1}>
          {food.name}
        </Text>
        <Text style={styles.foodMeta} numberOfLines={1}>
          {food.calories != null ? `${Math.round(food.calories)} kcal` : '—'}
          {food.protein != null ? ` · P ${food.protein}g` : ''}
          {food.categoryName ? ` · ${food.categoryName}` : ''}
        </Text>
      </View>
      <View style={styles.foodActions}>
        <Pressable
          onPress={() => onToggle('favorite')}
          style={[styles.iconChip, isFavorite && styles.iconChipActive]}
        >
          <Ionicons
            color={isFavorite ? p.onLime : p.lime}
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={15}
          />
        </Pressable>
        <Pressable
          onPress={() => onToggle('restricted')}
          style={[styles.iconChip, isRestricted && styles.iconChipDanger]}
        >
          <Ionicons
            color={isRestricted ? '#fff' : p.burn}
            name="ban-outline"
            size={15}
          />
        </Pressable>
        <Pressable
          onPress={() => onToggle('available')}
          style={[styles.iconChip, isAvailable && styles.iconChipActive]}
        >
          <Ionicons
            color={isAvailable ? p.onLime : p.textSecondary}
            name={isAvailable ? 'checkmark-circle' : 'checkmark-circle-outline'}
            size={15}
          />
        </Pressable>
      </View>
    </View>
  );
}

function buildStyles(p: FitnessPalette) {
  return StyleSheet.create({
    content: {
      gap: 18,
      paddingHorizontal: 18,
      paddingTop: 8,
      paddingBottom: 120,
    },
    header: { gap: 6 },
    eyebrow: {
      color: p.lime,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    title: { color: p.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.3 },
    muted: { color: p.textSecondary, fontSize: 13, lineHeight: 19 },
    card: {
      backgroundColor: p.surface,
      borderColor: p.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 16,
      padding: 18,
    },
    cardHeader: { gap: 6 },
    centered: { alignItems: 'center', gap: 10, justifyContent: 'center' },
    sectionEyebrow: {
      color: p.lime,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    sectionTitle: { color: p.text, fontSize: 18, fontWeight: '800' },
    statsRow: { flexDirection: 'row', gap: 8 },
    statPill: {
      backgroundColor: p.surfaceElevated,
      borderColor: p.border,
      borderRadius: 14,
      borderWidth: 1,
      flex: 1,
      gap: 2,
      paddingHorizontal: 10,
      paddingVertical: 12,
    },
    statValue: { color: p.lime, fontSize: 18, fontWeight: '800' },
    statLabel: {
      color: p.textMuted,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    searchRow: {
      alignItems: 'center',
      backgroundColor: p.surfaceElevated,
      borderColor: p.border,
      borderRadius: 14,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      minHeight: 46,
      paddingHorizontal: 14,
    },
    searchInput: {
      color: p.text,
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      paddingVertical: 10,
    },
    chipRow: { gap: 8, paddingVertical: 2 },
    wrapChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      backgroundColor: p.surfaceElevated,
      borderColor: p.border,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 9,
    },
    optionChip: {
      backgroundColor: p.surfaceElevated,
      borderColor: p.border,
      borderRadius: 14,
      borderWidth: 1,
      gap: 2,
      minWidth: '46%',
      flexGrow: 1,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    chipActive: { backgroundColor: p.lime, borderColor: p.lime },
    chipText: { color: p.textSecondary, fontSize: 13, fontWeight: '700' },
    chipTextActive: { color: p.onLime },
    optionHint: { color: p.textMuted, fontSize: 11, fontWeight: '500' },
    optionHintActive: { color: p.onLime, opacity: 0.75 },
    fieldBlock: { gap: 10 },
    fieldLabel: {
      color: p.textMuted,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    segmentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    segment: {
      alignItems: 'center',
      backgroundColor: p.surfaceElevated,
      borderColor: p.border,
      borderRadius: 12,
      borderWidth: 1,
      justifyContent: 'center',
      minWidth: 52,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    foodList: { gap: 8 },
    foodRow: {
      alignItems: 'center',
      backgroundColor: p.surfaceElevated,
      borderColor: p.border,
      borderRadius: 14,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    foodCopy: { flex: 1, gap: 3 },
    foodName: { color: p.text, fontSize: 15, fontWeight: '800' },
    foodMeta: { color: p.textMuted, fontSize: 12, fontWeight: '600' },
    foodActions: { flexDirection: 'row', gap: 6 },
    iconChip: {
      alignItems: 'center',
      backgroundColor: p.surface,
      borderColor: p.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    iconChipActive: { backgroundColor: p.lime, borderColor: p.lime },
    iconChipDanger: { backgroundColor: p.burn, borderColor: p.burn },
    pagerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 4,
    },
    secondaryBtn: {
      backgroundColor: p.limeDim,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    secondaryBtnText: { color: p.lime, fontSize: 12, fontWeight: '800' },
    primaryBtn: {
      alignItems: 'center',
      backgroundColor: p.lime,
      borderRadius: 16,
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'center',
      minHeight: 52,
    },
    primaryBtnText: { color: p.onLime, fontSize: 15, fontWeight: '800' },
    btnDisabled: { opacity: 0.55 },
  });
}
