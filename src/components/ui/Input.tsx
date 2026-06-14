import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { useTheme } from '../../contexts/ThemeContext';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.placeholder}
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBackground,
            borderColor: error ? colors.error : colors.border,
            color: colors.text,
          },
          style,
        ]}
        {...props}
      />
      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  error: {
    fontSize: 13,
  },
});
