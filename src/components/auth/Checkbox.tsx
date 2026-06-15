import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/ThemeContext';

interface CheckboxProps {
  checked: boolean;
  label: string;
  onToggle: () => void;
}

export function Checkbox({ checked, label, onToggle }: CheckboxProps) {
  const { colors } = useTheme();

  return (
    <Pressable accessibilityRole="checkbox" onPress={onToggle} style={styles.row}>
      <View
        style={[
          styles.box,
          {
            backgroundColor: checked ? colors.primary : 'transparent',
            borderColor: checked ? colors.primary : colors.checkboxBorder,
          },
        ]}
      >
        {checked ? <Ionicons color={colors.primaryText} name="checkmark" size={14} /> : null}
      </View>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  box: {
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1.5,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  label: {
    fontSize: 14,
  },
});
