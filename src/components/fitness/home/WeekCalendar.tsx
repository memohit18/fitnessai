import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { fitnessPalette as p } from '../../../constants/fitnessPalette';

type DayCell = {
  key: string;
  label: string;
  date: number;
  isToday: boolean;
};

function buildWeek(): DayCell[] {
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay());

  return labels.map((label, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();

    return {
      key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
      label,
      date: date.getDate(),
      isToday,
    };
  });
}

function TodayRing({ date }: { date: number }) {
  const size = 40;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = 0.72;

  return (
    <View style={styles.ringWrap}>
      <Svg height={size} width={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke="rgba(200,255,0,0.18)"
          strokeWidth={stroke}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke={p.lime}
          strokeDasharray={`${circumference * progress} ${circumference}`}
          strokeLinecap="round"
          strokeWidth={stroke}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={styles.todayDate}>{date}</Text>
    </View>
  );
}

export function WeekCalendar() {
  const days = buildWeek();

  return (
    <View style={styles.row}>
      {days.map((day) => (
        <View key={day.key} style={styles.day}>
          <Text style={[styles.label, day.isToday && styles.labelToday]}>{day.label}</Text>
          {day.isToday ? (
            <TodayRing date={day.date} />
          ) : (
            <View style={styles.dateWrap}>
              <Text style={styles.date}>{day.date}</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  day: {
    alignItems: 'center',
    gap: 8,
    width: 42,
  },
  label: {
    color: p.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  labelToday: {
    color: p.lime,
    fontWeight: '800',
  },
  dateWrap: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  date: {
    color: p.text,
    fontSize: 15,
    fontWeight: '700',
  },
  ringWrap: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  todayDate: {
    color: p.text,
    fontSize: 15,
    fontWeight: '800',
    position: 'absolute',
  },
});
