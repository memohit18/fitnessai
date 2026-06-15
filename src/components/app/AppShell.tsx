import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemeToggle } from '../ui/ThemeToggle';
import { useTheme } from '../../contexts/ThemeContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { AppSidebar } from './AppSidebar';

interface AppShellProps {
  children: React.ReactNode;
  contentStyle?: ViewStyle;
}

export function AppShell({ children, contentStyle }: AppShellProps) {
  const { colors } = useTheme();
  const { isOpen, openSidebar, closeSidebar, sidebarWidth } = useSidebar();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.main} edges={['top', 'right', 'bottom', 'left']}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Open menu"
            accessibilityRole="button"
            hitSlop={8}
            onPress={openSidebar}
            style={[styles.menuButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Ionicons color={colors.text} name="menu" size={22} />
          </Pressable>

          <ThemeToggle />
        </View>

        <View style={[styles.content, contentStyle]}>{children}</View>
      </SafeAreaView>

      <Modal
        animationType="fade"
        onRequestClose={closeSidebar}
        statusBarTranslucent
        transparent
        visible={isOpen}
      >
        <View style={styles.overlay}>
          <View style={[styles.drawer, { width: sidebarWidth }]}>
            <AppSidebar />
          </View>

          <Pressable
            accessibilityLabel="Close menu"
            accessibilityRole="button"
            onPress={closeSidebar}
            style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
          />
        </View>
      </Modal>
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
  menuButton: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  drawer: {
    height: '100%',
  },
  backdrop: {
    flex: 1,
  },
});
