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
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import {
  generateTransformation,
  getActiveTransformation,
  getTransformationHistory,
} from '../../api/transformationApi';
import { AppShell } from '../../components/app/AppShell';
import { SideDrawer } from '../../components/app/SideDrawer';
import type { FitnessPalette } from '../../constants/fitnessPalette';
import { useFitnessPalette, useFitnessStyles } from '../../hooks/useFitnessPalette';
import {
  getDailyQuote,
  TRANSFORMATION_TIPS,
} from '../../lib/fitness/transformation/constants';
import type {
  Transformation,
  TransformationHistoryItem,
  TransformationMilestone,
} from '../../types/transformation';
import { getApiErrorMessage } from '../../utils/api';

function formatKg(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return `${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)} kg`;
}

function bmiBadge(bmi: number) {
  if (bmi <= 0) return null;
  if (bmi < 18.5) return { label: 'Underweight', tone: 'warn' as const };
  if (bmi < 25) return { label: 'Healthy', tone: 'ok' as const };
  if (bmi < 30) return { label: 'Overweight', tone: 'warn' as const };
  return { label: 'High', tone: 'bad' as const };
}

function weeklyChange(plan: Transformation) {
  if (
    plan.currentWeightKg <= 0 ||
    plan.targetWeightKg <= 0 ||
    plan.estimatedWeeks <= 0
  ) {
    return '—';
  }
  const weekly = (plan.targetWeightKg - plan.currentWeightKg) / plan.estimatedWeeks;
  const sign = weekly > 0 ? '+' : '';
  return `${sign}${weekly.toFixed(1)} kg / wk`;
}

function focusLabel(plan: Transformation) {
  if (plan.targetPhysique) return plan.targetPhysique;
  if (plan.goal) return plan.goal.replace(/_/g, ' ');
  return 'Your goal';
}

