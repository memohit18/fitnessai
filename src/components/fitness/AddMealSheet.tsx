import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  createCustomFood,
  estimateFoodNutrition,
  searchFoods,
  type FoodNutritionEstimate,
} from '../../api/foodApi';
import { addEatenMeal, skipMeal } from '../../api/mealApi';
import type { FitnessPalette } from '../../constants/fitnessPalette';
import { useFitnessPalette, useFitnessStyles } from '../../hooks/useFitnessPalette';
import {
  formatAmount,
  formatMacro,
  formatMealAmount,
  scaleMealMacros,
} from '../../lib/fitness/mealMath';
import type { FoodOption, MealType } from '../../types/fitness';

function foodPortionLabel(food: FoodOption | null, quantity: number) {
  if (!food) {
    return `${formatAmount(quantity)} × serving`;
  }
  return formatMealAmount({
    quantity,
    servingAmount: food.servingAmount,
    servingUnit: food.servingUnit,
    servingSize: food.servingSize,
    amount: null,
    amountLabel: null,
  });
}

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

type AddMealSheetProps = {
  visible: boolean;
  mealPlanId: string | null;
  dayNumber: number | null;
  /** Prefill meal type when opened from a planned meal card. */
  initialMealType?: MealType | string | null;
  /** If set, skip this planned meal after logging what you actually ate. */
  skipMealId?: string | null;
  onClose: () => void;
  onAdded: () => Promise<void> | void;
};

function asMealType(value: string | null | undefined): MealType {
  if (value === 'breakfast' || value === 'lunch' || value === 'snack' || value === 'dinner') {
    return value;
  }
  return 'snack';
}

