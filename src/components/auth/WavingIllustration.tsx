import { Image, StyleSheet, View } from 'react-native';

import { useTheme } from '../../contexts/ThemeContext';

export function WavingIllustration() {
  const { colors } = useTheme();

  return (
    <View pointerEvents="none" style={styles.slot}>
      <View style={[styles.glow, { backgroundColor: colors.glow }]} />
      <Image
        accessibilityIgnoresInvertColors
        resizeMode="contain"
        source={require('../../../assets/dip-curl-up.png')}
        style={styles.figure}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    alignItems: 'center',
    height: 148,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: 156,
  },
  glow: {
    borderRadius: 64,
    bottom: 8,
    height: 108,
    position: 'absolute',
    width: 108,
  },
  figure: {
    height: 140,
    width: 148,
  },
});
