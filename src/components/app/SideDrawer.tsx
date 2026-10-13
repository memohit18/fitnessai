import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { FitnessPalette } from '../../constants/fitnessPalette';
import { useFitnessPalette, useFitnessStyles } from '../../hooks/useFitnessPalette';

const SCREEN_WIDTH = Dimensions.get('window').width;

type SideDrawerProps = {
  visible: boolean;
  onClose: () => void;
  /** Slide from which edge. Default right. */
  side?: 'left' | 'right';
  width?: number;
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

export function SideDrawer({
  visible,
  onClose,
  side = 'right',
  width = Math.min(SCREEN_WIDTH * 0.88, 360),
  children,
  contentStyle,
}: SideDrawerProps) {
  const p = useFitnessPalette();
  const styles = useFitnessStyles(buildStyles);
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(0)).current;
  const fromRight = side === 'right';

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 1 : 0,
      duration: 240,
      useNativeDriver: true,
    }).start();
  }, [slide, visible]);

  const translateX = slide.interpolate({
    inputRange: [0, 1],
    outputRange: fromRight ? [width, 0] : [-width, 0],
  });

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.backdrop} />
        <Animated.View
          style={[
            styles.panel,
            {
              width,
              backgroundColor: p.surface,
              borderColor: p.border,
              paddingTop: insets.top + 8,
              paddingBottom: Math.max(insets.bottom, 16),
              ...(fromRight
                ? { right: 0, borderLeftWidth: StyleSheet.hairlineWidth }
                : { left: 0, borderRightWidth: StyleSheet.hairlineWidth }),
              transform: [{ translateX }],
            },
            contentStyle,
          ]}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

function buildStyles(_p: FitnessPalette) {
  return StyleSheet.create({
    root: {
      flex: 1,
    },
    backdrop: {
      backgroundColor: 'rgba(0,0,0,0.55)',
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
    },
    panel: {
      bottom: 0,
      position: 'absolute',
      top: 0,
    },
  });
}

