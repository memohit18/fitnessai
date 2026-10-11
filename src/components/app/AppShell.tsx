import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemeToggle } from '../ui/ThemeToggle';
import { useTheme } from '../../contexts/ThemeContext';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  contentStyle?: ViewStyle;
  hideHeader?: boolean;
  backgroundColor?: string;
  /** @deprecated Tab bar is owned by the root tab navigator. */
  hideTabBar?: boolean;
}

export function AppShell({
  children,
  title = 'ThinkTank',
  contentStyle,
  hideHeader = false,
  backgroundColor,
}: AppShellProps) {
  const { colors } = useTheme();
  const rootBg = backgroundColor ?? colors.background;

  return (
    <View style={[styles.root, { backgroundColor: rootBg }]}>
      <SafeAreaView style={styles.main} edges={['top', 'right', 'left']}>
        {!hideHeader ? (
          <View style={styles.topBar}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {title}
            </Text>
            <ThemeToggle />
          </View>
        ) : null}

        <View style={[styles.content, contentStyle]}>{children}</View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  main: {
    flex: 1,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    paddingRight: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
});
