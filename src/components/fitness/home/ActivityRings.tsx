import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { fitnessPalette as p } from '../../../constants/fitnessPalette';

type Ring = {
  progress: number;
  color: string;
  track: string;
};

type ActivityRingsProps = {
  size?: number;
  totalPts: string;
  rings: Ring[];
};

function RingTrack({
  size,
  strokeWidth,
  radius,
  progress,
  color,
  track,
}: {
  size: number;
  strokeWidth: number;
  radius: number;
  progress: number;
  color: string;
  track: string;
}) {
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, progress));
  const dashOffset = circumference * (1 - clamped);

  return (
    <G rotation="-90" origin={`${center}, ${center}`}>
      <Circle
        cx={center}
        cy={center}
        fill="none"
        r={radius}
        stroke={track}
        strokeWidth={strokeWidth}
      />
      <Circle
        cx={center}
        cy={center}
        fill="none"
        r={radius}
        stroke={color}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        strokeWidth={strokeWidth}
      />
    </G>
  );
}

export function ActivityRings({ size = 148, totalPts, rings }: ActivityRingsProps) {
  const strokeWidth = 12;
  const gap = 8;

  return (
    <View style={[styles.wrap, { height: size, width: size }]}>
      <Svg height={size} width={size}>
        {rings.map((ring, index) => {
          const radius = size / 2 - strokeWidth / 2 - index * (strokeWidth + gap);
          return (
            <RingTrack
              color={ring.color}
              key={`${ring.color}-${index}`}
              progress={ring.progress}
              radius={radius}
              size={size}
              strokeWidth={strokeWidth}
              track={ring.track}
            />
          );
        })}
      </Svg>
      <View style={styles.center}>
        <Text style={styles.totalLabel}>TOTAL</Text>
        <Text style={styles.totalValue}>{totalPts}</Text>
        <Text style={styles.totalUnit}>PTS</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalLabel: {
    color: p.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  totalValue: {
    color: p.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  totalUnit: {
    color: p.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 1,
  },
});
