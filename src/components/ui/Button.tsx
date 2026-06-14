import { Pressable, StyleSheet, Text, type PressableProps, type ViewStyle } from 'react-native';

import { useTheme } from '../../contexts/ThemeContext';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: 'primary' | 'ghost';
  style?: ViewStyle;
}

export function Button({ label, variant = 'primary', style, disabled, ...props }: ButtonProps) {
  const { colors } = useTheme();
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        isPrimary
          ? { backgroundColor: colors.primary, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 }
          : { opacity: disabled ? 0.5 : pressed ? 0.7 : 1 },
        style,
      ]}
      {...props}
    >
      <Text
        style={[
          styles.label,
          { color: isPrimary ? colors.primaryText : colors.primary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});
