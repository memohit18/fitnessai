import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

import { uploadImage } from '../../api/imagesApi';
import {
  completeWorkoutExercise,
  endWorkoutSession,
  generateWorkoutPlan,
  getActiveWorkoutSession,
  getTodayWorkout,
  logWorkoutSet,
  pauseWorkoutSession,
  replaceWorkoutExercise,
  resumeWorkoutSession,
  startWorkoutSession,
  updateExerciseImage,
} from '../../api/workoutApi';
import { AppShell } from '../../components/app/AppShell';
import { ImageUploadThumb } from '../../components/fitness/ImageUploadThumb';
import type { FitnessPalette } from '../../constants/fitnessPalette';
import { useFitnessPalette, useFitnessStyles } from '../../hooks/useFitnessPalette';
import {
  computeElapsedSeconds,
  formatClock,
  mergeSessionExercises,
} from '../../lib/fitness/workoutResponse';
import type {
  WorkoutDay,
  WorkoutExercise,
  WorkoutSession,
  WorkoutSessionStatus,
} from '../../types/fitness';
import { getApiErrorMessage } from '../../utils/api';

function mapStatus(raw?: string | null): WorkoutSessionStatus {
  const status = (raw ?? '').toLowerCase();
  if (status === 'paused') return 'paused';
  if (status === 'completed' || status === 'finished' || status === 'ended') {
    return 'finished';
  }
  if (status === 'active' || status === 'in_progress' || status === 'started') {
    return 'active';
  }
  return 'idle';
}

function parseTargetReps(value: string | number | null | undefined) {
  if (value == null) return 10;
  if (typeof value === 'number') return value;
  const match = String(value).match(/\d+/);
  return match ? Number(match[0]) : 10;
}

function sessionVolumeKg(exercises: WorkoutExercise[]) {
  return exercises.reduce((total, exercise) => {
    return (
      total +
      exercise.loggedSets.reduce((sum, set) => {
        const reps = set.reps ?? 0;
        const weight = set.weightKg ?? 0;
        return sum + reps * weight;
      }, 0)
    );
  }, 0);
}

function estimateCalories(elapsedSeconds: number, volumeKg: number) {
  const fromTime = Math.round(elapsedSeconds / 60) * 6;
  const fromVolume = Math.round(volumeKg / 40);
  return Math.max(0, fromTime + fromVolume);
}

function applySessionTiming(session: WorkoutSession | null | undefined) {
  if (!session) return 0;
  return computeElapsedSeconds({
    startedAt: session.startedAt,
    createdAt: session.createdAt,
    pausedAt: session.pausedAt,
    completedAt: session.completedAt,
    totalPausedSeconds: session.totalPausedSeconds,
    elapsedSeconds: session.elapsedSeconds,
    durationSeconds: session.durationSeconds,
    durationMinutes: session.durationMinutes,
  });
}

