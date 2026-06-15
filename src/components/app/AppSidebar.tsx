import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../contexts/ThemeContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { useAuth } from '../../hooks';
import type { AppStackParamList } from '../../navigation/types';
import { UserAvatar } from './UserAvatar';

type AppNavigation = NativeStackNavigationProp<AppStackParamList>;

const NAV_ITEMS: { label: string; icon: keyof typeof Ionicons.glyphMap; route: keyof AppStackParamList }[] = [
  { label: 'Home', icon: 'home-outline', route: 'Home' },
];

export function AppSidebar() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AppNavigation>();
  const route = useRoute();
  const { colors } = useTheme();
  const { closeSidebar, sidebarWidth } = useSidebar();
  const { user, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName = user?.name?.trim() || 'User';
  const email = user?.email ?? 'user@example.com';

  const onNavigate = (screen: keyof AppStackParamList) => {
    navigation.navigate(screen);
    closeSidebar();
  };

  const onLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      closeSidebar();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <View
      style={[
        styles.sidebar,
        {
          backgroundColor: colors.surface,
          borderRightColor: colors.border,
          paddingBottom: insets.bottom + 16,
          paddingTop: insets.top + 12,
          width: sidebarWidth,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Pressable
          accessibilityLabel="Close menu"
          accessibilityRole="button"
          hitSlop={8}
          onPress={closeSidebar}
          style={[styles.closeButton, { backgroundColor: colors.background, borderColor: colors.border }]}
        >
          <Ionicons color={colors.text} name="arrow-back" size={22} />
        </Pressable>
        <Text style={[styles.brand, { color: colors.text }]} numberOfLines={1}>
          ThinkTank
        </Text>
      </View>

      <View style={[styles.profileSection, { backgroundColor: colors.background }]}>
        <UserAvatar email={email} size={72} />
        <Text style={[styles.profileName, { color: colors.text }]} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={[styles.profileEmail, { color: colors.textSecondary }]} numberOfLines={1}>
          {email}
        </Text>
      </View>

      <View style={styles.navSection}>
        {NAV_ITEMS.map((item) => {
          const isActive = route.name === item.route;

          return (
            <Pressable
              key={item.route}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              onPress={() => onNavigate(item.route)}
              style={({ pressed }) => [
                styles.navItem,
                {
                  backgroundColor: isActive ? colors.glow : pressed ? colors.background : 'transparent',
                },
              ]}
            >
              <Ionicons
                color={isActive ? colors.primary : colors.textSecondary}
                name={item.icon}
                size={22}
              />
              <Text
                style={[styles.navLabel, { color: isActive ? colors.primary : colors.text }]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={isLoggingOut}
        onPress={() => void onLogout()}
        style={({ pressed }) => [
          styles.logoutButton,
          {
            backgroundColor: colors.background,
            opacity: isLoggingOut ? 0.6 : pressed ? 0.85 : 1,
          },
        ]}
      >
        {isLoggingOut ? (
          <ActivityIndicator color={colors.error} size="small" />
        ) : (
          <>
            <Ionicons color={colors.error} name="log-out-outline" size={22} />
            <Text style={[styles.logoutText, { color: colors.error }]}>Log out</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    borderRightWidth: 1,
    height: '100%',
    paddingHorizontal: 16,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  closeButton: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  brand: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
  },
  profileSection: {
    alignItems: 'center',
    borderRadius: 16,
    gap: 8,
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  profileEmail: {
    fontSize: 14,
  },
  navSection: {
    flex: 1,
    gap: 8,
  },
  navItem: {
    alignItems: 'center',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  navLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  logoutButton: {
    alignItems: 'center',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 12,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
