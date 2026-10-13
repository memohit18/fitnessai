import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';
import Toast from 'react-native-toast-message';

import { updateFoodImage } from '../../api/foodApi';
import { uploadImage } from '../../api/imagesApi';
import {
  generateMealPlan,
  getNutritionSummary,
  getTodayMeals,
  logMealEaten,
  skipMeal,
  undoMeal,
} from '../../api/mealApi';
import { AppShell } from '../../components/app/AppShell';
import { AddMealSheet } from '../../components/fitness/AddMealSheet';
import { DietPanel } from '../../components/fitness/diet/DietPanel';
import { NutritionPanel } from '../../components/fitness/nutrition/NutritionPanel';
import { ImageUploadThumb } from '../../components/fitness/ImageUploadThumb';
import type { FitnessPalette } from '../../constants/fitnessPalette';
import { useFitnessPalette, useFitnessStyles } from '../../hooks/useFitnessPalette';
import {
  formatMacro,
  isMealEaten,
  mealAmountDisplay,
} from '../../lib/fitness/mealMath';
import type { MealItem, NutritionBudget, TodayMeals } from '../../types/fitness';
import { getApiErrorMessage } from '../../utils/api';

type MealsTab = 'meals' | 'diet' | 'nutrition';
const TABS: MealsTab[] = ['meals', 'diet', 'nutrition'];
const PAGE_WIDTH = Dimensions.get('window').width;
/** Extra scroll room so last cards clear the floating Analytics FAB. */
const SCROLL_BOTTOM_PAD = 110;

function tabIndex(tab: MealsTab) {
  return TABS.indexOf(tab);
}

/** Prefer API amountLabel / servingAmount×unit via mealAmountDisplay. */
const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];

const MEAL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  breakfast: 'nutrition-outline',
  lunch: 'fast-food-outline',
  dinner: 'fish-outline',
  snack: 'cafe-outline',
};

