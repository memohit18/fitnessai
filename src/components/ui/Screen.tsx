import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../contexts/ThemeContext';
import { useImmersiveTopPad } from '../../hooks/useImmersiveTopPad';

interface ScreenProps {
  children: ReactNode;
  footer?: ReactNode;
  header?: ReactNode;
  contentStyle?: ViewStyle;
}

export function Screen({ children, footer, header, contentStyle }: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const topPad = useImmersiveTopPad();

  return (
    <View
      style={[
        styles.safeArea,
        {
          backgroundColor: colors.background,
          paddingTop: topPad,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {header}
      <ScrollView
        contentContainerStyle={[styles.content, contentStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
});
