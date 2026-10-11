import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import { updateFoodImage } from '../../api/foodApi';
import { uploadImage } from '../../api/imagesApi';
import {
  completeMeal,
  generateMealPlan,
  getTodayMeals,
  skipMeal,
  undoMeal,
} from '../../api/mealApi';
import { AppShell } from '../../components/app/AppShell';
import { ImageUploadThumb } from '../../components/fitness/ImageUploadThumb';
import { fitnessPalette as p } from '../../constants/fitnessPalette';
import type { MealItem, TodayMeals } from '../../types/fitness';
import { getApiErrorMessage } from '../../utils/api';

export function MealsScreen() {
  const [data, setData] = useState<TodayMeals | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedRef = useRef(false);

  const load = useCallback(async (mode: 'full' | 'soft' = 'full') => {
    if (mode === 'full') {
      setStatus('loading');
      setError(null);
    } else {
      setRefreshing(true);
    }
    try {
      const today = await getTodayMeals();
      setData(today);
      setStatus('ready');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load meals.'));
      if (mode === 'full') setStatus('error');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(hasLoadedRef.current ? 'soft' : 'full').then(() => {
        hasLoadedRef.current = true;
      });
    }, [load]),
  );

  const onGenerate = async () => {
    setGenerating(true);
    try {
      await generateMealPlan();
      Toast.show({
        type: 'success',
        text1: 'Meal plan generating',
        text2: 'Refreshing today’s meals…',
        position: 'bottom',
      });
      await load();
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Generate failed',
        text2: getApiErrorMessage(err, 'Unable to generate meal plan.'),
        position: 'bottom',
      });
    } finally {
      setGenerating(false);
    }
  };

  const runMealAction = async (
    meal: MealItem,
    action: 'complete' | 'skip' | 'undo',
  ) => {
    setBusyId(meal.id);
    try {
      if (action === 'complete') await completeMeal(meal.id);
      if (action === 'skip') await skipMeal(meal.id);
      if (action === 'undo') await undoMeal(meal.id);
      await load();
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Action failed',
        text2: getApiErrorMessage(err, 'Unable to update meal.'),
        position: 'bottom',
      });
    } finally {
      setBusyId(null);
    }
  };

  const onUploadMealImage = async (
    meal: MealItem,
    prepared: { uri: string; fileName: string; mimeType: string },
  ) => {
    const { url } = await uploadImage({
      uri: prepared.uri,
      fileName: prepared.fileName,
      mimeType: prepared.mimeType,
      type: 'food',
    });

    if (meal.foodId) {
      await updateFoodImage(meal.foodId, url);
    }

    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        meals: prev.meals.map((item) =>
          item.id === meal.id ? { ...item, imageUrl: url } : item,
        ),
      };
    });

    return url;
  };

  const meals = data?.meals ?? [];

  return (
    <AppShell backgroundColor={p.bg} contentStyle={styles.shell} hideHeader>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={p.lime}
            onRefresh={() => void load('soft')}
          />
        }
      >
        <Text style={styles.eyebrow}>Meals</Text>
        <Text style={styles.title}>Today’s plan</Text>
        <Text style={styles.muted}>
          Mark what you ate, skip a meal, or undo a mistake.
        </Text>

        {status === 'error' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Couldn’t load meals</Text>
            <Text style={styles.muted}>{error}</Text>
            <Pressable onPress={() => void load()} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {status === 'ready' && meals.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>No active meal plan</Text>
            <Text style={styles.muted}>
              Generate a weekly plan to see breakfast, lunch, snacks, and dinner.
            </Text>
            <Pressable
              disabled={generating}
              onPress={() => void onGenerate()}
              style={styles.primaryBtn}
            >
              {generating ? (
                <ActivityIndicator color={p.onLime} />
              ) : (
                <Text style={styles.primaryBtnText}>Generate meal plan</Text>
              )}
            </Pressable>
          </View>
        ) : null}

        {meals.map((meal) => (
          <View key={meal.id} style={styles.card}>
            <View style={styles.mealHeader}>
              <ImageUploadThumb
                fallbackIcon="restaurant-outline"
                size={78}
                uri={meal.imageUrl}
                onUpload={(prepared) => onUploadMealImage(meal, prepared)}
              />
              <View style={styles.mealCopy}>
                <Text style={styles.mealType}>{meal.type}</Text>
                <Text style={styles.cardTitle}>{meal.name}</Text>
                <Text style={styles.muted}>
                  {meal.calories} kcal · P {meal.protein}g · C {meal.carbs}g · F{' '}
                  {meal.fats}g
                </Text>
                <Text style={styles.status}>Status: {meal.status}</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <ActionBtn
                busy={busyId === meal.id}
                label="Eat"
                onPress={() => void runMealAction(meal, 'complete')}
              />
              <ActionBtn
                busy={busyId === meal.id}
                label="Skip"
                onPress={() => void runMealAction(meal, 'skip')}
                secondary
              />
              <ActionBtn
                busy={busyId === meal.id}
                label="Undo"
                onPress={() => void runMealAction(meal, 'undo')}
                secondary
              />
            </View>
          </View>
        ))}
      </ScrollView>
    </AppShell>
  );
}

function ActionBtn({
  label,
  onPress,
  busy,
  secondary,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      disabled={busy}
      onPress={onPress}
      style={[styles.actionBtn, secondary && styles.actionBtnSecondary]}
    >
      <Text style={[styles.actionText, secondary && styles.actionTextSecondary]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: { backgroundColor: p.bg, paddingHorizontal: 0 },
  content: { gap: 14, padding: 18, paddingBottom: 36 },
  eyebrow: {
    color: p.lime,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: { color: p.text, fontSize: 28, fontWeight: '800' },
  muted: { color: p.textSecondary, fontSize: 13, lineHeight: 18 },
  card: {
    backgroundColor: p.surface,
    borderColor: p.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  cardTitle: { color: p.text, fontSize: 16, fontWeight: '800' },
  mealHeader: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  mealCopy: { flex: 1, gap: 4 },
  mealType: {
    color: p.lime,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  status: { color: p.textMuted, fontSize: 12, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    backgroundColor: p.lime,
    borderRadius: 12,
    flex: 1,
    paddingVertical: 10,
  },
  actionBtnSecondary: {
    backgroundColor: 'transparent',
    borderColor: p.border,
    borderWidth: 1,
  },
  actionText: {
    color: p.onLime,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  actionTextSecondary: { color: p.text },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: p.lime,
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 46,
  },
  primaryBtnText: { color: p.onLime, fontSize: 14, fontWeight: '800' },
});