export function MealsScreen() {
  const palette = useFitnessPalette();
  const styles = useFitnessStyles(buildStyles);
  const [tab, setTab] = useState<MealsTab>('meals');
  const pagerRef = useRef<ScrollView>(null);
  const [pagerHeight, setPagerHeight] = useState(0);
  const [data, setData] = useState<TodayMeals | null>(null);
  const [budget, setBudget] = useState<NutritionBudget | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [ateInsteadOf, setAteInsteadOf] = useState<{
    mealId: string;
    mealType: string;
  } | null>(null);
  const hasLoadedRef = useRef(false);

  const selectTab = (next: MealsTab) => {
    setTab(next);
    pagerRef.current?.scrollTo({
      x: tabIndex(next) * PAGE_WIDTH,
      animated: true,
    });
  };

  const onPagerScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / PAGE_WIDTH);
    setTab(TABS[Math.max(0, Math.min(TABS.length - 1, index))] ?? 'meals');
  };

  const load = useCallback(async (mode: 'full' | 'soft' = 'full') => {
    if (mode === 'full') {
      setStatus('loading');
      setError(null);
    } else {
      setRefreshing(true);
    }
    try {
      const [today, nutrition] = await Promise.all([
        getTodayMeals(),
        getNutritionSummary().catch(() => null),
      ]);
      setData(today);
      setBudget(nutrition);
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

  const runMealAction = async (meal: MealItem, action: 'complete' | 'skip' | 'undo') => {
    setBusyId(meal.id);
    try {
      if (action === 'complete') await logMealEaten(meal.id, 1);
      if (action === 'skip') await skipMeal(meal.id);
      if (action === 'undo') await undoMeal(meal.id);
      await load('soft');
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
    if (meal.foodId) await updateFoodImage(meal.foodId, url);
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

  const meals = [...(data?.meals ?? [])].sort(
    (a, b) => MEAL_ORDER.indexOf(a.type) - MEAL_ORDER.indexOf(b.type),
  );

  return (
    <AppShell backgroundColor={palette.bg} contentStyle={styles.shell} hideHeader>
      <View style={styles.tabsWrap}>
        {TABS.map((key) => {
          const label =
            key === 'meals' ? 'Meals' : key === 'diet' ? 'Diet' : 'Nutrition';
          const active = tab === key;
          return (
            <Pressable
              key={key}
              onPress={() => selectTab(key)}
              style={[styles.tabChip, active && styles.tabChipActive]}
            >
              <Text
                style={[styles.tabChipText, active && styles.tabChipTextActive]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View
        style={styles.pager}
        onLayout={(event) => {
          const next = Math.round(event.nativeEvent.layout.height);
          if (next > 0 && next !== pagerHeight) setPagerHeight(next);
        }}
      >
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onPagerScrollEnd}
        style={pagerHeight > 0 ? { height: pagerHeight } : styles.pager}
      >
        <View
          style={[
            styles.page,
            { width: PAGE_WIDTH, height: pagerHeight > 0 ? pagerHeight : undefined },
          ]}
        >
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: SCROLL_BOTTOM_PAD }]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                tintColor={palette.lime}
                onRefresh={() => void load('soft')}
              />
            }
          >
            <View style={styles.topRow}>
              <View style={styles.dateRow}>
                <Text style={styles.dateText}>{formatDayLabel(data?.date)}</Text>
                <Ionicons color={palette.lime} name="chevron-forward" size={14} />
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  Toast.show({
                    type: 'info',
                    text1: 'No new notifications',
                    position: 'bottom',
                  })
                }
                style={styles.bell}
              >
                <Ionicons color={palette.text} name="notifications-outline" size={18} />
              </Pressable>
            </View>

            <View style={styles.eyebrowRow}>
              <Text style={styles.eyebrow}>Meals</Text>
              <View style={styles.eyebrowDot} />
            </View>
            <Text style={styles.title}>Today’s plan</Text>
            <Text style={styles.muted}>
              Mark what you ate, skip a meal, or undo a mistake.
            </Text>

            <BudgetCard budget={budget} />

            {status === 'error' ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Couldn’t load meals</Text>
                <Text style={styles.muted}>{error}</Text>
                <Pressable onPress={() => void load()} style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}

            {status === 'loading' && meals.length === 0 ? (
              <View style={styles.card}>
                <ActivityIndicator color={palette.lime} />
              </View>
            ) : null}

            {status === 'ready' && meals.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>No active meal plan</Text>
                <Text style={styles.muted}>
                  Generate a weekly plan to see breakfast, lunch, dinner, and snacks.
                </Text>
                <Pressable
                  disabled={generating}
                  onPress={() => void onGenerate()}
                  style={styles.primaryBtn}
                >
                  {generating ? (
                    <ActivityIndicator color={palette.onLime} />
                  ) : (
                    <Text style={styles.primaryBtnText}>Generate meal plan</Text>
                  )}
                </Pressable>
              </View>
            ) : null}

            {meals.map((meal) => (
              <MealCard
                key={meal.id}
                busy={busyId === meal.id}
                meal={meal}
                onEat={() => void runMealAction(meal, 'complete')}
                onSkip={() => void runMealAction(meal, 'skip')}
                onSwap={() => {
                  setAteInsteadOf({ mealId: meal.id, mealType: meal.type });
                  setAdding(true);
                }}
                onUndo={() => void runMealAction(meal, 'undo')}
                onUpload={(prepared) => onUploadMealImage(meal, prepared)}
              />
            ))}

            {meals.length > 0 ? (
              <Pressable
                onPress={() => {
                  setAteInsteadOf(null);
                  setAdding(true);
                }}
                style={styles.addBtn}
              >
                <Ionicons color={palette.lime} name="add" size={16} />
                <Text style={styles.addBtnText}>ADD A MEAL YOU ATE</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </View>

        <View
          style={[
            styles.page,
            { width: PAGE_WIDTH, height: pagerHeight > 0 ? pagerHeight : undefined },
          ]}
        >
          <DietPanel />
        </View>

        <View
          style={[
            styles.page,
            { width: PAGE_WIDTH, height: pagerHeight > 0 ? pagerHeight : undefined },
          ]}
        >
          <NutritionPanel />
        </View>
      </ScrollView>
      </View>

      <AddMealSheet
        key={ateInsteadOf ? `instead-${ateInsteadOf.mealId}` : 'add-eaten'}
        dayNumber={data?.dayNumber ?? null}
        initialMealType={ateInsteadOf?.mealType}
        mealPlanId={data?.mealPlanId ?? null}
        skipMealId={ateInsteadOf?.mealId}
        visible={adding}
        onAdded={() => load('soft')}
        onClose={() => {
          setAdding(false);
          setAteInsteadOf(null);
        }}
      />
    </AppShell>
  );
}

function BudgetCard({ budget }: { budget: NutritionBudget | null }) {
  const palette = useFitnessPalette();
  const styles = useFitnessStyles(buildStyles);
  const current = budget?.calories ?? 0;
  const target = budget?.calorieTarget ?? 0;
  const percent = target > 0 ? Math.round((current / target) * 100) : 0;

  return (
    <View style={styles.card}>
      <View style={styles.budgetHead}>
        <Text style={styles.budgetLabel}>Daily calorie budget</Text>
        <Text style={styles.onTrack}>
          {target > 0 ? `${percent}% On Track` : 'No target yet'}
        </Text>
      </View>
      <View style={styles.budgetBody}>
        <BudgetRing
          color={palette.lime}
          current={current}
          target={target}
          track={palette.track}
          text={palette.text}
          muted={palette.textMuted}
        />
        <View style={styles.macroCol}>
          <MacroBar
            current={budget?.protein ?? 0}
            label="Protein"
            target={budget?.proteinTarget ?? 0}
            unit="g"
          />
          <MacroBar
            current={budget?.carbs ?? 0}
            label="Carbs"
            target={budget?.carbsTarget ?? 0}
            unit="g"
          />
          <MacroBar
            current={budget?.fats ?? 0}
            label="Fats"
            target={budget?.fatsTarget ?? 0}
            unit="g"
          />
        </View>
      </View>
    </View>
  );
}

function BudgetRing({
  current,
  target,
  color,
  track,
  text,
  muted,
}: {
  current: number;
  target: number;
  color: string;
  track: string;
  text: string;
  muted: string;
}) {
  const size = 92;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = target > 0 ? Math.min(1, current / target) : 0;
  return (
    <View style={{ height: size, width: size }}>
      <Svg height={size} width={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke={track}
          strokeWidth={stroke}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke={color}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - ratio)}
          strokeLinecap="round"
          strokeWidth={stroke}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View
        style={{
          alignItems: 'center',
          bottom: 0,
          justifyContent: 'center',
          left: 0,
          position: 'absolute',
          right: 0,
          top: 0,
        }}
      >
        <Text style={{ color: text, fontSize: 16, fontWeight: '800' }}>
          {Math.round(current).toLocaleString('en-US')}
        </Text>
        <Text style={{ color: muted, fontSize: 11, fontWeight: '700' }}>
          /{target > 0 ? Math.round(target).toLocaleString('en-US') : '—'}
        </Text>
      </View>
    </View>
  );
}

function MacroBar({
  label,
  current,
  target,
  unit,
}: {
  label: string;
  current: number;
  target: number;
  unit: string;
}) {
  const palette = useFitnessPalette();
  const styles = useFitnessStyles(buildStyles);
  const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  return (
    <View style={styles.macroBlock}>
      <View style={styles.macroTop}>
        <Text style={styles.macroName}>
          {label}
          {target > 0 ? ` (Target ${Math.round(target)}${unit})` : ''}
        </Text>
        <Text style={styles.macroValue}>
          {formatMacro(current)}
          {unit}{' '}
          <Text style={styles.macroPct}>{target > 0 ? `${percent}%` : ''}</Text>
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { backgroundColor: palette.lime, width: `${percent}%` }]} />
      </View>
    </View>
  );
}

function MealCard({
  meal,
  busy,
  onEat,
  onSkip,
  onUndo,
  onSwap,
  onUpload,
}: {
  meal: MealItem;
  busy: boolean;
  onEat: () => void;
  onSkip: () => void;
  onUndo: () => void;
  onSwap: () => void;
  onUpload: (prepared: { uri: string; fileName: string; mimeType: string }) => Promise<string>;
}) {
  const styles = useFitnessStyles(buildStyles);
  const eaten = isMealEaten(meal.status);
  const swapped = meal.status === 'replaced' || Boolean(meal.replacementFoodName);
  const ateName = meal.replacementFoodName || meal.name;
  const amountLabel = mealAmountDisplay(meal);

  return (
    <View style={styles.card}>
      <View style={styles.mealHeader}>
        <ImageUploadThumb
          fallbackIcon={MEAL_ICONS[meal.type] ?? 'restaurant-outline'}
          size={64}
          uri={meal.imageUrl}
          onUpload={onUpload}
        />
        <View style={styles.mealCopy}>
          <View style={styles.typeRow}>
            <Text style={styles.mealType}>{meal.type}</Text>
            {swapped ? (
              <View style={styles.swapBadge}>
                <Text style={styles.swapBadgeText}>AI SWAPPED</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.cardTitle}>{meal.name}</Text>
          <Text style={styles.muted}>Amount: {amountLabel}</Text>
          <Text style={styles.muted}>
            {meal.calories} kcal · P {formatMacro(meal.protein)}g · C{' '}
            {formatMacro(meal.carbs)}g · F {formatMacro(meal.fats)}g
          </Text>
          <Text style={styles.status}>Status: {meal.status}</Text>
        </View>
      </View>

      {swapped ? (
        <View style={styles.swapCard}>
          <Text style={styles.swapTitle}>Ate {ateName} instead</Text>
          {meal.originalFoodName ? (
            <Text style={styles.muted}>Planned: {meal.originalFoodName}</Text>
          ) : null}
          <Pressable onPress={onSwap}>
            <Text style={styles.swapLink}>+ Log what you ate instead</Text>
          </Pressable>
        </View>
      ) : eaten ? null : (
        <Pressable onPress={onSwap}>
          <Text style={styles.swapLink}>+ Ate something else</Text>
        </Pressable>
      )}

      <View style={styles.actions}>
        {eaten ? (
          <View style={[styles.actionBtn, styles.actionBtnClosed]}>
            <Text style={styles.actionTextClosed}>Eat</Text>
          </View>
        ) : (
          <ActionBtn busy={busy} label="Eat" onPress={onEat} />
        )}
        <ActionBtn busy={busy || eaten} label="Skip" secondary onPress={onSkip} />
        <ActionBtn busy={busy} label="Undo" secondary onPress={onUndo} />
      </View>
    </View>
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
  const styles = useFitnessStyles(buildStyles);
  return (
    <Pressable
      disabled={busy}
      onPress={onPress}
      style={[styles.actionBtn, secondary && styles.actionBtnSecondary, busy && { opacity: 0.55 }]}
    >
      <Text style={[styles.actionText, secondary && styles.actionTextSecondary]}>{label}</Text>
    </Pressable>
  );
}

function formatDayLabel(iso?: string | null) {
  const date = iso ? new Date(`${iso}T00:00:00`) : new Date();
  if (Number.isNaN(date.getTime())) return 'TODAY';
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  return `TODAY, ${month} ${date.getDate()}`;
}

function buildStyles(p: FitnessPalette) {
  return {
    shell: { backgroundColor: p.bg, paddingHorizontal: 0, flex: 1 },
    tabsWrap: {
      alignItems: 'center' as const,
      flexDirection: 'row' as const,
      gap: 6,
      paddingHorizontal: 16,
      paddingBottom: 10,
      paddingTop: 6,
    },
    tabChip: {
      backgroundColor: p.surface,
      borderColor: p.border,
      borderRadius: 999,
      borderWidth: 1,
      flex: 1,
      alignItems: 'center' as const,
      minHeight: 38,
      justifyContent: 'center' as const,
      paddingHorizontal: 4,
    },
    tabChipActive: {
      backgroundColor: p.lime,
      borderColor: p.lime,
    },
    tabChipText: {
      color: p.textSecondary,
      fontSize: 13,
      fontWeight: '800' as const,
    },
    tabChipTextActive: {
      color: p.onLime,
    },
    pager: { flex: 1 },
    page: { flex: 1 },
    content: { gap: 14, padding: 18, paddingBottom: 28 },
    topRow: {
      alignItems: 'center' as const,
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
    },
    dateRow: { alignItems: 'center' as const, flexDirection: 'row' as const, gap: 2 },
    dateText: {
      color: p.lime,
      fontSize: 12,
      fontWeight: '800' as const,
      letterSpacing: 0.6,
    },
    bell: {
      alignItems: 'center' as const,
      backgroundColor: p.surface,
      borderColor: p.border,
      borderRadius: 12,
      borderWidth: 1,
      height: 36,
      justifyContent: 'center' as const,
      width: 36,
    },
    eyebrowRow: { alignItems: 'center' as const, flexDirection: 'row' as const, gap: 6 },
    eyebrow: {
      color: p.lime,
      fontSize: 12,
      fontWeight: '800' as const,
      letterSpacing: 1,
      textTransform: 'uppercase' as const,
    },
    eyebrowDot: {
      backgroundColor: p.lime,
      borderRadius: 99,
      height: 6,
      width: 6,
    },
    title: { color: p.text, fontSize: 30, fontWeight: '800' as const },
    muted: { color: p.textSecondary, fontSize: 13, lineHeight: 18 },
    card: {
      backgroundColor: p.surface,
      borderColor: p.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 12,
      padding: 14,
    },
    cardTitle: { color: p.text, fontSize: 16, fontWeight: '800' as const },
    budgetHead: {
      alignItems: 'center' as const,
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
    },
    budgetLabel: {
      color: p.textMuted,
      fontSize: 11,
      fontWeight: '800' as const,
      letterSpacing: 0.6,
      textTransform: 'uppercase' as const,
    },
    onTrack: { color: p.lime, fontSize: 12, fontWeight: '800' as const },
    budgetBody: { alignItems: 'center' as const, flexDirection: 'row' as const, gap: 14 },
    macroCol: { flex: 1, gap: 10 },
    macroBlock: { gap: 4 },
    macroTop: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
    },
    macroName: { color: p.textSecondary, flex: 1, fontSize: 11, fontWeight: '700' as const },
    macroValue: { color: p.text, fontSize: 12, fontWeight: '800' as const },
    macroPct: { color: p.lime, fontWeight: '800' as const },
    track: {
      backgroundColor: p.track,
      borderRadius: 99,
      height: 6,
      overflow: 'hidden' as const,
    },
    fill: { borderRadius: 99, height: '100%' as const },
    mealHeader: { alignItems: 'center' as const, flexDirection: 'row' as const, gap: 12 },
    mealCopy: { flex: 1, gap: 3 },
    typeRow: {
      alignItems: 'center' as const,
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
    },
    mealType: {
      color: p.lime,
      fontSize: 11,
      fontWeight: '800' as const,
      textTransform: 'uppercase' as const,
    },
    status: { color: p.textMuted, fontSize: 12, fontWeight: '600' as const },
    swapBadge: {
      backgroundColor: p.limeDim,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    swapBadgeText: { color: p.lime, fontSize: 10, fontWeight: '800' as const },
    swapCard: {
      backgroundColor: p.surfaceElevated,
      borderColor: p.border,
      borderRadius: 14,
      borderWidth: 1,
      gap: 4,
      padding: 12,
    },
    swapTitle: { color: p.text, fontSize: 13, fontWeight: '800' as const },
    swapLink: { color: p.lime, fontSize: 12, fontWeight: '800' as const },
    actions: { flexDirection: 'row' as const, gap: 8 },
    actionBtn: {
      backgroundColor: p.lime,
      borderRadius: 12,
      flex: 1,
      paddingVertical: 11,
    },
    actionBtnSecondary: {
      backgroundColor: 'transparent',
      borderColor: p.border,
      borderWidth: 1,
    },
    actionBtnClosed: {
      backgroundColor: p.surfaceElevated,
      borderColor: p.border,
      borderWidth: 1,
    },
    actionText: {
      color: p.onLime,
      fontSize: 13,
      fontWeight: '800' as const,
      textAlign: 'center' as const,
    },
    actionTextSecondary: { color: p.text },
    actionTextClosed: {
      color: p.textMuted,
      fontSize: 13,
      fontWeight: '800' as const,
      textAlign: 'center' as const,
    },
    addBtn: {
      alignItems: 'center' as const,
      borderColor: p.lime,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row' as const,
      gap: 6,
      justifyContent: 'center' as const,
      marginTop: 4,
      paddingVertical: 14,
    },
    addBtnText: {
      color: p.lime,
      fontSize: 12,
      fontWeight: '800' as const,
      letterSpacing: 0.4,
    },
    primaryBtn: {
      alignItems: 'center' as const,
      backgroundColor: p.lime,
      borderRadius: 14,
      justifyContent: 'center' as const,
      minHeight: 46,
    },
    primaryBtnText: { color: p.onLime, fontSize: 14, fontWeight: '800' as const },
  };
}
