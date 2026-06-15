import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { useTheme } from '../../contexts/ThemeContext';

interface AuthInputProps extends TextInputProps {
  label: string;
  error?: string;
  leftIcon: keyof typeof Ionicons.glyphMap;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
  labelRight?: React.ReactNode;
}

export function AuthInput({
  label,
  error,
  leftIcon,
  rightAction,
  labelRight,
  style,
  ...props
}: AuthInputProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {labelRight}
      </View>
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.inputBackground,
            borderColor: error ? colors.error : colors.inputBorder,
          },
        ]}
      >
        <Ionicons color={colors.placeholder} name={leftIcon} size={18} style={styles.leftIcon} />
        <TextInput
          placeholderTextColor={colors.placeholder}
          style={[styles.input, { color: colors.text }, style]}
          {...props}
        />
        {rightAction ? (
          <Pressable hitSlop={8} onPress={rightAction.onPress} style={styles.rightAction}>
            <Ionicons color={colors.placeholder} name={rightAction.icon} size={18} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
}

export function PasswordInput({
  label,
  error,
  labelRight,
  ...props
}: Omit<AuthInputProps, 'leftIcon' | 'rightAction' | 'secureTextEntry'>) {
  const [visible, setVisible] = useState(false);

  return (
    <AuthInput
      error={error}
      label={label}
      labelRight={labelRight}
      leftIcon="lock-closed-outline"
      rightAction={{
        icon: visible ? 'eye-off-outline' : 'eye-outline',
        onPress: () => setVisible((current) => !current),
      }}
      secureTextEntry={!visible}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputRow: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: 14,
  },
  leftIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 14,
  },
  rightAction: {
    marginLeft: 8,
    padding: 4,
  },
  error: {
    fontSize: 13,
  },
});
