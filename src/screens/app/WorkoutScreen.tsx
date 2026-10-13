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
  resumeWorkoutSession,
  startWorkoutSession,
  updateExerciseImage,
} from '../../api/workoutApi';
import { AppShell } from '../../components/app/AppShell';
import { ImageUploadThumb } from '../../components/fitness/ImageUploadThumb';
import type { FitnessPalette } from '../../constants/fitnessPalette';
import { useFitnessPalette, useFitnessStyles } from '../../hooks/useFitnessPalette';
import {
  formatClock,
  mergeSessionExercises,
} from '../../lib/fitness/workoutResponse';
import type {
  WorkoutDay,
  WorkoutExercise,
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const exercises = useMemo(
    () => mergeSessionExercises(today?.exercises ?? [], sessionExercises),
    [sessionExercises, today?.exercises],
  );

  const activeExercise =
    exercises.find((item) => item.id === activeExerciseId) ??
    exercises.find((item) => !item.completed && !item.skipped) ??
    null;

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
          setSessionId(activeSession.sessionId);
          setSessionStatus(mapped);
          setElapsedSeconds(activeSession.durationSeconds ?? 0);
          setSessionExercises(activeSession.exercises ?? []);
          const firstOpen =
            (activeSession.exercises ?? workout?.exercises ?? []).find(
              (item) => !item.completed && !item.skipped,
            ) ?? null;
          setActiveExerciseId(firstOpen?.id ?? null);
          setExpandedId(firstOpen?.id ?? null);
        }
      } else if (mode === 'full') {
        setSessionId(null);
        setSessionStatus('idle');
        setElapsedSeconds(0);
        setRestSecondsLeft(0);
        setSessionExercises([]);
        setActiveExerciseId(null);
        setExpandedId(null);
      }
      setStatus('ready');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load workout.'));
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
    if (activeSession?.exercises) {
      setSessionExercises(activeSession.exercises);
    }
  }, []);

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
      setSessionId(session.sessionId);
      setSessionStatus('active');
      setElapsedSeconds(0);
      setRestSecondsLeft(0);
      const first =
        exercises.find((item) => !item.completed && !item.skipped) ??
        exercises[0] ??
        null;
      setActiveExerciseId(first?.id ?? null);
      setExpandedId(first?.id ?? null);
      Toast.show({
        type: 'success',
        text1: 'Session started',
        text2: first ? `Now: ${first.name}` : undefined,
        position: 'bottom',
      });
      await refreshLive();
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
      await pauseWorkoutSession(sessionId);
      setSessionStatus('paused');
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
      await resumeWorkoutSession(sessionId);
      setSessionStatus('active');
      Toast.show({ type: 'success', text1: 'Workout resumed', position: 'bottom' });
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
      await endWorkoutSession(sessionId, { force: true });
      setSessionStatus('finished');
      setRestSecondsLeft(0);
      setActiveExerciseId(null);
      setExpandedId(null);
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
      (item) => item.id !== currentId && !item.completed && !item.skipped,
    );
    setActiveExerciseId(next?.id ?? null);
    setExpandedId(next?.id ?? null);
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

  const sessionLive = sessionStatus === 'active' || sessionStatus === 'paused';

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
        <Text style={styles.eyebrow}>Workout</Text>
        <Text style={styles.title}>
          {today?.label || today?.focus || 'Today’s session'}
        </Text>
        <Text style={styles.muted}>
          {today?.estimatedMinutes
            ? `About ${today.estimatedMinutes} min · `
            : ''}
          {sessionLive
            ? `Session ${formatClock(elapsedSeconds)} · ${sessionStatus}`
            : 'Start to log sets, rest, and track the current exercise.'}
        </Text>

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
            <SessionControls
              busy={busy}
              sessionStatus={sessionStatus}
              elapsedSeconds={elapsedSeconds}
              onStart={() => void onStart()}
              onPause={() => void onPause()}
              onResume={() => void onResume()}
              onFinish={() => void onFinish()}
            />

            {restSecondsLeft > 0 && sessionStatus === 'active' ? (
              <View style={styles.restCard}>
                <View>
                  <Text style={styles.restLabel}>Rest timer</Text>
                  <Text style={styles.restClock}>
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
                  style={styles.secondaryBtn}
                >
                  <Text style={styles.secondaryBtnText}>Skip rest</Text>
                </Pressable>
              </View>
            ) : null}

            {sessionLive && activeExercise ? (
              <View style={styles.nowCard}>
                <Text style={styles.restLabel}>Now doing</Text>
                <Text style={styles.cardTitle}>{activeExercise.name}</Text>
                <Text style={styles.muted}>
                  {activeExercise.loggedSets.length}/{activeExercise.targetSets}{' '}
                  sets
                  {activeExercise.targetReps != null
                    ? ` · ${activeExercise.targetReps} reps`
                    : ''}
                  {activeExercise.restSeconds
                    ? ` · ${activeExercise.restSeconds}s rest`
                    : ''}
                </Text>
              </View>
            ) : null}

            {exercises.map((exercise, index) => (
              <ExerciseSessionCard
                key={exercise.id}
                busy={busy}
                disabled={!sessionLive || sessionStatus === 'paused'}
                exercise={exercise}
                expanded={expandedId === exercise.id}
                index={index}
                isActive={activeExerciseId === exercise.id}
                onComplete={() => void onCompleteExercise(exercise, false)}
                onExpand={() =>
                  setExpandedId((current) =>
                    current === exercise.id ? null : exercise.id,
                  )
                }
                onLogSet={(values) => void onLogSet(exercise, values)}
                onSkip={() => void onCompleteExercise(exercise, true)}
                onUpload={(prepared) => onUploadExerciseImage(exercise, prepared)}
              />
            ))}
          </>
        ) : null}
      </ScrollView>
    </AppShell>
  );
}

