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

import { uploadImage } from '../../api/imagesApi';
import {
  generateWorkoutPlan,
  getTodayWorkout,
  startWorkoutSession,
  updateExerciseImage,
} from '../../api/workoutApi';
import { AppShell } from '../../components/app/AppShell';
import { ImageUploadThumb } from '../../components/fitness/ImageUploadThumb';
import { fitnessPalette as p } from '../../constants/fitnessPalette';
import type { WorkoutDay, WorkoutExercise } from '../../types/fitness';
import { getApiErrorMessage } from '../../utils/api';

export function WorkoutScreen() {
  const [today, setToday] = useState<WorkoutDay | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [starting, setStarting] = useState(false);
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
      const workout = await getTodayWorkout();
      setToday(workout);
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
    setStarting(true);
    try {
      await startWorkoutSession(today.id);
      Toast.show({
        type: 'success',
        text1: 'Session started',
        text2: 'Log sets on desktop for now — mobile logger is next.',
        position: 'bottom',
      });
      await load();
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Start failed',
        text2: getApiErrorMessage(err, 'Unable to start session.'),
        position: 'bottom',
      });
    } finally {
      setStarting(false);
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
        <Text style={styles.eyebrow}>Workout</Text>
        <Text style={styles.title}>
          {today?.label || today?.focus || 'Today’s session'}
        </Text>
        <Text style={styles.muted}>
          {today?.estimatedMinutes
            ? `About ${today.estimatedMinutes} min · `
            : ''}
          Same FitForge workout APIs as desktop.
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
            <Pressable
              disabled={starting}
              onPress={() => void onStart()}
              style={styles.primaryBtn}
            >
              {starting ? (
                <ActivityIndicator color={p.onLime} />
              ) : (
                <Text style={styles.primaryBtnText}>Start workout</Text>
              )}
            </Pressable>

            {today.exercises.map((exercise, index) => (
              <View key={exercise.id} style={styles.card}>
                <View style={styles.exerciseRow}>
                  <ImageUploadThumb
                    fallbackIcon="barbell-outline"
                    size={78}
                    uri={exercise.imageUrl}
                    onUpload={(prepared) =>
                      onUploadExerciseImage(exercise, prepared)
                    }
                  />
                  <View style={styles.exerciseCopy}>
                    <Text style={styles.mealType}>Exercise {index + 1}</Text>
                    <Text style={styles.cardTitle}>{exercise.name}</Text>
                    <Text style={styles.muted}>
                      {exercise.targetSets} sets
                      {exercise.targetReps != null
                        ? ` · ${exercise.targetReps} reps`
                        : ''}
                      {exercise.targetWeightKg != null
                        ? ` · ${exercise.targetWeightKg} kg`
                        : ''}
                    </Text>
                    <Text style={styles.status}>
                      {exercise.completed ? 'Completed' : 'Pending'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
    </AppShell>
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
    gap: 6,
    padding: 16,
  },
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
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: p.lime,
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryBtnText: { color: p.onLime, fontSize: 14, fontWeight: '800' },
});
