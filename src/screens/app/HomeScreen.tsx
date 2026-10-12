import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  type CompositeNavigationProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';

import { getDailyDashboard } from '../../api/dashboardApi';
import { getHydrationToday, logHydration } from '../../api/hydrationApi';
import { getProfile } from '../../api/profileApi';
import { AppShell } from '../../components/app/AppShell';
import { AchievementsCard } from '../../components/fitness/dashboard/AchievementsCard';
import { ComplianceCard } from '../../components/fitness/dashboard/ComplianceCard';
import { DashboardHeroCard } from '../../components/fitness/dashboard/DashboardHeroCard';
import { MacroSummaryCard } from '../../components/fitness/dashboard/MacroSummaryCard';
import { MealProgressCard } from '../../components/fitness/dashboard/MealProgressCard';
import { QuickActionsCard } from '../../components/fitness/dashboard/QuickActionsCard';
import { TodaysTasksCard } from '../../components/fitness/dashboard/TodaysTasksCard';
import { WaterTrackerCard } from '../../components/fitness/dashboard/WaterTrackerCard';
import { WorkoutProgressCard } from '../../components/fitness/dashboard/WorkoutProgressCard';
import { HomeTopBar } from '../../components/fitness/home/HomeTopBar';
import { fitnessPalette as p } from '../../constants/fitnessPalette';
import { useAuth, useAppDispatch } from '../../hooks';
import { loadSession, saveSession } from '../../services/authSession';
import { userProfileUpdated } from '../../store/slices/authSlice';
import type { AppStackParamList, MainTabParamList } from '../../navigation/types';
import type {
  DailyDashboard,
  DashboardTask,
  DashboardWaterProgress,
  HydrationToday,
} from '../../types/dashboard';
import { getApiErrorMessage } from '../../utils/api';

type HomeNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<AppStackParamList>
>;

function soon(title: string, detail = 'Coming soon on mobile.') {
  Toast.show({
    type: 'info',
    text1: title,
    text2: detail,
    position: 'bottom',
  });
}