function SessionControls({
  sessionStatus,
  elapsedSeconds,
  busy,
  onStart,
  onPause,
  onResume,
  onFinish,
}: {
  sessionStatus: WorkoutSessionStatus;
  elapsedSeconds: number;
  busy: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
}) {
  const styles = useFitnessStyles(buildStyles);

  if (sessionStatus === 'idle' || sessionStatus === 'finished') {
    return (
      <Pressable disabled={busy} onPress={onStart} style={styles.primaryBtn}>
        {busy ? (
          <ActivityIndicator color={styles.primaryBtnText.color} />
        ) : (
          <Text style={styles.primaryBtnText}>
            {sessionStatus === 'finished' ? 'Start new session' : 'Start workout'}
          </Text>
        )}
      </Pressable>
    );
  }

  return (
    <View style={styles.sessionBar}>
      <View>
        <Text style={styles.restLabel}>
          {sessionStatus === 'paused' ? 'Paused' : 'In progress'}
        </Text>
        <Text style={styles.sessionClock}>{formatClock(elapsedSeconds)}</Text>
      </View>
      <View style={styles.sessionActions}>
        {sessionStatus === 'active' ? (
          <Pressable disabled={busy} onPress={onPause} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Pause</Text>
          </Pressable>
        ) : (
          <Pressable
            disabled={busy}
            onPress={onResume}
            style={styles.primaryBtnCompact}
          >
            <Text style={styles.primaryBtnText}>Resume</Text>
          </Pressable>
        )}
        <Pressable disabled={busy} onPress={onFinish} style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>Finish</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ExerciseSessionCard({
  exercise,
  index,
  expanded,
  isActive,
  disabled,
  busy,
  onExpand,
  onLogSet,
  onComplete,
  onSkip,
  onUpload,
}: {
  exercise: WorkoutExercise;
  index: number;
  expanded: boolean;
  isActive: boolean;
  disabled: boolean;
  busy: boolean;
  onExpand: () => void;
  onLogSet: (values: { reps: number; weight: number }) => void;
  onComplete: () => void;
  onSkip: () => void;
  onUpload: (prepared: {
    uri: string;
    fileName: string;
    mimeType: string;
  }) => Promise<string>;
}) {
  const styles = useFitnessStyles(buildStyles);
  const [reps, setReps] = useState(
    String(exercise.targetReps ?? '10').replace(/[^0-9].*$/, '') || '10',
  );
  const [weight, setWeight] = useState(
    exercise.targetWeightKg != null ? String(exercise.targetWeightKg) : '0',
  );
  const setsDone = exercise.loggedSets.filter((set) => set.completed).length;
  const done = exercise.completed || exercise.skipped;

  return (
    <View
      style={[
        styles.card,
        isActive && styles.cardActive,
        exercise.completed && styles.cardDone,
        exercise.skipped && styles.cardSkipped,
      ]}
    >
      <Pressable onPress={onExpand} style={styles.exerciseRow}>
        <ImageUploadThumb
          fallbackIcon="barbell-outline"
          size={64}
          uri={exercise.imageUrl}
          onUpload={onUpload}
        />
        <View style={styles.exerciseCopy}>
          <Text style={styles.mealType}>
            Exercise {index + 1}
            {isActive ? ' · Now' : ''}
          </Text>
          <Text style={styles.cardTitle}>{exercise.name}</Text>
          <Text style={styles.muted}>
            {setsDone}/{exercise.targetSets} sets
            {exercise.targetReps != null ? ` · ${exercise.targetReps} reps` : ''}
            {exercise.restSeconds ? ` · ${exercise.restSeconds}s rest` : ''}
          </Text>
          <Text style={styles.status}>
            {exercise.completed
              ? 'Completed'
              : exercise.skipped
                ? 'Skipped'
                : isActive
                  ? 'In progress'
                  : 'Pending'}
          </Text>
        </View>
      </Pressable>

      {expanded && !done ? (
        <View style={styles.logger}>
          <View style={styles.macroRow}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Reps</Text>
              <TextInput
                editable={!disabled}
                keyboardType="number-pad"
                style={styles.input}
                value={reps}
                onChangeText={setReps}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Weight (kg)</Text>
              <TextInput
                editable={!disabled}
                keyboardType="decimal-pad"
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
              />
            </View>
          </View>
          <Pressable
            disabled={disabled || busy}
            onPress={() =>
              onLogSet({
                reps: Number(reps) || 0,
                weight: Number(weight) || 0,
              })
            }
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>
              Log set {setsDone + 1}
            </Text>
          </Pressable>
          <View style={styles.rowActions}>
            <Pressable
              disabled={disabled || busy}
              onPress={onComplete}
              style={[styles.primaryBtnCompact, { flex: 1 }]}
            >
              <Text style={styles.primaryBtnText}>Complete</Text>
            </Pressable>
            <Pressable
              disabled={disabled || busy}
              onPress={onSkip}
              style={[styles.secondaryBtn, { flex: 1 }]}
            >
              <Text style={styles.secondaryBtnText}>Skip</Text>
            </Pressable>
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
          {disabled ? (
            <Text style={styles.muted}>Start or resume the workout to log.</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function buildStyles(p: FitnessPalette) {
  return StyleSheet.create({
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
      gap: 10,
      padding: 16,
    },
    cardActive: { borderColor: p.lime, backgroundColor: p.limeDim },
    cardDone: { borderColor: 'rgba(46, 230, 214, 0.35)' },
    cardSkipped: { borderColor: 'rgba(245, 197, 24, 0.35)' },
    nowCard: {
      backgroundColor: p.limeDim,
      borderColor: p.lime,
      borderRadius: 18,
      borderWidth: 1,
      gap: 4,
      padding: 16,
    },
    restCard: {
      alignItems: 'center',
      backgroundColor: p.limeDim,
      borderColor: p.lime,
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 16,
    },
    restLabel: {
      color: p.lime,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    restClock: {
      color: p.text,
      fontSize: 28,
      fontVariant: ['tabular-nums'],
      fontWeight: '800',
    },
    sessionBar: {
      alignItems: 'center',
      backgroundColor: p.surface,
      borderColor: p.border,
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 16,
    },
    sessionClock: {
      color: p.text,
      fontSize: 24,
      fontVariant: ['tabular-nums'],
      fontWeight: '800',
    },
    sessionActions: { flexDirection: 'row', gap: 8 },
    exerciseRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
    exerciseCopy: { flex: 1, gap: 4 },
    cardTitle: { color: p.text, fontSize: 16, fontWeight: '800' },
    mealType: {
      color: p.lime,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    status: { color: p.textMuted, fontSize: 12, fontWeight: '600' },
    logger: { gap: 10 },
    macroRow: { flexDirection: 'row', gap: 8 },
    field: { flex: 1, gap: 6 },
    fieldLabel: {
      color: p.textMuted,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
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
    rowActions: { flexDirection: 'row', gap: 8 },
    primaryBtn: {
      alignItems: 'center',
      backgroundColor: p.lime,
      borderRadius: 14,
      justifyContent: 'center',
      minHeight: 48,
    },
    primaryBtnCompact: {
      alignItems: 'center',
      backgroundColor: p.lime,
      borderRadius: 12,
      justifyContent: 'center',
      minHeight: 40,
      paddingHorizontal: 14,
    },
    primaryBtnText: { color: p.onLime, fontSize: 14, fontWeight: '800' },
    secondaryBtn: {
      alignItems: 'center',
      borderColor: p.border,
      borderRadius: 12,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 40,
      paddingHorizontal: 14,
    },
    secondaryBtnText: { color: p.text, fontSize: 13, fontWeight: '800' },
  });
}