export function TransformationScreen() {
  const p = useFitnessPalette();
  const styles = useFitnessStyles(buildStyles);
  const [plan, setPlan] = useState<Transformation | null>(null);
  const [history, setHistory] = useState<TransformationHistoryItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const quote = useMemo(() => getDailyQuote(), []);

  const load = useCallback(async (mode: 'full' | 'soft' = 'full') => {
    if (mode === 'full') {
      setStatus('loading');
      setError(null);
    } else {
      setRefreshing(true);
    }
    try {
      const [active, historyResponse] = await Promise.all([
        getActiveTransformation(),
        getTransformationHistory({ page: 1, limit: 20 }).catch(() => ({
          items: [] as TransformationHistoryItem[],
        })),
      ]);
      setPlan(active);
      setHistory(historyResponse.items);
      setStatus('ready');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load transformation.'));
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

  const onGenerate = async () => {
    setGenerating(true);
    try {
      const next = await generateTransformation();
      setPlan(next);
      Toast.show({
        type: 'success',
        text1: 'Journey ready',
        text2: `${formatKg(next.currentWeightKg)} → ${formatKg(next.targetWeightKg)}`,
        position: 'bottom',
      });
      await load('soft');
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Generate failed',
        text2: getApiErrorMessage(err, 'Unable to generate plan.'),
        position: 'bottom',
      });
    } finally {
      setGenerating(false);
    }
  };

  const milestones = plan?.milestones ?? [];
  const badge = plan ? bmiBadge(plan.bmi) : null;
  const historyItems = history.filter((item) => item.id !== plan?.id);

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
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>Current focus</Text>
            <Text style={styles.title}>Transformation journey</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setHistoryOpen(true)}
            style={styles.historyBtn}
          >
            <Ionicons color={p.lime} name="time-outline" size={16} />
            <Text style={styles.historyBtnText}>History</Text>
          </Pressable>
        </View>
        <Text style={styles.muted}>
          Roadmap from your fitness profile — weight, body fat, and nutrition
          targets.
        </Text>

        <View style={styles.quoteCard}>
          <View style={styles.quoteHead}>
            <Ionicons color={p.lime} name="chatbubble-ellipses-outline" size={16} />
            <Text style={styles.sectionTitle}>Daily quote</Text>
          </View>
          <Text style={styles.quoteText}>“{quote}”</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.quoteHead}>
            <Ionicons color={p.lime} name="bulb-outline" size={16} />
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Daily Focus</Text>
              <Text style={styles.muted}>
                Recommendations to stay on track this week.
              </Text>
            </View>
          </View>
          {TRANSFORMATION_TIPS.map((tip) => (
            <View key={tip.id} style={styles.tipRow}>
              <View style={styles.tipIcon}>
                <Ionicons color={p.lime} name={tip.icon} size={16} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{tip.title}</Text>
                <Text style={styles.muted}>{tip.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {status === 'error' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Couldn’t load journey</Text>
            <Text style={styles.muted}>{error}</Text>
            <Pressable onPress={() => void load()} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {status === 'loading' && !plan ? (
          <View style={styles.card}>
            <ActivityIndicator color={p.lime} />
          </View>
        ) : null}

        {status === 'ready' && !plan ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>No transformation plan yet</Text>
            <Text style={styles.muted}>
              Generate a journey from your fitness profile to unlock milestones
              and targets.
            </Text>
            <Pressable
              disabled={generating}
              onPress={() => void onGenerate()}
              style={styles.primaryBtn}
            >
              {generating ? (
                <ActivityIndicator color={p.onLime} />
              ) : (
                <Text style={styles.primaryBtnText}>Generate journey</Text>
              )}
            </Pressable>
          </View>
        ) : null}

        {plan ? (
          <>
            <View style={styles.heroCard}>
              <View style={styles.heroTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroFocus}>{focusLabel(plan)}</Text>
                  <View style={styles.weightRow}>
                    <Text style={styles.weightNow}>
                      {formatKg(plan.currentWeightKg)}
                    </Text>
                    <Ionicons color={p.lime} name="arrow-forward" size={18} />
                    <Text style={styles.weightTarget}>
                      {formatKg(plan.targetWeightKg)}
                    </Text>
                  </View>
                  <Text style={styles.muted}>
                    ~{plan.estimatedWeeks} weeks · status {plan.status}
                  </Text>
                </View>
                <Pressable
                  disabled={generating}
                  onPress={() => void onGenerate()}
                  style={styles.refreshBtn}
                >
                  {generating ? (
                    <ActivityIndicator color={p.lime} />
                  ) : (
                    <Ionicons color={p.lime} name="refresh" size={18} />
                  )}
                </Pressable>
              </View>
            </View>

            <View style={styles.metricGrid}>
              <MetricTile
                label="BMI"
                value={plan.bmi > 0 ? plan.bmi.toFixed(1) : '—'}
                badge={badge?.label}
                tone={badge?.tone}
              />
              <MetricTile
                label="BMR"
                value={plan.bmr > 0 ? String(Math.round(plan.bmr)) : '—'}
              />
              <MetricTile
                label="TDEE"
                value={plan.tdee > 0 ? String(Math.round(plan.tdee)) : '—'}
              />
              <MetricTile
                label="Calories"
                value={
                  plan.dailyCalories > 0
                    ? String(Math.round(plan.dailyCalories))
                    : '—'
                }
              />
              <MetricTile
                label="Protein"
                value={
                  plan.dailyProtein > 0
                    ? `${Math.round(plan.dailyProtein)}g`
                    : '—'
                }
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Body composition</Text>
              <View style={styles.compRow}>
                <View style={styles.compBlock}>
                  <Text style={styles.fieldLabel}>Body fat now</Text>
                  <Text style={styles.compValue}>
                    {plan.currentBodyFat != null
                      ? `${plan.currentBodyFat}%`
                      : '—'}
                  </Text>
                </View>
                <View style={styles.compBlock}>
                  <Text style={styles.fieldLabel}>Target body fat</Text>
                  <Text style={[styles.compValue, { color: p.lime }]}>
                    {plan.targetBodyFat != null
                      ? `${plan.targetBodyFat}%`
                      : '—'}
                  </Text>
                </View>
                <View style={styles.compBlock}>
                  <Text style={styles.fieldLabel}>Expected change</Text>
                  <Text style={styles.compValue}>{weeklyChange(plan)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Milestone timeline</Text>
                <Text style={styles.muted}>{plan.estimatedWeeks} weeks</Text>
              </View>
              {milestones.length === 0 ? (
                <Text style={styles.muted}>
                  Milestones appear after generation when weeks are scheduled.
                </Text>
              ) : (
                milestones.map((item) => (
                  <MilestoneRow key={`${item.weekNumber}-${item.id}`} item={item} />
                ))
              )}
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
            <Text style={styles.title}>Journey history</Text>
            <Text style={styles.muted}>Previous transformation plans</Text>
          </View>
          <Pressable
            onPress={() => setHistoryOpen(false)}
            style={styles.closeBtn}
          >
            <Ionicons color={p.text} name="close" size={18} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.drawerContent}>
          {historyItems.length === 0 ? (
            <Text style={styles.muted}>No previous plans yet.</Text>
          ) : (
            historyItems.map((item) => (
              <View key={item.id} style={styles.historyCard}>
                <Text style={styles.cardTitle}>
                  {formatKg(item.currentWeightKg)} →{' '}
                  {formatKg(item.targetWeightKg)}
                </Text>
                <Text style={styles.muted}>
                  {item.estimatedWeeks} weeks · {item.status}
                </Text>
                <Text style={styles.historyDate}>
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString()
                    : ''}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </SideDrawer>
    </AppShell>
  );
}

function MetricTile({
  label,
  value,
  badge,
  tone,
}: {
  label: string;
  value: string;
  badge?: string;
  tone?: 'ok' | 'warn' | 'bad';
}) {
  const p = useFitnessPalette();
  const styles = useFitnessStyles(buildStyles);
  const badgeColor =
    tone === 'ok' ? p.lime : tone === 'bad' ? p.burn : p.active;

  return (
    <View style={styles.metricTile}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {badge ? (
        <Text style={[styles.metricBadge, { color: badgeColor }]}>{badge}</Text>
      ) : null}
    </View>
  );
}

function MilestoneRow({ item }: { item: TransformationMilestone }) {
  const p = useFitnessPalette();
  const styles = useFitnessStyles(buildStyles);
  const done = String(item.status).toLowerCase() === 'completed';
  const skipped = String(item.status).toLowerCase() === 'skipped';

  return (
    <View style={styles.milestoneRow}>
      <View
        style={[
          styles.milestoneDot,
          done && styles.milestoneDotDone,
          skipped && styles.milestoneDotSkip,
        ]}
      >
        <Text
          style={[
            styles.milestoneDotText,
            done && { color: p.onLime },
          ]}
        >
          {item.weekNumber}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>Week {item.weekNumber}</Text>
        <Text style={styles.muted}>
          Target {formatKg(item.targetWeightKg)}
          {item.targetBodyFat != null ? ` · ${item.targetBodyFat}% BF` : ''}
        </Text>
      </View>
      <Text style={styles.milestoneStatus}>{item.status}</Text>
    </View>
  );
}

function buildStyles(p: FitnessPalette) {
  return StyleSheet.create({
    shell: { backgroundColor: p.bg, paddingHorizontal: 0 },
    content: { gap: 14, padding: 18, paddingBottom: 36 },
    topRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 },
    eyebrow: {
      color: p.lime,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    title: { color: p.text, fontSize: 26, fontWeight: '800' },
    muted: { color: p.textSecondary, fontSize: 13, lineHeight: 18 },
    historyBtn: {
      alignItems: 'center',
      backgroundColor: p.limeDim,
      borderRadius: 999,
      flexDirection: 'row',
      gap: 6,
      marginTop: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    historyBtnText: { color: p.lime, fontSize: 12, fontWeight: '800' },
    quoteCard: {
      backgroundColor: p.surface,
      borderColor: p.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 10,
      padding: 16,
    },
    quoteHead: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    quoteText: {
      color: p.text,
      fontSize: 16,
      fontWeight: '600',
      fontStyle: 'italic',
      lineHeight: 24,
    },
    tipRow: {
      borderTopColor: p.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: 12,
      paddingTop: 12,
    },
    tipIcon: {
      alignItems: 'center',
      backgroundColor: p.limeDim,
      borderRadius: 10,
      height: 32,
      justifyContent: 'center',
      width: 32,
    },
    card: {
      backgroundColor: p.surface,
      borderColor: p.border,
      borderRadius: 18,
      borderWidth: 1,
      gap: 12,
      padding: 16,
    },
    cardTitle: { color: p.text, fontSize: 15, fontWeight: '800' },
    heroCard: {
      backgroundColor: p.surface,
      borderColor: p.border,
      borderRadius: 20,
      borderWidth: 1,
      padding: 16,
    },
    heroTop: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 12,
    },
    heroFocus: {
      color: p.limeSoft,
      fontSize: 12,
      fontWeight: '800',
      marginBottom: 8,
      textTransform: 'capitalize',
    },
    weightRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
      marginBottom: 8,
    },
    weightNow: { color: p.text, fontSize: 28, fontWeight: '800' },
    weightTarget: { color: p.lime, fontSize: 28, fontWeight: '800' },
    refreshBtn: {
      alignItems: 'center',
      backgroundColor: p.limeDim,
      borderRadius: 999,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    metricGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    metricTile: {
      backgroundColor: p.surface,
      borderColor: p.border,
      borderRadius: 16,
      borderWidth: 1,
      gap: 4,
      minWidth: '30%',
      padding: 12,
      width: '31%',
      flexGrow: 1,
    },
    metricValue: { color: p.text, fontSize: 18, fontWeight: '800' },
    metricBadge: { fontSize: 11, fontWeight: '700' },
    fieldLabel: {
      color: p.textMuted,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    sectionTitle: { color: p.text, fontSize: 16, fontWeight: '800' },
    sectionHead: {
      alignItems: 'baseline',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    compRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    compBlock: {
      backgroundColor: p.surfaceElevated,
      borderRadius: 12,
      flexGrow: 1,
      gap: 4,
      minWidth: '28%',
      padding: 12,
    },
    compValue: { color: p.text, fontSize: 16, fontWeight: '800' },
    milestoneRow: {
      alignItems: 'center',
      borderTopColor: p.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: 12,
      paddingVertical: 10,
    },
    milestoneDot: {
      alignItems: 'center',
      backgroundColor: p.surfaceElevated,
      borderRadius: 999,
      height: 32,
      justifyContent: 'center',
      width: 32,
    },
    milestoneDotDone: { backgroundColor: p.lime },
    milestoneDotSkip: { backgroundColor: 'rgba(245, 197, 24, 0.25)' },
    milestoneDotText: {
      color: p.textSecondary,
      fontSize: 12,
      fontWeight: '800',
    },
    milestoneStatus: {
      color: p.textMuted,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    primaryBtn: {
      alignItems: 'center',
      backgroundColor: p.lime,
      borderRadius: 14,
      justifyContent: 'center',
      minHeight: 46,
    },
    primaryBtnText: { color: p.onLime, fontSize: 14, fontWeight: '800' },
    drawerHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 18,
      paddingBottom: 12,
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
    drawerContent: { gap: 12, paddingHorizontal: 18, paddingBottom: 28 },
    historyCard: {
      backgroundColor: p.surfaceElevated,
      borderColor: p.border,
      borderRadius: 14,
      borderWidth: 1,
      gap: 4,
      padding: 14,
    },
    historyDate: { color: p.textMuted, fontSize: 11, fontWeight: '600' },
  });
}
