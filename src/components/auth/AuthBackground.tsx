import Svg, { Circle, Line } from 'react-native-svg';

import { useTheme } from '../../contexts/ThemeContext';

export function AuthBackground() {
  const { colors } = useTheme();

  return (
    <Svg height="100%" style={{ position: 'absolute', width: '100%' }} width="100%">
      <Circle cx="40" cy="80" fill={colors.pattern} opacity={0.6} r="3" />
      <Circle cx="120" cy="40" fill={colors.pattern} opacity={0.4} r="2" />
      <Circle cx="320" cy="60" fill={colors.pattern} opacity={0.5} r="3" />
      <Circle cx="360" cy="140" fill={colors.pattern} opacity={0.3} r="2" />
      <Circle cx="30" cy="700" fill={colors.pattern} opacity={0.5} r="3" />
      <Circle cx="100" cy="760" fill={colors.pattern} opacity={0.4} r="2" />
      <Circle cx="300" cy="720" fill={colors.pattern} opacity={0.6} r="3" />
      <Circle cx="370" cy="780" fill={colors.pattern} opacity={0.3} r="2" />

      <Line opacity={0.15} stroke={colors.pattern} strokeWidth={1} x1="40" x2="120" y1="80" y2="40" />
      <Line opacity={0.12} stroke={colors.pattern} strokeWidth={1} x1="120" x2="320" y1="40" y2="60" />
      <Line opacity={0.1} stroke={colors.pattern} strokeWidth={1} x1="320" x2="360" y1="60" y2="140" />
      <Line opacity={0.15} stroke={colors.pattern} strokeWidth={1} x1="30" x2="100" y1="700" y2="760" />
      <Line opacity={0.12} stroke={colors.pattern} strokeWidth={1} x1="100" x2="300" y1="760" y2="720" />
      <Line opacity={0.1} stroke={colors.pattern} strokeWidth={1} x1="300" x2="370" y1="720" y2="780" />
    </Svg>
  );
}
