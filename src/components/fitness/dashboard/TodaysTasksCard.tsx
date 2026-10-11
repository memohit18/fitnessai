import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { fitnessPalette as p } from '../../../constants/fitnessPalette';
import type { DashboardTask } from '../../../types/dashboard';

type TodaysTasksCardProps = {
  tasks: DashboardTask[];
  onTaskPress: (task: DashboardTask) => void;
};

export function TodaysTasksCard({ tasks, onTaskPress }: TodaysTasksCardProps) {
  const doneCount = tasks.filter((task) => task.done).length;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Today’s Tasks</Text>
      <Text style={styles.muted}>
        {tasks.length
          ? `${doneCount}/${tasks.length} complete`
          : 'No tasks yet — generate a plan to get started.'}
      </Text>
      <View style={styles.list}>
        {tasks.map((task) => (
          <Pressable
            key={task.id}
            onPress={() => onTaskPress(task)}
            style={({ pressed }) => [
              styles.row,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons
              color={task.done ? p.lime : p.textMuted}
              name={task.done ? 'checkmark-circle' : 'ellipse-outline'}
              size={18}
            />
            <Text style={[styles.label, task.done && styles.done]}>
              {task.label}
            </Text>
            <Ionicons color={p.textMuted} name="chevron-forward" size={14} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: p.surface,
    borderColor: p.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  title: { color: p.text, fontSize: 15, fontWeight: '800' },
  muted: { color: p.textSecondary, fontSize: 12 },
  list: { gap: 8, marginTop: 4 },
  row: {
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
  label: { color: p.text, flex: 1, fontSize: 13, fontWeight: '600' },
  done: {
    color: p.textMuted,
    textDecorationLine: 'line-through',
  },
});
