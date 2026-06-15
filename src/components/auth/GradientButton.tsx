import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { useTheme } from '../../contexts/ThemeContext';

interface GradientButtonProps {
  label: string;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export function GradientButton({ label, disabled, loading, onPress, style }: GradientButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [styles.wrapper, { opacity: disabled ? 0.5 : pressed ? 0.9 : 1 }, style]}
    >
      <LinearGradient
        colors={[colors.primary, colors.primaryEnd]}
        end={{ x: 1, y: 0 }}
        start={{ x: 0, y: 0 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color={colors.primaryText} />
        ) : (
          <Text style={[styles.label, { color: colors.primaryText }]}>{label}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
});
