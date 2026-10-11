import { StyleSheet, Text, View } from 'react-native';

import { fitnessPalette as p } from '../../../constants/fitnessPalette';

type DayCell = {
  key: string;
  label: string;
  todayLabel: string;
  date: number;
  isToday: boolean;
};

function buildWeek(): DayCell[] {
  const short = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const todayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const today = new Date();
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  return short.map((label, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();

    return {
      key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
      label,
      todayLabel: todayLabels[index],
      date: date.getDate(),
      isToday,
    };
  });
}

/** Calendar strip only — no completion state until workout/meal data exists. */
export function WeekStrip() {
  const days = buildWeek();

  return (
    <View style={styles.row}>
      {days.map((day) => {
        if (day.isToday) {
          return (
            <View key={day.key} style={styles.today}>
              <Text style={styles.todayLabel}>{day.todayLabel}</Text>
              <Text style={styles.todayDate}>{day.date}</Text>
            </View>
          );
        }

        return (
          <View key={day.key} style={styles.day}>
            <Text style={styles.dayLabel}>{day.label}</Text>
            <View style={styles.dot}>
              <Text style={styles.dotDate}>{day.date}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  day: {
    alignItems: 'center',
    gap: 8,
    width: 36,
  },
  dayLabel: {
    color: p.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  dot: {
    alignItems: 'center',
    backgroundColor: p.surfaceElevated,
    borderColor: p.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  dotDate: {
    color: p.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  today: {
    alignItems: 'center',
    backgroundColor: p.lime,
    borderRadius: 18,
    minWidth: 52,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  todayLabel: {
    color: p.onLime,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  todayDate: {
    color: p.onLime,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
});
