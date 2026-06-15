import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../../contexts/ThemeContext';

export function ThemeToggle() {
  const { colors, mode, setMode } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: mode === 'light' }}
        onPress={() => setMode('light')}
        style={[styles.option, mode === 'light' && { backgroundColor: colors.primary }]}
      >
        <Ionicons
          color={mode === 'light' ? colors.primaryText : colors.textSecondary}
          name="sunny"
          size={16}
        />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: mode === 'dark' }}
        onPress={() => setMode('dark')}
        style={[styles.option, mode === 'dark' && { backgroundColor: colors.primary }]}
      >
        <Ionicons
          color={mode === 'dark' ? colors.primaryText : colors.textSecondary}
          name="moon"
          size={16}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 4,
  },
  option: {
    alignItems: 'center',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 36,
  },
});
