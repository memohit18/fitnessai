import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import type { FitnessPalette } from '../../../constants/fitnessPalette';
import { useFitnessPalette, useFitnessStyles } from '../../../hooks/useFitnessPalette';

type ProgressRingProps = {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  color?: string;
  label: string;
  sublabel?: string;
};

export function ProgressRing({
  value,
  max,
  size = 96,
  stroke = 8,
  color,
  label,
  sublabel,
}: ProgressRingProps) {
  const p = useFitnessPalette();
  const styles = useFitnessStyles(buildStyles);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeMax = Math.max(0.0001, max);
  const ratio = Math.min(1, Math.max(0, value / safeMax));
  const offset = circumference * (1 - ratio);

  return (
    <View style={{ alignItems: 'center', height: size, justifyContent: 'center', width: size }}>
      <Svg height={size} width={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke={p.border}
          strokeWidth={stroke}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke={color ?? p.lime}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth={stroke}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={styles.value}>
          {Number.isInteger(value) || value >= 20
            ? Math.round(value)
            : value.toFixed(1)}
        </Text>
        <Text style={styles.label}>{label}</Text>
        {sublabel ? <Text style={styles.sub}>{sublabel}</Text> : null}
      </View>
    </View>
  );
}

function buildStyles(p: FitnessPalette) {
  return StyleSheet.create({
  center: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    paddingHorizontal: 8,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  value: {
    color: p.text,
    fontSize: 22,
    fontWeight: '800',
  },
  label: {
    color: p.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sub: {
    color: p.textSecondary,
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
});
}