export function HomeScreen() {
  const navigation = useNavigation<HomeNavigation>();
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DailyDashboard | null>(null);
  const [hydration, setHydration] = useState<HydrationToday | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingWater, setLoggingWater] = useState(false);
  const hasLoadedRef = useRef(false);

  const firstName = useMemo(() => {
    const name = user?.name?.trim();
    if (name) return name.split(/\s+/)[0] || name;
    const email = user?.email?.trim();
    if (email?.includes('@')) return email.split('@')[0] || 'there';
    return email || 'there';
  }, [user?.email, user?.name]);

  const load = useCallback(async (mode: 'full' | 'soft' = 'full') => {
    if (mode === 'full') {
      setStatus('loading');
      setError(null);
    } else {
      setRefreshing(true);
    }

    try {
      const [dash, water, profile] = await Promise.all([
        getDailyDashboard(),
        getHydrationToday().catch(() => null),
        getProfile().catch(() => null),
      ]);
      setDashboard(dash);
      setHydration(water);
      if (profile) {
        const nextName = profile.name.trim() || null;
        const nextAvatar = profile.avatar;
        dispatch(
          userProfileUpdated({
            ...(nextName ? { name: nextName } : {}),
            avatar: nextAvatar,
          }),
        );
        const session = await loadSession();
        if (session) {
          await saveSession({
            ...session,
            user: {
              ...session.user,
              ...(nextName ? { name: nextName } : {}),
              avatar: nextAvatar,
            },
          });
        }
      }
      setStatus('ready');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load dashboard.'));
      if (mode === 'full') setStatus('error');
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      // Soft refresh keeps the cached UI; only data is reloaded.
      void load(hasLoadedRef.current ? 'soft' : 'full').then(() => {
        hasLoadedRef.current = true;
      });
    }, [load]),
  );

  const water: DashboardWaterProgress = useMemo(() => {
    if (hydration) {
      return {
        currentMl: hydration.amountMl,
        goalMl: hydration.goalMl,
        targetMl: hydration.goalMl,
        remainingMl: hydration.remainingMl,
        percent: hydration.percent,
      };
    }
    return (
      dashboard?.water ?? {
        currentMl: 0,
        goalMl: 3500,
        targetMl: 3500,
        remainingMl: 3500,
        percent: 0,
      }
    );
  }, [dashboard?.water, hydration]);

  const onAddWater = async (amountMl: number) => {
    setLoggingWater(true);
    try {
      const next = await logHydration(amountMl);
      setHydration(next);
      Toast.show({
        type: 'success',
        text1: `Added ${amountMl}ml`,
        position: 'bottom',
      });
      void load('soft');
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Water log failed',
        text2: getApiErrorMessage(err, 'Unable to log water.'),
        position: 'bottom',
      });
    } finally {
      setLoggingWater(false);
    }
  };

  const onTaskPress = (task: DashboardTask) => {
    if (task.category === 'meals' || task.category === 'macros') {
      navigation.navigate('Meals');
      return;
    }
    if (task.category === 'workout') {
      navigation.navigate('Workout');
      return;
    }
    soon('Hydration', 'Use the +ml buttons above to log water.');
  };

  const onQuickAction = (
    key:
      | 'meals'
      | 'workout'
      | 'diet'
      | 'progress'
      | 'transformation'
      | 'hydration',
  ) => {
    if (key === 'meals' || key === 'diet') {
      navigation.navigate('Meals');
      return;
    }
    if (key === 'workout') {
      navigation.navigate('Workout');
      return;
    }
    if (key === 'hydration') {
      soon('Hydration', 'Use the water tracker on this screen.');
      return;
    }
    if (key === 'progress') {
      soon('Progress');
      return;
    }
    soon('Transformation');
  };

  return (
    <AppShell backgroundColor={p.bg} contentStyle={styles.shellContent} hideHeader>
      <View style={styles.root}>
        <LinearGradient
          colors={['rgba(200,255,0,0.14)', 'rgba(7,20,15,0)']}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={styles.glow}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={p.lime}
              onRefresh={() => void load('soft')}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <HomeTopBar
            avatar={user?.avatar}
            email={user?.email}
            firstName={firstName}
            onAvatarPress={() => navigation.navigate('Profile')}
            onBellPress={() => soon('Notifications')}
            onStreakPress={() =>
              soon(
                'Streak',
                dashboard?.currentStreak != null
                  ? `${dashboard.currentStreak}-day streak`
                  : 'Streak builds as you stay compliant.',
              )
            }
          />

          {status === 'error' && !dashboard ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Couldn’t load dashboard</Text>
              <Text style={styles.muted}>{error}</Text>
              <Pressable
                onPress={() => void load('full')}
                style={styles.retryBtn}
              >
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : null}

          {status === 'loading' && !dashboard ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={p.lime} />
              <Text style={styles.muted}>Loading today’s dashboard…</Text>
            </View>
          ) : null}

          {dashboard ? (
            <>
              <DashboardHeroCard
                compliancePercent={dashboard.compliance}
                dateLabel={dashboard.date}
                refreshing={refreshing}
                score={dashboard.todayScore}
                streakDays={dashboard.currentStreak}
                onRefresh={() => void load('soft')}
              />

              <MealProgressCard
                meals={dashboard.meals}
                onOpen={() => navigation.navigate('Meals')}
              />
              <WorkoutProgressCard
                workout={dashboard.workout}
                onOpen={() => navigation.navigate('Workout')}
              />
              <WaterTrackerCard
                isLogging={loggingWater}
                water={water}
                onAdd={(amount) => void onAddWater(amount)}
              />

              <MacroSummaryCard
                calories={dashboard.calories}
                protein={dashboard.protein}
              />
              <ComplianceCard
                breakdown={dashboard.breakdown}
                compliancePercent={dashboard.compliance}
                longestStreak={dashboard.longestStreak}
                streakDays={dashboard.currentStreak}
              />
              <TodaysTasksCard
                tasks={dashboard.tasks}
                onTaskPress={onTaskPress}
              />
              <QuickActionsCard onAction={onQuickAction} />
              <AchievementsCard achievements={dashboard.achievements} />
            </>
          ) : null}

          {status === 'ready' && !dashboard ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>No dashboard data yet</Text>
              <Text style={styles.muted}>
                Finish setup and generate a meal/workout plan to unlock today’s
                score.
              </Text>
              <Pressable
                onPress={() => navigation.navigate('Meals')}
                style={styles.retryBtn}
              >
                <Text style={styles.retryText}>Go to Meals</Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  shellContent: {
    backgroundColor: p.bg,
    paddingHorizontal: 0,
  },
  root: {
    backgroundColor: p.bg,
    flex: 1,
  },
  glow: {
    height: 220,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  scrollContent: {
    gap: 14,
    paddingBottom: 36,
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  muted: {
    color: p.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  errorCard: {
    backgroundColor: p.surface,
    borderColor: p.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  errorTitle: {
    color: p.text,
    fontSize: 16,
    fontWeight: '800',
  },
  retryBtn: {
    alignItems: 'center',
    backgroundColor: p.lime,
    borderRadius: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  retryText: {
    color: p.onLime,
    fontSize: 14,
    fontWeight: '800',
  },
  loadingCard: {
    alignItems: 'center',
    backgroundColor: p.surface,
    borderColor: p.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 24,
  },
});