export function AddMealSheet({
  visible,
  mealPlanId,
  dayNumber,
  initialMealType,
  skipMealId,
  onClose,
  onAdded,
}: AddMealSheetProps) {
  const p = useFitnessPalette();
  const styles = useFitnessStyles(buildStyles);
  const [mealType, setMealType] = useState<MealType>('snack');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<FoodOption | null>(null);
  const [amount, setAmount] = useState('1');
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [saving, setSaving] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setMealType(asMealType(initialMealType));
    setQuery('');
    setResults([]);
    setSelected(null);
    setAmount('1');
    setCustomOpen(false);
    setCustomName('');
    setServingSize('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFats('');
    setEstimating(false);
    setError(null);
  }, [visible, initialMealType]);

  const openCustomFood = () => {
    setCustomOpen(true);
    setSelected(null);
    if (!customName.trim() && query.trim()) {
      setCustomName(query.trim());
    }
  };

  const applyEstimate = (estimate: FoodNutritionEstimate) => {
    setCustomName(estimate.name);
    setServingSize(estimate.servingSize);
    setCalories(String(estimate.calories));
    setProtein(String(estimate.protein));
    setCarbs(String(estimate.carbs));
    setFats(String(estimate.fats));
    setCustomOpen(true);
    setSelected(null);
    setError(null);
  };

  const onEstimateNutrition = async () => {
    const foodName = (customName.trim() || query.trim());
    if (foodName.length < 2) {
      setError('Type the food name first, then estimate nutrition.');
      return;
    }
    setEstimating(true);
    setError(null);
    try {
      const estimate = await estimateFoodNutrition({
        name: foodName,
        servingSize: servingSize.trim() || undefined,
      });
      const summary = `${estimate.calories} kcal · P ${estimate.protein}g · C ${estimate.carbs}g · F ${estimate.fats}g${
        estimate.servingSize ? ` · ${estimate.servingSize}` : ''
      }`;
      Alert.alert(
        'Use this estimate?',
        `${estimate.name}\n${summary}${
          estimate.note ? `\n\n${estimate.note}` : ''
        }\n\nYou can edit the values after confirming.`,
        [
          { text: 'Edit manually', style: 'cancel' },
          {
            text: 'Use estimate',
            onPress: () => applyEstimate(estimate),
          },
        ],
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to estimate nutrition.',
      );
    } finally {
      setEstimating(false);
    }
  };

  useEffect(() => {
    const term = query.trim();
    if (!visible || term.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      void searchFoods(term)
        .then((foods) => {
          if (!cancelled) setResults(foods);
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setResults([]);
            setError(err instanceof Error ? err.message : 'Unable to search foods.');
          }
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, visible]);

  const quantity = Number(amount);
  const validAmount = Number.isFinite(quantity) && quantity >= 0.1;
  const previewBase = customOpen
    ? {
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fats: Number(fats) || 0,
      }
    : selected;
  const preview =
    previewBase && validAmount ? scaleMealMacros(previewBase, quantity) : null;

  const onSave = async () => {
    if (!mealPlanId || dayNumber == null) {
      setError('Generate a meal plan before adding a meal.');
      return;
    }
    if (!validAmount) {
      setError('Enter an amount of at least 0.1.');
      return;
    }
    if (customOpen && customName.trim().length < 2) {
      setError('Food name needs at least 2 characters.');
      return;
    }
    if (customOpen && !Number.isFinite(Number(calories))) {
      setError('Enter calories for one serving.');
      return;
    }
    if (!customOpen && !selected) {
      setError('Choose a food, or add one that is not listed.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const food = customOpen
        ? await createCustomFood({
            name: customName.trim(),
            servingSize: servingSize.trim() || undefined,
            calories: Number(calories),
            protein: Number(protein) || 0,
            carbs: Number(carbs) || 0,
            fats: Number(fats) || 0,
          })
        : selected;
      if (!food) {
        setError('Choose a food, or add one that is not listed.');
        return;
      }
      const macros = scaleMealMacros(food, quantity);
      await addEatenMeal({
        mealPlanId,
        dayNumber,
        mealType,
        foodId: food.id,
        quantity,
        ...macros,
      });
      // "Ate something else" — dismiss the planned slot without ±10% replace.
      if (skipMealId) {
        await skipMeal(skipMealId).catch(() => undefined);
      }
      await onAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add meal.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Pressable style={styles.dismiss} onPress={onClose} />
        <View style={styles.sheet}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>Add a meal you ate</Text>
            <Text style={styles.muted}>
              {skipMealId
                ? 'Log what you actually ate. The planned meal is skipped — no calorie match required.'
                : 'The amount is saved with the meal, and calories are calculated from it.'}
            </Text>

            <Text style={styles.label}>Meal</Text>
            <View style={styles.chips}>
              {MEAL_TYPES.map((type) => {
                const active = mealType === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => setMealType(type)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {type}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Food</Text>
            <TextInput
              placeholder="Search oats, paneer, rice…"
              placeholderTextColor={p.textMuted}
              style={styles.input}
              value={query}
              onChangeText={(value) => {
                setQuery(value);
                setSelected(null);
                setCustomOpen(false);
              }}
            />
            {searching ? <ActivityIndicator color={p.lime} /> : null}
            {results.map((food) => {
              const active = selected?.id === food.id;
              return (
                <Pressable
                  key={food.id}
                  onPress={() => {
                    setSelected(food);
                    setCustomOpen(false);
                  }}
                  style={[styles.result, active && styles.resultActive]}
                >
                  <Text style={styles.resultName}>{food.name}</Text>
                  <Text style={styles.muted}>
                    {food.calories} kcal
                    {food.servingAmount != null && food.servingUnit
                      ? ` · ${formatMealAmount({
                          quantity: 1,
                          servingAmount: food.servingAmount,
                          servingUnit: food.servingUnit,
                          servingSize: food.servingSize,
                          amount: food.servingAmount,
                          amountLabel: null,
                        })}`
                      : food.servingSize
                        ? ` · ${food.servingSize}`
                        : ' per serving'}
                  </Text>
                </Pressable>
              );
            })}

            <Pressable
              onPress={() => {
                if (customOpen) {
                  setCustomOpen(false);
                  return;
                }
                openCustomFood();
              }}
            >
              <Text style={styles.link}>
                {customOpen ? 'Use a listed food' : 'Can’t find it? Add the food'}
              </Text>
            </Pressable>

            {customOpen ? (
              <View style={styles.custom}>
                <Field label="Name" value={customName} onChangeText={setCustomName} />
                <Field
                  label="One serving"
                  placeholder="1 bowl"
                  value={servingSize}
                  onChangeText={setServingSize}
                />
                <Pressable
                  disabled={estimating}
                  onPress={() => void onEstimateNutrition()}
                  style={styles.estimateBtn}
                >
                  {estimating ? (
                    <ActivityIndicator color={p.onLime} />
                  ) : (
                    <Text style={styles.estimateBtnText}>
                      Estimate nutrition with AI
                    </Text>
                  )}
                </Pressable>
                <Text style={styles.muted}>
                  Don’t know the calories? We’ll suggest values — confirm before
                  using them.
                </Text>
                <View style={styles.macroRow}>
                  <Field
                    keyboard="numeric"
                    label="Kcal"
                    value={calories}
                    onChangeText={setCalories}
                  />
                  <Field
                    keyboard="numeric"
                    label="Protein"
                    value={protein}
                    onChangeText={setProtein}
                  />
                  <Field
                    keyboard="numeric"
                    label="Carbs"
                    value={carbs}
                    onChangeText={setCarbs}
                  />
                  <Field
                    keyboard="numeric"
                    label="Fats"
                    value={fats}
                    onChangeText={setFats}
                  />
                </View>
              </View>
            ) : query.trim().length >= 2 && results.length === 0 && !searching ? (
              <Pressable
                disabled={estimating}
                onPress={() => {
                  openCustomFood();
                  void onEstimateNutrition();
                }}
                style={styles.estimateBtn}
              >
                {estimating ? (
                  <ActivityIndicator color={p.onLime} />
                ) : (
                  <Text style={styles.estimateBtnText}>
                    Estimate “{query.trim()}” with AI
                  </Text>
                )}
              </Pressable>
            ) : null}

            <Field
              keyboard="decimal-pad"
              label="Amount you ate"
              value={amount}
              onChangeText={setAmount}
            />
            {preview ? (
              <Text style={styles.preview}>
                {foodPortionLabel(
                  customOpen
                    ? {
                        id: 'custom',
                        name: customName || 'Custom',
                        calories: Number(calories) || 0,
                        protein: Number(protein) || 0,
                        carbs: Number(carbs) || 0,
                        fats: Number(fats) || 0,
                        servingSize: servingSize.trim() || null,
                      }
                    : selected,
                  quantity,
                )}{' '}
                = {preview.calories} kcal · P {formatMacro(preview.protein)}g · C{' '}
                {formatMacro(preview.carbs)}g · F {formatMacro(preview.fats)}g
              </Text>
            ) : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              disabled={saving}
              onPress={() => void onSave()}
              style={styles.save}
            >
              {saving ? (
                <ActivityIndicator color={p.onLime} />
              ) : (
                <Text style={styles.saveText}>Save meal</Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboard,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboard?: 'numeric' | 'decimal-pad';
}) {
  const p = useFitnessPalette();
  const styles = useFitnessStyles(buildStyles);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        keyboardType={keyboard}
        placeholder={placeholder}
        placeholderTextColor={p.textMuted}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

function buildStyles(p: FitnessPalette) {
  return StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0,0,0,0.55)', flex: 1, justifyContent: 'flex-end' },
  dismiss: { flex: 1 },
  sheet: {
    backgroundColor: p.bg,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '88%',
  },
  content: { gap: 10, padding: 18, paddingBottom: 32 },
  title: { color: p.text, fontSize: 22, fontWeight: '800' },
  muted: { color: p.textSecondary, fontSize: 13, lineHeight: 18 },
  label: {
    color: p.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderColor: p.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: p.lime, borderColor: p.lime },
  chipText: { color: p.text, fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },
  chipTextActive: { color: p.onLime },
  input: {
    backgroundColor: p.surface,
    borderColor: p.border,
    borderRadius: 12,
    borderWidth: 1,
    color: p.text,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  result: {
    borderColor: p.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
    padding: 10,
  },
  resultActive: { borderColor: p.lime },
  resultName: { color: p.text, fontSize: 14, fontWeight: '700' },
  link: { color: p.lime, fontSize: 13, fontWeight: '800' },
  custom: { gap: 8 },
  macroRow: { flexDirection: 'row', gap: 8 },
  field: { flex: 1, gap: 6 },
  preview: { color: p.limeSoft, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  error: { color: p.burn, fontSize: 13 },
  estimateBtn: {
    alignItems: 'center',
    backgroundColor: p.lime,
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 12,
  },
  estimateBtnText: {
    color: p.onLime,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  save: {
    alignItems: 'center',
    backgroundColor: p.lime,
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 48,
    marginTop: 4,
  },
  saveText: { color: p.onLime, fontSize: 15, fontWeight: '800' },
});
}

