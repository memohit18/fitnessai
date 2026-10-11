import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/ThemeContext';

type ScorePreviewProps = {
  label: string;
  value: string;
  hint: string;
};

export function ScorePreview({ label, value, hint }: ScorePreviewProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.primary }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    minWidth: 140,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
  },
  hint: {
    fontSize: 12,
    lineHeight: 16,
  },
});
