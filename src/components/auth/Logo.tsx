import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/ThemeContext';

export function Logo() {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.icon, { backgroundColor: colors.primary }]}>
        <View style={styles.line} />
        <View style={[styles.line, styles.lineMiddle]} />
        <View style={styles.line} />
      </View>
      <Text style={[styles.brand, { color: colors.text }]}>ThinkTank</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 28,
  },
  icon: {
    alignItems: 'center',
    borderRadius: 8,
    gap: 3,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  line: {
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    height: 2,
    width: 16,
  },
  lineMiddle: {
    width: 12,
  },
  brand: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
