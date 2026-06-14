import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/ThemeContext';
import type { ThemeMode } from '../../constants/theme';

const MODES: { label: string; value: ThemeMode }[] = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

export function ThemeToggle() {
  const { colors, mode, setMode } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {MODES.map((item) => {
        const isActive = mode === item.value;

        return (
          <Pressable
            key={item.value}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => setMode(item.value)}
            style={[
              styles.option,
              isActive && { backgroundColor: colors.primary },
            ]}
          >
            <Text
              style={[
                styles.optionText,
                { color: isActive ? colors.primaryText : colors.textSecondary },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 4,
  },
  option: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 8,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
