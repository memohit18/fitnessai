import { AntDesign } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '../../contexts/ThemeContext';

interface SocialButtonProps {
  label: string;
  disabled?: boolean;
  onPress: () => void;
}

export function GoogleButton({ label, disabled, onPress }: SocialButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.socialButtonBg,
          borderColor: colors.border,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <AntDesign color="#EA4335" name="google" size={20} />
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
});