export function WorkoutScreen() {
  const p = useFitnessPalette();
  const styles = useFitnessStyles(buildStyles);
  const [today, setToday] = useState<WorkoutDay | null>(null);
  const [sessionExercises, setSessionExercises] = useState<WorkoutExercise[]>(
    [],
  );
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] =
    useState<WorkoutSessionStatus>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restSecondsLeft, setRestSecondsLeft] = useState(0);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [swapExerciseId, setSwapExerciseId] = useState<string | null>(null);
  const [sessionMeta, setSessionMeta] = useState<WorkoutSession | null>(null);
  const hasLoadedRef = useRef(false);

  const hydrateSession = useCallback((session: WorkoutSession | null) => {
    if (!session?.sessionId) {
      setSessionId(null);
      setSessionStatus('idle');
      setElapsedSeconds(0);
      setSessionExercises([]);
      setSessionMeta(null);
      setActiveExerciseId(null);
      return;
    }
    const mapped = mapStatus(session.status);
    setSessionId(session.sessionId);
    setSessionStatus(mapped);
    setElapsedSeconds(applySessionTiming(session));
    setSessionExercises(session.exercises ?? []);
    setSessionMeta(session);
  }, []);

  const exercises = useMemo(
    () => mergeSessionExercises(today?.exercises ?? [], sessionExercises),
    [sessionExercises, today?.exercises],
  );

  const activeExercise =
    exercises.find((item) => item.id === activeExerciseId) ??
    exercises.find(
      (item) => !item.completed && !item.skipped && !item.replaced,
    ) ??
    null;

  const upcoming = exercises.filter(
    (item) =>
      item.id !== activeExercise?.id &&
      !item.completed &&
      !item.skipped &&
      !item.replaced,
  );
  const finished = exercises.filter(
    (item) => item.completed || item.skipped || item.replaced,
  );

  const volumeKg = useMemo(() => {
    const fromApi =
      sessionMeta?.volumeKg ??
      sessionMeta?.workoutVolume ??
      sessionMeta?.analytics?.volumeKg ??
      sessionMeta?.analytics?.workoutVolume;
    if (fromApi != null && fromApi > 0) return fromApi;
    return sessionVolumeKg(exercises);
  }, [exercises, sessionMeta]);
  const caloriesBurned =
    sessionMeta?.caloriesBurned ??
    sessionMeta?.analytics?.caloriesBurned ??
    estimateCalories(elapsedSeconds, volumeKg);
  const setsCompleted =
    sessionMeta?.setsCompleted ??
    sessionMeta?.analytics?.setsCompleted ??
    exercises.reduce(
      (sum, item) => sum + item.loggedSets.filter((set) => set.completed).length,
      0,
    );
  const setsPlanned =
    sessionMeta?.setsPlanned ??
    sessionMeta?.analytics?.setsPlanned ??
    exercises.reduce((sum, item) => sum + item.targetSets, 0);
  const completionPercent =
    sessionMeta?.completionPercent ??
    sessionMeta?.analytics?.completionPercent ??
    (exercises.length
      ? Math.round((finished.length / exercises.length) * 100)
      : 0);
  const restTarget = activeExercise?.restSeconds ?? 90;
  const sessionLive = sessionStatus === 'active' || sessionStatus === 'paused';
  const focusLabel =
    today?.focus || today?.label || 'Training day';

  const load = useCallback(async (mode: 'full' | 'soft' = 'full') => {
    if (mode === 'full') {
      setStatus('loading');
      setError(null);
    } else {
      setRefreshing(true);
    }
    try {
      const [workout, activeSession] = await Promise.all([
        getTodayWorkout(),
        getActiveWorkoutSession().catch(() => null),
      ]);
      setToday(workout);
      if (activeSession?.sessionId) {
        const mapped = mapStatus(activeSession.status);
        if (mapped === 'active' || mapped === 'paused') {
          hydrateSession(activeSession);
          const firstOpen =
            (activeSession.exercises ?? workout?.exercises ?? []).find(
              (item) => !item.completed && !item.skipped && !item.replaced,
            ) ?? null;
          setActiveExerciseId(firstOpen?.id ?? null);
        } else if (mode === 'full') {
          hydrateSession(null);
          setRestSecondsLeft(0);
        }
      } else if (mode === 'full') {
        hydrateSession(null);
        setRestSecondsLeft(0);
      }
      setStatus('ready');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load workout.'));
      if (mode === 'full') setStatus('error');
    } finally {
      setRefreshing(false);
    }
  }, [hydrateSession]);

  useFocusEffect(
    useCallback(() => {
      void load(hasLoadedRef.current ? 'soft' : 'full').then(() => {
        hasLoadedRef.current = true;
      });
    }, [load]),
  );

  useEffect(() => {
    if (sessionStatus !== 'active') return;
    const timer = setInterval(() => {
      setElapsedSeconds((value) => value + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionStatus]);

  useEffect(() => {
    if (restSecondsLeft <= 0 || sessionStatus !== 'active') return;
    const timer = setInterval(() => {
      setRestSecondsLeft((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [restSecondsLeft, sessionStatus]);

  const refreshLive = useCallback(async () => {
    const [workout, activeSession] = await Promise.all([
      getTodayWorkout(),
      getActiveWorkoutSession().catch(() => null),
    ]);
    setToday(workout);
    if (activeSession?.sessionId) {
      const mapped = mapStatus(activeSession.status);
      if (mapped === 'active' || mapped === 'paused') {
        hydrateSession(activeSession);
      }
    }
  }, [hydrateSession]);

  const onGenerate = async () => {
    setGenerating(true);
    try {
      await generateWorkoutPlan();
      Toast.show({
        type: 'success',
        text1: 'Workout plan ready',
        text2: 'Loading today’s session…',
        position: 'bottom',
      });
      await load();
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Generate failed',
        text2: getApiErrorMessage(err, 'Unable to generate workout.'),
        position: 'bottom',
      });
    } finally {
      setGenerating(false);
    }
  };

  const onStart = async () => {
    if (!today) return;
    setBusy(true);
    try {
      const session = await startWorkoutSession(today.id);
      hydrateSession(session);
      setRestSecondsLeft(0);
      const merged = mergeSessionExercises(
        today.exercises,
        session.exercises ?? [],
      );
      const first =
        merged.find(
          (item) => !item.completed && !item.skipped && !item.replaced,
        ) ??
        merged[0] ??
        null;
      setActiveExerciseId(first?.id ?? null);
      Toast.show({
        type: 'success',
        text1: session.resumed ? 'Session resumed' : 'Session started',
        text2: first
          ? `${first.name} · ${formatClock(applySessionTiming(session))}`
          : formatClock(applySessionTiming(session)),
        position: 'bottom',
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Start failed',
        text2: getApiErrorMessage(err, 'Unable to start session.'),
        position: 'bottom',
      });
    } finally {
      setBusy(false);
    }
  };

  const onPause = async () => {
    if (!sessionId) return;
    setBusy(true);
    try {
      const session = await pauseWorkoutSession(sessionId);
      if (session) {
        hydrateSession(session);
      } else {
        setSessionStatus('paused');
      }
      Toast.show({ type: 'info', text1: 'Workout paused', position: 'bottom' });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Pause failed',
        text2: getApiErrorMessage(err, 'Unable to pause.'),
        position: 'bottom',
      });
    } finally {
      setBusy(false);
    }
  };

  const onResume = async () => {
    if (!sessionId) return;
    setBusy(true);
    try {
      const session = await resumeWorkoutSession(sessionId);
      if (session) {
        hydrateSession(session);
      } else {
        setSessionStatus('active');
      }
      Toast.show({
        type: 'success',
        text1: 'Workout resumed',
        text2: session
          ? `Continuing from ${formatClock(applySessionTiming(session))}`
          : undefined,
        position: 'bottom',
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Resume failed',
        text2: getApiErrorMessage(err, 'Unable to resume.'),
        position: 'bottom',
      });
    } finally {
      setBusy(false);
    }
  };

  const onFinish = async () => {
    if (!sessionId) return;
    setBusy(true);
    try {
      await endWorkoutSession(sessionId, {
        force: true,
        caloriesBurned:
          typeof caloriesBurned === 'number' ? caloriesBurned : undefined,
      });
      setSessionStatus('finished');
      setRestSecondsLeft(0);
      setActiveExerciseId(null);
      setSwapExerciseId(null);
      setSessionMeta(null);
      Toast.show({
        type: 'success',
        text1: 'Workout finished',
        position: 'bottom',
      });
      await load('soft');
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Finish failed',
        text2: getApiErrorMessage(err, 'Unable to finish workout.'),
        position: 'bottom',
      });
    } finally {
      setBusy(false);
    }
  };

  const advanceToNext = (currentId: string) => {
    const next = exercises.find(
      (item) =>
        item.id !== currentId &&
        !item.completed &&
        !item.skipped &&
        !item.replaced,
    );
    setActiveExerciseId(next?.id ?? null);
    setSwapExerciseId(null);
  };

  const onLogSet = async (
    exercise: WorkoutExercise,
    values: { reps: number; weight: number },
  ) => {
    if (!sessionId) {
      Toast.show({
        type: 'error',
        text1: 'Start the workout first',
        position: 'bottom',
      });
      return;
    }
    setBusy(true);
    try {
      await logWorkoutSet({
        exerciseId: exercise.id,
        sessionId,
        reps: values.reps,
        weight: values.weight,
        setNumber: exercise.loggedSets.length + 1,
        restSeconds: exercise.restSeconds,
      });
      if (exercise.restSeconds > 0) {
        setRestSecondsLeft(exercise.restSeconds);
      }
      setActiveExerciseId(exercise.id);
      Toast.show({
        type: 'success',
        text1: `Set ${exercise.loggedSets.length + 1} logged`,
        text2:
          exercise.restSeconds > 0
            ? `Rest ${formatClock(exercise.restSeconds)}`
            : undefined,
        position: 'bottom',
      });
      await refreshLive();
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Log failed',
        text2: getApiErrorMessage(err, 'Unable to log set.'),
        position: 'bottom',
      });
    } finally {
      setBusy(false);
    }
  };

  const onCompleteExercise = async (
    exercise: WorkoutExercise,
    skipped = false,
  ) => {
    setBusy(true);
    try {
      await completeWorkoutExercise({
        exerciseId: exercise.id,
        sessionId: sessionId ?? undefined,
        skip: skipped,
      });
      Toast.show({
        type: 'success',
        text1: skipped ? `${exercise.name} skipped` : `${exercise.name} done`,
        position: 'bottom',
      });
      if (!skipped && exercise.restSeconds > 0) {
        setRestSecondsLeft(exercise.restSeconds);
      }
      advanceToNext(exercise.id);
      await refreshLive();
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Update failed',
        text2: getApiErrorMessage(err, 'Unable to update exercise.'),
        position: 'bottom',
      });
    } finally {
      setBusy(false);
    }
  };

  const onReplaceExercise = async (
    exercise: WorkoutExercise,
    replacementName: string,
  ) => {
    if (!sessionId) {
      Toast.show({
        type: 'error',
        text1: 'Start the workout first',
        position: 'bottom',
      });
      return;
    }
    const name = replacementName.trim();
    if (!name) {
      Toast.show({
        type: 'error',
        text1: 'Enter what you did instead',
        position: 'bottom',
      });
      return;
    }
    setBusy(true);
    try {
      await replaceWorkoutExercise({
        exerciseId: exercise.id,
        sessionId,
        replacementName: name,
      });
      Toast.show({
        type: 'success',
        text1: `Logged as ${name}`,
        text2: `Instead of ${exercise.name}`,
        position: 'bottom',
      });
      advanceToNext(exercise.id);
      await refreshLive();
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Replace failed',
        text2: getApiErrorMessage(err, 'Unable to replace exercise.'),
        position: 'bottom',
      });
    } finally {
      setBusy(false);
    }
  };

  const onUploadExerciseImage = async (
    exercise: WorkoutExercise,
    prepared: { uri: string; fileName: string; mimeType: string },
  ) => {
    const { url } = await uploadImage({
      uri: prepared.uri,
      fileName: prepared.fileName,
      mimeType: prepared.mimeType,
      type: 'workout',
    });

    const attachId = exercise.exerciseId || exercise.id;
    await updateExerciseImage(attachId, url);

    setToday((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((item) =>
          item.id === exercise.id ? { ...item, imageUrl: url } : item,
        ),
      };
    });

    return url;
  };

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
        <View style={styles.topMeta}>
          <View style={styles.activePill}>
            <View style={styles.activeDot} />
            <Text style={styles.activePillText}>
              {sessionLive ? 'Active today' : 'Workout tracking'}
            </Text>
          </View>
        </View>

        <View style={styles.titleRow}>
          <View style={styles.titleCopy}>
            <Text style={styles.eyebrow}>
              Workout · {focusLabel}
            </Text>
            <Text style={styles.title}>Today’s session</Text>
          </View>
          {sessionLive ? (
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>Live</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons color={p.lime} name="time-outline" size={14} />
            <Text style={styles.statText}>
              {formatClock(elapsedSeconds)} elapsed
            </Text>
          </View>
          {today?.estimatedMinutes ? (
            <View style={styles.statItem}>
              <View style={styles.statBullet} />
              <Text style={styles.statText}>
                {today.estimatedMinutes}m est. goal
              </Text>
            </View>
          ) : null}
          <View style={styles.statItem}>
            <Ionicons color={p.active} name="flame-outline" size={14} />
            <Text style={[styles.statText, styles.statBurn]}>
              {Math.round(Number(caloriesBurned) || 0)} kcal burn
            </Text>
          </View>
          {sessionLive ? (
            <View style={styles.statItem}>
              <Ionicons color={p.hydrate} name="barbell-outline" size={14} />
              <Text style={styles.statText}>
                {setsCompleted}/{setsPlanned || '—'} sets · {completionPercent}%
              </Text>
            </View>
          ) : null}
        </View>

        {status === 'error' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Couldn’t load workout</Text>
            <Text style={styles.muted}>{error}</Text>
            <Pressable onPress={() => void load()} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {status === 'ready' && !today ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>No workout plan yet</Text>
            <Text style={styles.muted}>
              Generate an AI plan to unlock today’s exercises.
            </Text>
            <Pressable
              disabled={generating}
              onPress={() => void onGenerate()}
              style={styles.primaryBtn}
            >
              {generating ? (
                <ActivityIndicator color={p.onLime} />
              ) : (
                <Text style={styles.primaryBtnText}>Generate workout plan</Text>
              )}
            </Pressable>
          </View>
        ) : null}

        {today ? (
          <>
            <SessionPanel
              busy={busy}
              completionPercent={completionPercent}
              elapsedSeconds={elapsedSeconds}
              restTarget={restTarget}
              sessionStatus={sessionStatus}
              setsCompleted={setsCompleted}
              setsPlanned={setsPlanned}
              volumeKg={volumeKg}
              onFinish={() => void onFinish()}
              onPause={() => void onPause()}
              onResume={() => void onResume()}
              onStart={() => void onStart()}
            />

            {restSecondsLeft > 0 && sessionStatus === 'active' ? (
              <View style={styles.restCard}>
                <View>
                  <Text style={styles.sectionLabel}>Rest timer</Text>
                  <Text style={styles.bigClock}>
                    {formatClock(restSecondsLeft)}
                  </Text>
                  {activeExercise ? (
                    <Text style={styles.muted}>
                      Next up: {activeExercise.name}
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  onPress={() => setRestSecondsLeft(0)}
                  style={styles.ghostBtn}
                >
                  <Text style={styles.ghostBtnText}>Skip rest</Text>
                </Pressable>
              </View>
            ) : null}

            {sessionLive && activeExercise ? (
              <>
                <View style={styles.nowBanner}>
                  <Text style={styles.nowBannerLabel}>Now doing</Text>
                  <View style={styles.tagPill}>
                    <Text style={styles.tagPillText}>Primary</Text>
                  </View>
                </View>
                <View style={styles.nowCopy}>
                  <Text style={styles.nowTitle}>{activeExercise.name}</Text>
                  <Text style={styles.muted}>
                    Set {Math.min(activeExercise.loggedSets.length + 1, activeExercise.targetSets)}{' '}
                    of {activeExercise.targetSets}
                    {activeExercise.targetReps != null
                      ? ` · ${activeExercise.targetReps} reps`
                      : ''}
                    {activeExercise.restSeconds
                      ? ` · ${activeExercise.restSeconds}s rest interval`
                      : ''}
                  </Text>
                </View>

                <ActiveExerciseCard
                  busy={busy}
                  disabled={sessionStatus === 'paused'}
                  exercise={activeExercise}
                  index={exercises.findIndex((item) => item.id === activeExercise.id)}
                  showSwap={swapExerciseId === activeExercise.id}
                  onComplete={() => void onCompleteExercise(activeExercise, false)}
                  onLogSet={(values) => void onLogSet(activeExercise, values)}
                  onReplace={(name) => void onReplaceExercise(activeExercise, name)}
                  onSkip={() => void onCompleteExercise(activeExercise, true)}
                  onToggleSwap={() =>
                    setSwapExerciseId((current) =>
                      current === activeExercise.id ? null : activeExercise.id,
                    )
                  }
                  onUpload={(prepared) =>
                    onUploadExerciseImage(activeExercise, prepared)
                  }
                />
              </>
            ) : null}

            {upcoming.length > 0 ? (
              <View style={styles.upcomingHead}>
                <Text style={styles.upcomingTitle}>Upcoming exercises</Text>
                <Text style={styles.upcomingCount}>
                  {upcoming.length} remaining
                </Text>
              </View>
            ) : null}

            {upcoming.map((exercise) => {
              const index = exercises.findIndex((item) => item.id === exercise.id);
              return (
                <UpcomingExerciseCard
                  key={exercise.id}
                  busy={busy}
                  disabled={!sessionLive || sessionStatus === 'paused'}
                  exercise={exercise}
                  index={index}
                  showSwap={swapExerciseId === exercise.id}
                  onSelect={() => setActiveExerciseId(exercise.id)}
                  onReplace={(name) => void onReplaceExercise(exercise, name)}
                  onToggleSwap={() =>
                    setSwapExerciseId((current) =>
                      current === exercise.id ? null : exercise.id,
                    )
                  }
                  onUpload={(prepared) =>
                    onUploadExerciseImage(exercise, prepared)
                  }
                />
              );
            })}

            {finished.length > 0 ? (
              <View style={styles.upcomingHead}>
                <Text style={styles.upcomingTitle}>Completed</Text>
                <Text style={styles.upcomingCount}>{finished.length}</Text>
              </View>
            ) : null}

            {finished.map((exercise) => {
              const index = exercises.findIndex((item) => item.id === exercise.id);
              return (
                <UpcomingExerciseCard
                  key={exercise.id}
                  busy={busy}
                  disabled
                  exercise={exercise}
                  index={index}
                  showSwap={false}
                  onSelect={() => undefined}
                  onReplace={() => undefined}
                  onToggleSwap={() => undefined}
                  onUpload={(prepared) =>
                    onUploadExerciseImage(exercise, prepared)
                  }
                />
              );
            })}
          </>
        ) : null}
      </ScrollView>
    </AppShell>
  );
}

function SessionPanel({
  sessionStatus,
  elapsedSeconds,
  volumeKg,
  restTarget,
  setsCompleted,
  setsPlanned,
  completionPercent,
  busy,
  onStart,
  onPause,
  onResume,
  onFinish,
}: {
  sessionStatus: WorkoutSessionStatus;
  elapsedSeconds: number;
  volumeKg: number;
  restTarget: number;
  setsCompleted: number;
  setsPlanned: number;
  completionPercent: number;
  busy: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
}) {
  const p = useFitnessPalette();
  const styles = useFitnessStyles(buildStyles);

  if (sessionStatus === 'idle' || sessionStatus === 'finished') {
    return (
      <Pressable disabled={busy} onPress={onStart} style={styles.primaryBtn}>
        {busy ? (
          <ActivityIndicator color={p.onLime} />
        ) : (
          <View style={styles.btnInner}>
            <Ionicons color={p.onLime} name="play" size={16} />
            <Text style={styles.primaryBtnText}>
              {sessionStatus === 'finished' ? 'Start new session' : 'Start workout'}
            </Text>
          </View>
        )}
      </Pressable>
    );
  }

  return (
    <View style={styles.sessionCard}>
      <View style={styles.sessionTop}>
        <View>
          <Text style={styles.sectionLabel}>
            {sessionStatus === 'paused' ? 'Paused' : 'In progress'}
          </Text>
          <Text style={styles.bigClock}>{formatClock(elapsedSeconds)}</Text>
        </View>
        <View style={styles.sessionActions}>
          {sessionStatus === 'active' ? (
            <Pressable disabled={busy} onPress={onPause} style={styles.ghostBtn}>
              <Ionicons color={p.text} name="pause" size={14} />
              <Text style={styles.ghostBtnText}>Pause</Text>
            </Pressable>
          ) : (
            <Pressable
              disabled={busy}
              onPress={onResume}
              style={styles.primaryBtnCompact}
            >
              <Ionicons color={p.onLime} name="play" size={14} />
              <Text style={styles.primaryBtnText}>Resume</Text>
            </Pressable>
          )}
          <Pressable disabled={busy} onPress={onFinish} style={styles.finishBtn}>
            <Ionicons color={p.onLime} name="checkmark" size={14} />
            <Text style={styles.primaryBtnText}>Finish</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.sessionMetrics}>
        <View style={styles.metricBlock}>
          <View style={styles.metricIcon}>
            <Ionicons color={p.lime} name="speedometer-outline" size={16} />
          </View>
          <View>
            <Text style={styles.metricLabel}>Pace & volume</Text>
            <Text style={styles.metricValue}>
              {Math.round(volumeKg)} kg total
            </Text>
          </View>
        </View>
        <View style={styles.metricBlock}>
          <View style={styles.metricIcon}>
            <Ionicons color={p.hydrate} name="hourglass-outline" size={16} />
          </View>
          <View>
            <Text style={styles.metricLabel}>Rest target</Text>
            <Text style={styles.metricValue}>{restTarget}s auto</Text>
          </View>
        </View>
      </View>
      <View style={styles.sessionMetrics}>
        <View style={styles.metricBlock}>
          <View style={styles.metricIcon}>
            <Ionicons color={p.limeSoft} name="checkmark-circle-outline" size={16} />
          </View>
          <View>
            <Text style={styles.metricLabel}>Sets logged</Text>
            <Text style={styles.metricValue}>
              {setsCompleted}/{setsPlanned || '—'}
            </Text>
          </View>
        </View>
        <View style={styles.metricBlock}>
          <View style={styles.metricIcon}>
            <Ionicons color={p.active} name="pie-chart-outline" size={16} />
          </View>
          <View>
            <Text style={styles.metricLabel}>Completion</Text>
            <Text style={styles.metricValue}>{completionPercent}%</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function StepperField({
  label,
  value,
  onChange,
  step,
  min,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  step: number;
  min: number;
  disabled?: boolean;
}) {
  const p = useFitnessPalette();
  const styles = useFitnessStyles(buildStyles);
  return (
    <View style={styles.stepperField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable
          disabled={disabled}
          onPress={() => onChange(Math.max(min, value - step))}
          style={styles.stepperBtn}
        >
          <Ionicons color={p.text} name="remove" size={18} />
        </Pressable>
        <Text style={styles.stepperValue}>{value}</Text>
        <Pressable
          disabled={disabled}
          onPress={() => onChange(value + step)}
          style={styles.stepperBtn}
        >
          <Ionicons color={p.text} name="add" size={18} />
        </Pressable>
      </View>
    </View>
  );
}

function SetStepper({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const styles = useFitnessStyles(buildStyles);
  const count = Math.max(total, 1);
  return (
    <View style={styles.setTrack}>
      {Array.from({ length: count }, (_, index) => {
        const setNumber = index + 1;
        const active = setNumber === current;
        const done = setNumber < current;
        return (
          <View key={setNumber} style={styles.setNodeWrap}>
            <View
              style={[
                styles.setNode,
                active && styles.setNodeActive,
                done && styles.setNodeDone,
              ]}
            >
              <Text
                style={[
                  styles.setNodeText,
                  active && styles.setNodeTextOnLime,
                  done && !active && styles.setNodeTextDone,
                ]}
              >
                {setNumber}
              </Text>
            </View>
            {setNumber < count ? <View style={styles.setLine} /> : null}
          </View>
        );
      })}
    </View>
  );
}

function ActiveExerciseCard({
  exercise,
  index,
  disabled,
  busy,
  showSwap,
  onLogSet,
  onComplete,
  onSkip,
  onReplace,
  onToggleSwap,
  onUpload,
}: {
  exercise: WorkoutExercise;
  index: number;
  disabled: boolean;
  busy: boolean;
  showSwap: boolean;
  onLogSet: (values: { reps: number; weight: number }) => void;
  onComplete: () => void;
  onSkip: () => void;
  onReplace: (name: string) => void;
  onToggleSwap: () => void;
  onUpload: (prepared: {
    uri: string;
    fileName: string;
    mimeType: string;
  }) => Promise<string>;
}) {
  const p = useFitnessPalette();
  const styles = useFitnessStyles(buildStyles);
  const setsDone = exercise.loggedSets.filter((set) => set.completed).length;
  const currentSet = Math.min(setsDone + 1, Math.max(exercise.targetSets, 1));
  const [reps, setReps] = useState(parseTargetReps(exercise.targetReps));
  const [weight, setWeight] = useState(
    Math.max(0, Math.round(exercise.targetWeightKg ?? 0)),
  );
  const [swapName, setSwapName] = useState('');

  useEffect(() => {
    setReps(parseTargetReps(exercise.targetReps));
    setWeight(Math.max(0, Math.round(exercise.targetWeightKg ?? 0)));
  }, [exercise.id, exercise.targetReps, exercise.targetWeightKg]);

  return (
    <View style={styles.card}>
      <View style={styles.exerciseRow}>
        <ImageUploadThumb
          fallbackIcon="barbell-outline"
          size={56}
          uri={exercise.imageUrl}
          onUpload={onUpload}
        />
        <View style={styles.exerciseCopy}>
          <Text style={styles.exerciseIndex}>Exercise {index + 1}</Text>
          <Text style={styles.cardTitle}>{exercise.name}</Text>
          {exercise.muscleGroup ? (
            <Text style={styles.muscleText}>{exercise.muscleGroup}</Text>
          ) : null}
          <Text style={styles.muted}>
            {setsDone}/{exercise.targetSets} sets logged
            {exercise.difficulty ? ` · ${exercise.difficulty}` : ''}
          </Text>
        </View>
      </View>

      <SetStepper current={currentSet} total={exercise.targetSets} />

      <View style={styles.macroRow}>
        <StepperField
          disabled={disabled || busy}
          label="Reps"
          min={1}
          step={1}
          value={reps}
          onChange={setReps}
        />
        <StepperField
          disabled={disabled || busy}
          label="Weight (kg)"
          min={0}
          step={2.5}
          value={weight}
          onChange={setWeight}
        />
      </View>

      <Pressable
        disabled={disabled || busy}
        onPress={() => onLogSet({ reps, weight })}
        style={styles.primaryBtn}
      >
        <View style={styles.btnInner}>
          <Ionicons color={p.onLime} name="add" size={16} />
          <Text style={styles.primaryBtnText}>Log set {currentSet}</Text>
        </View>
      </Pressable>

      <View style={styles.rowActions}>
        <Pressable
          disabled={disabled || busy}
          onPress={onComplete}
          style={[styles.mintBtn, { flex: 1 }]}
        >
          <Text style={styles.mintBtnText}>Complete</Text>
        </Pressable>
        <Pressable
          disabled={disabled || busy}
          onPress={onSkip}
          style={[styles.ghostBtn, { flex: 1 }]}
        >
          <Text style={styles.ghostBtnText}>Skip</Text>
        </Pressable>
      </View>

      <View style={styles.logRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.muted}>
            Target {currentSet}:{' '}
            {exercise.targetReps != null
              ? `${exercise.targetReps} reps`
              : `${reps} reps`}
            {exercise.targetWeightKg != null
              ? ` × ${exercise.targetWeightKg} kg`
              : weight > 0
                ? ` × ${weight} kg`
                : ''}
          </Text>
        </View>
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingBadgeText}>
            {setsDone >= exercise.targetSets ? 'Ready' : 'Pending'}
          </Text>
        </View>
      </View>

      {exercise.loggedSets.length > 0 ? (
        <Text style={styles.muted}>
          Logged:{' '}
          {exercise.loggedSets
            .map(
              (set) =>
                `S${set.setNumber} ${set.reps ?? '—'}×${set.weightKg ?? 0}kg`,
            )
            .join(' · ')}
        </Text>
      ) : null}

      <Pressable
        disabled={disabled || busy}
        onPress={onToggleSwap}
        style={styles.swapToggle}
      >
        <Ionicons color={p.lime} name="swap-horizontal" size={14} />
        <Text style={styles.swapToggleText}>
          {showSwap ? 'Cancel swap' : 'Did something else'}
        </Text>
      </Pressable>

      {showSwap ? (
        <View style={styles.swapBox}>
          <Text style={styles.fieldLabel}>What did you do instead?</Text>
          <TextInput
            editable={!disabled}
            placeholder="e.g. Push-ups"
            placeholderTextColor={p.textMuted}
            style={styles.input}
            value={swapName}
            onChangeText={setSwapName}
          />
          <Pressable
            disabled={disabled || busy || !swapName.trim()}
            onPress={() => onReplace(swapName)}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>Log replacement</Text>
          </Pressable>
        </View>
      ) : null}

      {disabled ? (
        <Text style={styles.muted}>Resume the workout to keep logging.</Text>
      ) : null}
    </View>
  );
}

function UpcomingExerciseCard({
  exercise,
  index,
  disabled,
  busy,
  showSwap,
  onSelect,
  onReplace,
  onToggleSwap,
  onUpload,
}: {
  exercise: WorkoutExercise;
  index: number;
  disabled: boolean;
  busy: boolean;
  showSwap: boolean;
  onSelect: () => void;
  onReplace: (name: string) => void;
  onToggleSwap: () => void;
  onUpload: (prepared: {
    uri: string;
    fileName: string;
    mimeType: string;
  }) => Promise<string>;
}) {
  const p = useFitnessPalette();
  const styles = useFitnessStyles(buildStyles);
  const [swapName, setSwapName] = useState('');
  const done = exercise.completed || exercise.skipped || exercise.replaced;

  return (
    <View style={[styles.card, done && styles.cardDone]}>
      <Pressable disabled={done} onPress={onSelect} style={styles.exerciseRow}>
        <ImageUploadThumb
          fallbackIcon="barbell-outline"
          size={48}
          uri={exercise.imageUrl}
          onUpload={onUpload}
        />
        <View style={styles.exerciseCopy}>
          <Text style={styles.exerciseIndex}>Exercise {index + 1}</Text>
          <Text style={styles.cardTitle}>{exercise.name}</Text>
          {exercise.muscleGroup ? (
            <Text style={styles.muscleText}>{exercise.muscleGroup}</Text>
          ) : null}
          <Text style={styles.muted}>
            {exercise.targetSets} sets
            {exercise.targetReps != null ? ` · ${exercise.targetReps} reps` : ''}
            {exercise.restSeconds ? ` · ${exercise.restSeconds}s rest` : ''}
          </Text>
        </View>
        <View
          style={[
            styles.pendingBadge,
            exercise.completed || exercise.replaced
              ? styles.doneBadge
              : exercise.skipped
                ? styles.skipBadge
                : null,
          ]}
        >
          <Text
            style={[
              styles.pendingBadgeText,
              (exercise.completed || exercise.replaced) && styles.doneBadgeText,
            ]}
          >
            {exercise.replaced
              ? 'Swapped'
              : exercise.completed
                ? 'Done'
                : exercise.skipped
                  ? 'Skipped'
                  : 'Pending'}
          </Text>
        </View>
      </Pressable>

      {!done ? (
        <>
          <View style={styles.smartSwap}>
            <View style={{ flex: 1 }}>
              <Text style={styles.smartSwapLabel}>Smart AI swap</Text>
              <Text style={styles.muted}>
                Did a different move? Log what you actually performed.
              </Text>
            </View>
            <Pressable
              disabled={disabled || busy}
              onPress={onToggleSwap}
              style={styles.mintBtnCompact}
            >
              <Text style={styles.mintBtnText}>
                {showSwap ? 'Close' : 'Swap'}
              </Text>
            </Pressable>
          </View>
          {showSwap ? (
            <View style={styles.swapBox}>
              <TextInput
                editable={!disabled}
                placeholder="Replacement exercise name"
                placeholderTextColor={p.textMuted}
                style={styles.input}
                value={swapName}
                onChangeText={setSwapName}
              />
              <Pressable
                disabled={disabled || busy || !swapName.trim()}
                onPress={() => onReplace(swapName)}
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryBtnText}>Log replacement</Text>
              </Pressable>
            </View>
          ) : null}
        </>
      ) : exercise.replaced && exercise.replacementName ? (
        <Text style={styles.muted}>
          Did instead: {exercise.replacementName}
        </Text>
      ) : null}
    </View>
  );
}

function buildStyles(p: FitnessPalette) {
  return StyleSheet.create({
    shell: { backgroundColor: p.bg, paddingHorizontal: 0 },
    content: { gap: 14, padding: 18, paddingBottom: 40 },
    topMeta: { alignItems: 'center' },
    activePill: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    activeDot: {
      backgroundColor: p.lime,
      borderRadius: 4,
      height: 6,
      width: 6,
    },
    activePillText: {
      color: p.limeSoft,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    titleRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    titleCopy: { flex: 1, gap: 4 },
    eyebrow: {
      color: p.limeSoft,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    title: { color: p.text, fontSize: 30, fontWeight: '800' },
    liveBadge: {
      backgroundColor: p.limeDim,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    liveBadgeText: {
      color: p.lime,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    statsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    statItem: { alignItems: 'center', flexDirection: 'row', gap: 6 },
    statBullet: {
      backgroundColor: p.textMuted,
      borderRadius: 3,
      height: 5,
      width: 5,
    },
    statText: { color: p.textSecondary, fontSize: 12, fontWeight: '600' },
    statBurn: { color: p.active },
    muted: { color: p.textSecondary, fontSize: 13, lineHeight: 18 },
    card: {
      backgroundColor: p.surface,
      borderColor: p.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 12,
      padding: 16,
    },
    cardDone: { opacity: 0.85 },
    sessionCard: {
      backgroundColor: p.surface,
      borderColor: p.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 16,
      padding: 16,
    },
    sessionTop: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    sectionLabel: {
      color: p.lime,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    bigClock: {
      color: p.text,
      fontSize: 34,
      fontVariant: ['tabular-nums'],
      fontWeight: '800',
      marginTop: 2,
    },
    sessionActions: { flexDirection: 'row', gap: 8 },
    sessionMetrics: {
      borderTopColor: p.border,
      borderTopWidth: 1,
      flexDirection: 'row',
      gap: 12,
      paddingTop: 14,
    },
    metricBlock: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      gap: 10,
    },
    metricIcon: {
      alignItems: 'center',
      backgroundColor: p.surfaceElevated,
      borderRadius: 12,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    metricLabel: {
      color: p.textMuted,
      fontSize: 11,
      fontWeight: '700',
    },
    metricValue: {
      color: p.text,
      fontSize: 13,
      fontWeight: '800',
      marginTop: 2,
    },
    restCard: {
      alignItems: 'center',
      backgroundColor: p.limeDim,
      borderColor: p.lime,
      borderRadius: 20,
      borderWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 16,
    },
    nowBanner: {
      alignItems: 'center',
      backgroundColor: p.limeDim,
      borderRadius: 14,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    nowBannerLabel: {
      color: p.lime,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    tagPill: {
      backgroundColor: p.surface,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    tagPillText: {
      color: p.textSecondary,
      fontSize: 11,
      fontWeight: '700',
    },
    nowCopy: { gap: 4, marginTop: -4 },
    nowTitle: { color: p.text, fontSize: 22, fontWeight: '800' },
    exerciseRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
    exerciseCopy: { flex: 1, gap: 2 },
    exerciseIndex: {
      color: p.limeSoft,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    cardTitle: { color: p.text, fontSize: 16, fontWeight: '800' },
    muscleText: {
      color: p.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
    setTrack: {
      alignItems: 'center',
      flexDirection: 'row',
      paddingVertical: 4,
    },
    setNodeWrap: { alignItems: 'center', flexDirection: 'row' },
    setNode: {
      alignItems: 'center',
      backgroundColor: p.surfaceElevated,
      borderColor: p.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 28,
      justifyContent: 'center',
      width: 28,
    },
    setNodeActive: {
      backgroundColor: p.lime,
      borderColor: p.lime,
    },
    setNodeDone: {
      backgroundColor: p.limeDim,
      borderColor: p.limeSoft,
    },
    setNodeText: {
      color: p.textSecondary,
      fontSize: 12,
      fontWeight: '800',
    },
    setNodeTextOnLime: { color: p.onLime },
    setNodeTextDone: { color: p.lime },
    setLine: {
      backgroundColor: p.border,
      height: 2,
      marginHorizontal: 4,
      width: 18,
    },
    macroRow: { flexDirection: 'row', gap: 10 },
    stepperField: { flex: 1, gap: 8 },
    fieldLabel: {
      color: p.textMuted,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    stepper: {
      alignItems: 'center',
      backgroundColor: p.surfaceElevated,
      borderColor: p.border,
      borderRadius: 14,
      borderWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      minHeight: 48,
      paddingHorizontal: 6,
    },
    stepperBtn: {
      alignItems: 'center',
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    stepperValue: {
      color: p.text,
      fontSize: 18,
      fontVariant: ['tabular-nums'],
      fontWeight: '800',
    },
    rowActions: { flexDirection: 'row', gap: 8 },
    logRow: {
      alignItems: 'center',
      backgroundColor: p.surfaceElevated,
      borderRadius: 12,
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    pendingBadge: {
      backgroundColor: p.surface,
      borderColor: p.border,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    pendingBadgeText: {
      color: p.textSecondary,
      fontSize: 11,
      fontWeight: '700',
    },
    doneBadge: {
      backgroundColor: p.limeDim,
      borderColor: p.limeSoft,
    },
    doneBadgeText: { color: p.lime },
    skipBadge: {
      backgroundColor: 'rgba(245, 197, 24, 0.16)',
      borderColor: p.active,
    },
    upcomingHead: {
      alignItems: 'baseline',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    upcomingTitle: { color: p.text, fontSize: 18, fontWeight: '800' },
    upcomingCount: { color: p.textMuted, fontSize: 12, fontWeight: '700' },
    smartSwap: {
      alignItems: 'center',
      backgroundColor: p.limeDim,
      borderRadius: 14,
      flexDirection: 'row',
      gap: 10,
      padding: 12,
    },
    smartSwapLabel: {
      color: p.lime,
      fontSize: 12,
      fontWeight: '800',
      marginBottom: 2,
    },
    swapToggle: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
      justifyContent: 'center',
      paddingVertical: 4,
    },
    swapToggleText: { color: p.lime, fontSize: 13, fontWeight: '800' },
    swapBox: { gap: 8 },
    input: {
      backgroundColor: p.bg,
      borderColor: p.border,
      borderRadius: 12,
      borderWidth: 1,
      color: p.text,
      fontSize: 15,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    primaryBtn: {
      alignItems: 'center',
      backgroundColor: p.lime,
      borderRadius: 14,
      justifyContent: 'center',
      minHeight: 48,
      paddingHorizontal: 14,
    },
    primaryBtnCompact: {
      alignItems: 'center',
      backgroundColor: p.lime,
      borderRadius: 12,
      flexDirection: 'row',
      gap: 6,
      justifyContent: 'center',
      minHeight: 40,
      paddingHorizontal: 12,
    },
    finishBtn: {
      alignItems: 'center',
      backgroundColor: p.lime,
      borderRadius: 12,
      flexDirection: 'row',
      gap: 6,
      justifyContent: 'center',
      minHeight: 40,
      paddingHorizontal: 12,
    },
    btnInner: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    primaryBtnText: { color: p.onLime, fontSize: 14, fontWeight: '800' },
    mintBtn: {
      alignItems: 'center',
      backgroundColor: p.limeDim,
      borderRadius: 12,
      justifyContent: 'center',
      minHeight: 44,
      paddingHorizontal: 12,
    },
    mintBtnCompact: {
      alignItems: 'center',
      backgroundColor: p.surface,
      borderRadius: 12,
      justifyContent: 'center',
      minHeight: 36,
      paddingHorizontal: 14,
    },
    mintBtnText: { color: p.lime, fontSize: 13, fontWeight: '800' },
    ghostBtn: {
      alignItems: 'center',
      backgroundColor: p.surfaceElevated,
      borderColor: p.border,
      borderRadius: 12,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 6,
      justifyContent: 'center',
      minHeight: 40,
      paddingHorizontal: 12,
    },
    ghostBtnText: { color: p.text, fontSize: 13, fontWeight: '800' },
  });
}
