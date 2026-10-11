import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { fitnessPalette as p } from '../../../constants/fitnessPalette';

type HeartWaveProps = {
  height?: number;
  width?: number;
};

export function HeartWave({ width = 280, height = 56 }: HeartWaveProps) {
  const path =
    'M0 34 C18 34 22 18 36 18 C50 18 54 42 68 42 C82 42 86 12 100 12 C114 12 118 40 132 40 C146 40 150 20 164 20 C178 20 182 44 196 44 C210 44 214 16 228 16 C242 16 246 36 260 36 C268 36 272 28 280 28';

  return (
    <View style={[styles.wrap, { height, width }]}>
      <Svg height={height} width={width} viewBox={`0 0 ${width} ${height}`}>
        <Path
          d={path}
          fill="none"
          stroke={p.wave}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
});
