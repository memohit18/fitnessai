import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Toast from 'react-native-toast-message';

import {
  activateDiet,
  addDietHydration,
  deleteDiet,
  generateDiet,
  getActiveDiet,
  getDietHistory,
  getDietPlanner,
  regenerateDiet,
} from '../../../api/dietApi';
import { SideDrawer } from '../../app/SideDrawer';
import type { FitnessPalette } from '../../../constants/fitnessPalette';
import { useFitnessPalette, useFitnessStyles } from '../../../hooks/useFitnessPalette';
import {
  DIET_DAY_FULL_LABELS,
  DIET_DAY_LABELS,
  DIET_DAY_ORDER,
  DIET_MEAL_LABELS,
} from '../../../lib/fitness/diet/constants';
import {
  formatGoalLabel,
  getDateForDietDay,
  getDayMeals,
  getDietDayKeyFromDate,
} from '../../../lib/fitness/diet/dietResponse';
import type {
  DietDayKey,
  DietHistoryItem,
  DietMacroProgress,
  DietMeal,
  DietPlan,
  DietPlanner,
} from '../../../lib/fitness/diet/types';
import type { MainTabParamList } from '../../../navigation/types';
import { getApiErrorMessage } from '../../../utils/api';

export function DietPanel() {
  const p = useFitnessPalette();
  const styles = useFitnessStyles(buildStyles);
  const navigation =
    useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [diet, setDiet] = useState<DietPlan | null>(null);
  const [planner, setPlanner] = useState<DietPlanner | null>(null);
  const [history, setHistory] = useState<DietHistoryItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [loggingWater, setLoggingWater] = useState(false);
  const [plannerFetching, setPlannerFetching] = useState(false);
  const [activeDay, setActiveDay] = useState<DietDayKey>(
    getDietDayKeyFromDate(new Date().toISOString()) ?? 'monday',
  );

  const load = useCallback(async (mode: 'full' | 'soft' = 'full') => {
    if (mode === 'full') {
      setStatus('loading');
      setError(null);
    } else {
      setRefreshing(true);
    }
    try {
      const [active, plannerData] = await Promise.all([
        getActiveDiet(),
        getDietPlanner().catch(() => null),
      ]);
      setDiet(active);
      setPlanner(plannerData);
      const plannerDay = getDietDayKeyFromDate(plannerData?.date);
      if (plannerDay) setActiveDay(plannerDay);
      setStatus('ready');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load diet.'));
      if (mode === 'full') setStatus('error');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const selectDay = async (day: DietDayKey) => {
    setActiveDay(day);
    const date = getDateForDietDay(planner?.date ?? null, day);
    setPlannerFetching(true);
    try {
      const next = await getDietPlanner(date);
      if (next) setPlanner(next);
    } catch {
      // Keep active plan meals for the day.
    } finally {
      setPlannerFetching(false);
    }
  };

  const openHistory = async () => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const response = await getDietHistory({ page: 1, limit: 20 });
      setHistory(response.items);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'History failed',
        text2: getApiErrorMessage(err, 'Unable to load diet history.'),
        position: 'bottom',
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  const onGenerate = async (mode: 'create' | 'regen') => {
    setGenerating(true);
    try {
      const next = mode === 'regen' ? await regenerateDiet() : await generateDiet();
      setDiet(next);
      Toast.show({
        type: 'success',
        text1: mode === 'regen' ? 'Diet regenerated' : 'Diet ready',
        text2: `${next.dailyCalories} kcal · ${next.dailyProtein}g protein`,
        position: 'bottom',
      });
      await load('soft');
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: mode === 'regen' ? 'Regenerate failed' : 'Generate failed',
        text2: getApiErrorMessage(err, 'Unable to update diet.'),
        position: 'bottom',
      });
    } finally {
      setGenerating(false);
    }
  };

  const onActivate = async (id: string) => {
    setActivatingId(id);
    try {
      const next = await activateDiet(id);
      if (next) setDiet(next);
      Toast.show({ type: 'success', text1: 'Diet activated', position: 'bottom' });
      setHistoryOpen(false);
      await load('soft');
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Activate failed',
        text2: getApiErrorMessage(err, 'Unable to activate diet.'),
        position: 'bottom',
      });
    } finally {
      setActivatingId(null);
    }
  };

  const onDelete = async (id: string) => {
    setActivatingId(id);
    try {
      await deleteDiet(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      if (diet?.id === id) setDiet(null);
      Toast.show({ type: 'success', text1: 'Diet removed', position: 'bottom' });
      await load('soft');
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Delete failed',
        text2: getApiErrorMessage(err, 'Unable to delete diet.'),
        position: 'bottom',
      });
    } finally {
      setActivatingId(null);
    }
  };

  const onAddWater = async (amountMl: number) => {
    setLoggingWater(true);
    try {
      const next = await addDietHydration(amountMl);
      if (next) {
        setPlanner((prev) =>
          prev
            ? {
                ...prev,
                hydration: next,
                nutrition: prev.nutrition
                  ? { ...prev.nutrition, water: next }
                  : prev.nutrition,
              }
            : prev,
        );
      }
      Toast.show({
        type: 'success',
        text1: `Added ${amountMl}ml`,
        position: 'bottom',
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Hydration failed',
        text2: getApiErrorMessage(err, 'Unable to log water.'),
        position: 'bottom',
      });
    } finally {
      setLoggingWater(false);
    }
  };

  const plannerDay = getDietDayKeyFromDate(planner?.date);
  const meals = useMemo(() => {
    if (!diet) return [];
    if (planner?.meals?.length && plannerDay === activeDay) {
      return planner.meals;
    }
    return getDayMeals(diet, activeDay);
  }, [activeDay, diet, planner?.meals, plannerDay]);

  const nutrition = diet?.nutrition ?? planner?.nutrition ?? null;
  const hydration = planner?.hydration ?? nutrition?.water ?? null;
  const quickAdds = planner?.hydrationQuickAddsMl?.length
    ? planner.hydrationQuickAddsMl
    : [250, 500, 750];

  return (
    <>
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
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>AI Diet Planner</Text>
            <Text style={styles.title}>
              {planner?.label || diet?.label || 'Weekly plan'}
            </Text>
            <Text style={styles.muted}>
              {planner?.statusMessage ||
                'View macros, days, regenerate, hydration, and history.'}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => void openHistory()}
            style={styles.historyBtn}
          >
            <Ionicons color={p.lime} name="time-outline" size={16} />
            <Text style={styles.historyBtnText}>History</Text>
          </Pressable>
        </View>

        {status === 'error' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Couldn’t load diet</Text>
            <Text style={styles.muted}>{error}</Text>
            <Pressable onPress={() => void load()} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {status === 'loading' && !diet ? (
          <View style={styles.card}>
            <ActivityIndicator color={p.lime} />
          </View>
        ) : null}

        {status === 'ready' && !diet ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>No active diet yet</Text>
            <Text style={styles.muted}>
              Generate a 7-day AI diet from your transformation and nutrition
              preferences.
            </Text>
            <Pressable
              disabled={generating}
              onPress={() => void onGenerate('create')}
              style={styles.primaryBtn}
            >
              {generating ? (
                <ActivityIndicator color={p.onLime} />
              ) : (
                <Text style={styles.primaryBtnText}>Generate diet</Text>
              )}
            </Pressable>
          </View>
        ) : null}

        {diet ? (
          <>
            <View style={styles.heroCard}>
              <View style={styles.heroTop}>
                <View style={{ flex: 1 }}>
                  <View style={styles.badgeRow}>
                    {diet.version != null ? (
                      <Text style={styles.badge}>v{diet.version}</Text>
                    ) : null}
                    {planner?.phase || diet.phase ? (
                      <Text style={styles.badge}>
                        {planner?.phase || diet.phase}
                      </Text>
                    ) : null}
                    <Text style={styles.badge}>{diet.status || 'ACTIVE'}</Text>
                  </View>
                  <Text style={styles.heroGoal}>{formatGoalLabel(diet.goal)}</Text>
                  <Text style={styles.heroCals}>{diet.dailyCalories} kcal</Text>
                  <Text style={styles.muted}>
                    P {diet.dailyProtein}g
                    {diet.dailyCarbs != null ? ` · C ${diet.dailyCarbs}g` : ''}
                    {diet.dailyFats != null ? ` · F ${diet.dailyFats}g` : ''}
                    {' · '}
                    {diet.durationWeeks} wks
                  </Text>
                </View>
                <Pressable
                  disabled={generating}
                  onPress={() => void onGenerate('regen')}
                  style={styles.refreshBtn}
                >
                  {generating ? (
                    <ActivityIndicator color={p.lime} />
                  ) : (
                    <Ionicons color={p.lime} name="refresh" size={18} />
                  )}
                </Pressable>
              </View>

              <View style={styles.statGrid}>
                <Stat label="Goal" value={formatGoalLabel(diet.goal)} />
                <Stat label="Protein" value={`${diet.dailyProtein}g`} />
                <Stat
                  label="Meals/day"
                  value={String(diet.mealsPerDay || planner?.mealsPerDay || '—')}
                />
                <Stat
                  label="Compliance"
                  value={
                    planner?.dietCompliance != null
                      ? `${Math.round(planner.dietCompliance)}%`
                      : '—'
                  }
                />
              </View>

              <Pressable
                disabled={generating}
                onPress={() => void onGenerate('regen')}
                style={styles.regenRow}
              >
                <Text style={styles.regenText}>
                  {generating ? 'Regenerating…' : 'Regenerate new diet'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Weekly meal plan</Text>
              <Text style={styles.muted}>
                {DIET_DAY_FULL_LABELS[activeDay]}
                {planner?.date ? ` · ${planner.date}` : ''}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dayRow}
              >
                {DIET_DAY_ORDER.map((day) => {
                  const active = day === activeDay;
                  return (
                    <Pressable
                      key={day}
                      onPress={() => void selectDay(day)}
                      style={[styles.dayChip, active && styles.dayChipActive]}
                    >
                      <Text
                        style={[
                          styles.dayChipText,
                          active && styles.dayChipTextActive,
                        ]}
                      >
                        {DIET_DAY_LABELS[day]}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {planner?.swapSuggestion?.message ? (
              <View style={styles.card}>
                <Text style={styles.sectionEyebrow}>Swap suggestion</Text>
                <Text style={styles.muted}>{planner.swapSuggestion.message}</Text>
              </View>
            ) : null}

            {plannerFetching && meals.length === 0 ? (
              <View style={styles.card}>
                <ActivityIndicator color={p.lime} />
              </View>
            ) : meals.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.muted}>
                  No meals for {DIET_DAY_FULL_LABELS[activeDay]}.
                </Text>
              </View>
            ) : (
              meals.map((meal) => (
                <DietMealCard
                  key={meal.id}
                  meal={meal}
                  onReplace={
                    meal.canSwap
                      ? () => navigation.navigate('Meals')
                      : undefined
                  }
                />
              ))
            )}

            {planner?.coachInsight?.message ? (
              <View style={styles.card}>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionEyebrow}>Coach insight</Text>
                  {planner.coachInsight.status ? (
                    <Text style={styles.badge}>
                      {planner.coachInsight.status.replace(/_/g, ' ')}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.cardTitle}>{planner.coachInsight.message}</Text>
                {planner.coachInsight.suggestedAction ? (
                  <Text style={styles.muted}>
                    Suggested: {planner.coachInsight.suggestedAction}
                  </Text>
                ) : null}
              </View>
            ) : null}

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Daily fulfillment</Text>
              {nutrition ? (
                <>
                  <MacroBar
                    label="Calories"
                    progress={nutrition.calories}
                    unit=" kcal"
                  />
                  <MacroBar label="Protein" progress={nutrition.protein} unit="g" />
                  <MacroBar label="Carbs" progress={nutrition.carbs} unit="g" />
                  <MacroBar label="Fats" progress={nutrition.fats} unit="g" />
                </>
              ) : (
                <Text style={styles.muted}>No nutrition summary yet.</Text>
              )}

              {(planner?.mealsPerDay != null ||
                planner?.dietCompliance != null) && (
                <View style={styles.compGrid}>
                  <MiniStat
                    label="Done"
                    value={`${planner?.mealsCompleted ?? 0}/${planner?.mealsPerDay ?? 0}`}
                  />
                  <MiniStat
                    label="Skipped"
                    value={String(planner?.mealsSkipped ?? 0)}
                  />
                  <MiniStat
                    label="Compliance"
                    value={`${Math.round(planner?.dietCompliance ?? 0)}%`}
                  />
                </View>
              )}

              {hydration ? (
                <View style={styles.waterBox}>
                  <Text style={styles.fieldLabel}>Water goal</Text>
                  <Text style={styles.cardTitle}>
                    {(hydration.current / 1000).toFixed(1)} L /{' '}
                    {(hydration.goal / 1000).toFixed(1)} L
                  </Text>
                  <View style={styles.waterRow}>
                    {quickAdds.map((amount) => (
                      <Pressable
                        key={amount}
                        disabled={loggingWater}
                        onPress={() => void onAddWater(amount)}
                        style={styles.waterBtn}
                      >
                        <Text style={styles.waterBtnText}>+{amount}ml</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>

            {planner?.transformation ? (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Transformation</Text>
                <Text style={styles.muted}>
                  {planner.transformation.currentWeightKg != null
                    ? `${planner.transformation.currentWeightKg} kg`
                    : '—'}
                  {' → '}
                  {planner.transformation.targetWeightKg != null
                    ? `${planner.transformation.targetWeightKg} kg`
                    : '—'}
                  {planner.transformation.estimatedWeeks != null
                    ? ` · ${planner.transformation.estimatedWeeks} weeks`
                    : ''}
                </Text>
                <Pressable
                  onPress={() => navigation.navigate('Transformation')}
                  style={styles.secondaryBtn}
                >
                  <Text style={styles.secondaryBtnText}>Open journey</Text>
                </Pressable>
              </View>
            ) : null}

            {diet.grocery?.items?.length ? (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Grocery preview</Text>
                {diet.grocery.estimatedWeeklyCost != null ? (
                  <Text style={styles.muted}>
                    Est. weekly cost: {diet.grocery.currency ?? ''}{' '}
                    {diet.grocery.estimatedWeeklyCost}
                  </Text>
                ) : null}
                {diet.grocery.items.slice(0, 12).map((item, index) => (
                  <View
                    key={item.id ?? `${item.name}-${index}`}
                    style={styles.groceryRow}
                  >
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.muted}>{item.quantity}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.card}>
              <Text style={styles.sectionEyebrow}>Quick actions</Text>
              <View style={styles.actionsRow}>
                <Pressable
                  onPress={() => void openHistory()}
                  style={styles.secondaryBtn}
                >
                  <Text style={styles.secondaryBtnText}>History</Text>
                </Pressable>
                <Pressable
                  onPress={() => navigation.navigate('Meals')}
                  style={styles.secondaryBtn}
                >
                  <Text style={styles.secondaryBtnText}>Log meals</Text>
                </Pressable>
                <Pressable
                  onPress={() => navigation.navigate('Transformation')}
                  style={styles.secondaryBtn}
                >
                  <Text style={styles.secondaryBtnText}>Check-in</Text>
                </Pressable>
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>

      <SideDrawer
        side="right"
        visible={historyOpen}
        onClose={() => setHistoryOpen(false)}
      >
        <View style={styles.drawerHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Diet history</Text>
            <Text style={styles.muted}>Activate or remove archived plans</Text>
          </View>
          <Pressable
            onPress={() => setHistoryOpen(false)}
            style={styles.closeBtn}
          >
            <Ionicons color={p.text} name="close" size={18} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.drawerContent}>
          {historyLoading ? (
            <ActivityIndicator color={p.lime} style={{ marginTop: 24 }} />
          ) : history.length === 0 ? (
            <Text style={styles.muted}>No diet history yet.</Text>
          ) : (
            history.map((item) => {
              const isActive = item.id === diet?.id;
              const busy = activatingId === item.id;
              return (
                <View
                  key={item.id}
                  style={[
                    styles.historyCard,
                    isActive && styles.historyCardActive,
                  ]}
                >
                  <Text style={styles.cardTitle}>
                    {formatGoalLabel(item.goal)} · {item.dailyCalories} kcal
                  </Text>
                  <Text style={styles.muted}>
                    P {item.dailyProtein}g · {item.durationWeeks} wks
                    {item.version != null ? ` · v${item.version}` : ''}
                    {isActive ? ' · Active' : ''}
                  </Text>
                  {!isActive ? (
                    <View style={styles.historyActions}>
                      <Pressable
                        disabled={busy}
                        onPress={() => void onActivate(item.id)}
                        style={styles.secondaryBtn}
                      >
                        {busy ? (
                          <ActivityIndicator color={p.lime} />
                        ) : (
                          <Text style={styles.secondaryBtnText}>Activate</Text>
                        )}
                      </Pressable>
                      <Pressable
                        disabled={busy}
                        onPress={() => void onDelete(item.id)}
                        style={styles.dangerBtn}
                      >
                        <Text style={styles.dangerBtnText}>Delete</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </ScrollView>
      </SideDrawer>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const styles = useFitnessStyles(buildStyles);
  return (
    <View style={styles.statCard}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  const styles = useFitnessStyles(buildStyles);
  return (
    <View style={styles.miniStat}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.cardTitle}>{value}</Text>
    </View>
  );
}

function MacroBar({
  label,
  progress,
  unit,
}: {
  label: string;
  progress: DietMacroProgress;
  unit: string;
}) {
  const p = useFitnessPalette();
  const styles = useFitnessStyles(buildStyles);
  const pct =
    progress.percent ??
    (progress.goal > 0
      ? Math.min(100, Math.round((progress.current / progress.goal) * 100))
      : 0);
  return (
    <View style={styles.macroBlock}>
      <View style={styles.macroHead}>
        <Text style={styles.cardTitle}>{label}</Text>
        <Text style={styles.muted}>
          {Math.round(progress.current)}
          {unit} / {Math.round(progress.goal)}
          {unit}
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.trackFill,
            { width: `${pct}%` as `${number}%`, backgroundColor: p.lime },
          ]}
        />
      </View>
    </View>
  );
}

function DietMealCard({
  meal,
  onReplace,
}: {
  meal: DietMeal;
  onReplace?: () => void;
}) {
  const p = useFitnessPalette();
  const styles = useFitnessStyles(buildStyles);
  return (
    <View style={styles.mealCard}>
      <View style={styles.mealTop}>
        <Text style={styles.mealType}>{DIET_MEAL_LABELS[meal.type]}</Text>
        <Text style={styles.mealCals}>{meal.calories} kcal</Text>
      </View>
      <Text style={styles.cardTitle}>{meal.name}</Text>
      {meal.servingSize ? (
        <Text style={styles.muted}>{meal.servingSize}</Text>
      ) : null}
      {meal.scheduledTime ? (
        <Text style={styles.muted}>{meal.scheduledTime}</Text>
      ) : null}
      <Text style={[styles.muted, { color: p.textMuted }]}>
        P {meal.protein}g · C {meal.carbs}g · F {meal.fats}g
        {meal.status ? ` · ${meal.status}` : ''}
      </Text>
      {onReplace ? (
        <Pressable onPress={onReplace} style={styles.replaceBtn}>
          <Text style={styles.secondaryBtnText}>Replace / log in Meals</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function buildStyles(p: FitnessPalette) {
  return StyleSheet.create({
    content: { gap: 14, padding: 18, paddingBottom: 110 },
    topRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 },
    eyebrow: {
      color: p.lime,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    title: { color: p.text, fontSize: 24, fontWeight: '800' },
    muted: { color: p.textSecondary, fontSize: 13, lineHeight: 18 },
    historyBtn: {
      alignItems: 'center',
      backgroundColor: p.limeDim,
      borderRadius: 999,
      flexDirection: 'row',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    historyBtnText: { color: p.lime, fontSize: 12, fontWeight: '800' },
    card: {
      backgroundColor: p.surface,
      borderColor: p.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 12,
      padding: 16,
    },
    cardTitle: { color: p.text, fontSize: 15, fontWeight: '800' },
    sectionTitle: { color: p.text, fontSize: 16, fontWeight: '800' },
    sectionEyebrow: {
      color: p.lime,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    sectionHead: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    heroCard: {
      backgroundColor: p.surface,
      borderColor: p.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 12,
      padding: 16,
    },
    heroTop: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 },
    badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
    badge: {
      backgroundColor: p.limeDim,
      borderRadius: 999,
      color: p.lime,
      fontSize: 10,
      fontWeight: '800',
      overflow: 'hidden',
      paddingHorizontal: 8,
      paddingVertical: 3,
      textTransform: 'uppercase',
    },
    heroGoal: {
      color: p.limeSoft,
      fontSize: 12,
      fontWeight: '800',
      marginBottom: 6,
      textTransform: 'capitalize',
    },
    heroCals: { color: p.text, fontSize: 28, fontWeight: '800', marginBottom: 4 },
    refreshBtn: {
      alignItems: 'center',
      backgroundColor: p.limeDim,
      borderRadius: 999,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    statCard: {
      backgroundColor: p.surfaceElevated,
      borderRadius: 12,
      flexGrow: 1,
      minWidth: '45%',
      padding: 10,
    },
    statValue: { color: p.text, fontSize: 14, fontWeight: '800', marginTop: 4 },
    regenRow: {
      alignItems: 'center',
      borderColor: p.border,
      borderRadius: 12,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 42,
    },
    regenText: { color: p.lime, fontSize: 13, fontWeight: '800' },
    dayRow: { gap: 8, paddingVertical: 2 },
    dayChip: {
      backgroundColor: p.surfaceElevated,
      borderColor: p.border,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    dayChipActive: { backgroundColor: p.lime, borderColor: p.lime },
    dayChipText: { color: p.textSecondary, fontSize: 12, fontWeight: '700' },
    dayChipTextActive: { color: p.onLime },
    mealCard: {
      backgroundColor: p.surface,
      borderColor: p.border,
      borderRadius: 16,
      borderWidth: 1,
      gap: 6,
      padding: 14,
    },
    mealTop: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    mealType: {
      color: p.lime,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    mealCals: { color: p.textMuted, fontSize: 12, fontWeight: '700' },
    replaceBtn: {
      alignSelf: 'flex-start',
      backgroundColor: p.limeDim,
      borderRadius: 10,
      marginTop: 4,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    macroBlock: { gap: 6 },
    macroHead: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    track: {
      backgroundColor: p.track,
      borderRadius: 999,
      height: 8,
      overflow: 'hidden',
    },
    trackFill: { borderRadius: 999, height: 8 },
    compGrid: { flexDirection: 'row', gap: 8 },
    miniStat: {
      backgroundColor: p.surfaceElevated,
      borderRadius: 12,
      flex: 1,
      gap: 4,
      padding: 10,
    },
    waterBox: {
      backgroundColor: p.surfaceElevated,
      borderRadius: 12,
      gap: 8,
      padding: 12,
    },
    waterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    waterBtn: {
      backgroundColor: p.limeDim,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    waterBtnText: { color: p.hydrate, fontSize: 12, fontWeight: '800' },
    groceryRow: {
      borderTopColor: p.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'space-between',
      paddingVertical: 8,
    },
    actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    fieldLabel: {
      color: p.textMuted,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    primaryBtn: {
      alignItems: 'center',
      backgroundColor: p.lime,
      borderRadius: 14,
      justifyContent: 'center',
      minHeight: 46,
    },
    primaryBtnText: { color: p.onLime, fontSize: 14, fontWeight: '800' },
    secondaryBtn: {
      alignItems: 'center',
      backgroundColor: p.limeDim,
      borderRadius: 10,
      justifyContent: 'center',
      minHeight: 36,
      paddingHorizontal: 12,
    },
    secondaryBtnText: { color: p.lime, fontSize: 12, fontWeight: '800' },
    dangerBtn: {
      alignItems: 'center',
      borderColor: p.border,
      borderRadius: 10,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 36,
      paddingHorizontal: 12,
    },
    dangerBtnText: { color: p.burn, fontSize: 12, fontWeight: '800' },
    drawerHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 12,
      paddingBottom: 12,
      paddingHorizontal: 18,
    },
    closeBtn: {
      alignItems: 'center',
      backgroundColor: p.surfaceElevated,
      borderColor: p.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    drawerContent: { gap: 12, paddingBottom: 28, paddingHorizontal: 18 },
    historyCard: {
      backgroundColor: p.surfaceElevated,
      borderColor: p.border,
      borderRadius: 14,
      borderWidth: 1,
      gap: 8,
      padding: 14,
    },
    historyCardActive: { borderColor: p.lime },
    historyActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  });
}
