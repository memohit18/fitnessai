import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { FitnessPalette } from '../../constants/fitnessPalette';
import { useFitnessPalette, useFitnessStyles } from '../../hooks/useFitnessPalette';
import type { MainTabParamList } from '../../navigation/types';

export type MainTabRoute = keyof MainTabParamList;

type SideTab = {
  key: string;
  route: MainTabRoute;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
};

const LEFT_TABS: SideTab[] = [
  {
    key: 'profile',
    route: 'Profile',
    label: 'Profile',
    icon: 'person-outline',
    activeIcon: 'person',
  },
  {
    key: 'workout',
    route: 'Workout',
    label: 'Workout',
    icon: 'barbell-outline',
    activeIcon: 'barbell',
  },
];

const RIGHT_TABS: SideTab[] = [
  {
    key: 'meals',
    route: 'Meals',
    label: 'Meals',
    icon: 'restaurant-outline',
    activeIcon: 'restaurant',
  },
  {
    key: 'transformation',
    route: 'Transformation',
    label: 'Journey',
    icon: 'sparkles-outline',
    activeIcon: 'sparkles',
  },
];

type BottomTabBarProps = {
  activeRoute: MainTabRoute;
  onNavigate: (route: MainTabRoute) => void;
};

export function BottomTabBar({ activeRoute, onNavigate }: BottomTabBarProps) {
  const p = useFitnessPalette();
  const styles = useFitnessStyles(buildStyles);
  const insets = useSafeAreaInsets();
  const analyticsActive = activeRoute === 'Analytics';

  const renderTab = (tab: SideTab) => {
    const isActive = activeRoute === tab.route;

    return (
      <Pressable
        key={tab.key}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
        onPress={() => onNavigate(tab.route)}
        style={styles.tab}
      >
        <Ionicons
          color={isActive ? p.lime : p.textSecondary}
          name={isActive ? tab.activeIcon : tab.icon}
          size={22}
        />
        <Text style={[styles.label, { color: isActive ? p.lime : p.textSecondary }]}>
          {tab.label}
        </Text>
        {isActive ? <View style={styles.activeDot} /> : <View style={styles.dotSpacer} />}
      </Pressable>
    );
  };

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar}>
        <View style={styles.side}>{LEFT_TABS.map(renderTab)}</View>

        <View style={styles.fabSlot}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: analyticsActive }}
            onPress={() => onNavigate('Analytics')}
            style={({ pressed }) => [
              styles.fab,
              analyticsActive && styles.fabActive,
              { opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Ionicons
              color={analyticsActive ? p.bg : p.onLime}
              name="bar-chart"
              size={24}
            />
          </Pressable>
          <Text
            style={[
              styles.fabLabel,
              { color: analyticsActive ? p.lime : p.textSecondary },
            ]}
          >
            Analytics
          </Text>
        </View>

        <View style={styles.side}>{RIGHT_TABS.map(renderTab)}</View>
      </View>
    </View>
  );
}

function buildStyles(p: FitnessPalette) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: p.bg,
      borderTopColor: p.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      zIndex: 20,
    },
    bar: {
      alignItems: 'flex-end',
      flexDirection: 'row',
      paddingHorizontal: 8,
      paddingTop: 8,
    },
    side: {
      flex: 1,
      flexDirection: 'row',
    },
    tab: {
      alignItems: 'center',
      flex: 1,
      gap: 3,
      justifyContent: 'center',
      minHeight: 52,
    },
    label: {
      fontSize: 11,
      fontWeight: '600',
    },
    activeDot: {
      backgroundColor: p.lime,
      borderRadius: 999,
      height: 4,
      marginTop: 2,
      width: 4,
    },
    dotSpacer: {
      height: 6,
    },
    fabSlot: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
      width: 72,
    },
    fab: {
      alignItems: 'center',
      backgroundColor: p.lime,
      borderRadius: 999,
      elevation: 8,
      height: 58,
      justifyContent: 'center',
      marginTop: -28,
      shadowColor: p.lime,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      width: 58,
    },
    fabActive: {
      borderColor: p.lime,
      borderWidth: 2,
    },
    fabLabel: {
      fontSize: 10,
      fontWeight: '700',
      marginTop: 4,
    },
  });
}
