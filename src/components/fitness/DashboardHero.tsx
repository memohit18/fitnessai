import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/ThemeContext';

type DashboardHeroProps = {
  name: string;
};

export function DashboardHero({ name }: DashboardHeroProps) {
  const { colors, resolvedTheme } = useTheme();
  const firstName = name.split(' ')[0] || name;

  return (
    <View style={[styles.shell, { borderColor: colors.border }]}>
      <LinearGradient
        colors={
          resolvedTheme === 'dark'
            ? ['rgba(16,185,129,0.22)', 'rgba(20,184,166,0.05)', 'transparent']
            : ['rgba(16,185,129,0.16)', 'rgba(232,237,245,0.9)', '#FFFFFF']
        }
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>ThinkTank Fitness</Text>
        <Text style={[styles.title, { color: colors.text }]}>Hello, {firstName}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Your meals, workouts, hydration, and progress — built for the day ahead.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: {
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 320,
  },
});
