import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { BottomTabBar, type MainTabRoute } from '../components/app/BottomTabBar';
import { FitnessOnboardingGate } from '../components/fitness/FitnessOnboardingGate';
import { AnalyticsScreen } from '../screens/app/AnalyticsScreen';
import { FitnessSetupScreen } from '../screens/app/FitnessSetupScreen';
import { MealsScreen } from '../screens/app/MealsScreen';
import { ProfileScreen } from '../screens/app/ProfileScreen';
import { TransformationScreen } from '../screens/app/TransformationScreen';
import { WorkoutScreen } from '../screens/app/WorkoutScreen';
import type { AppStackParamList, MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();

const TAB_ROUTES: MainTabRoute[] = [
  'Analytics',
  'Profile',
  'Workout',
  'Meals',
  'Transformation',
];

function MainTabs() {
  return (
    <FitnessOnboardingGate>
      <Tab.Navigator
        initialRouteName="Analytics"
        detachInactiveScreens={false}
        screenOptions={{
          headerShown: false,
          lazy: true,
          freezeOnBlur: true,
        }}
        tabBar={({ state, navigation }) => {
          const routeName = state.routes[state.index]?.name;
          const activeRoute = TAB_ROUTES.includes(routeName as MainTabRoute)
            ? (routeName as MainTabRoute)
            : 'Analytics';

          return (
            <BottomTabBar
              activeRoute={activeRoute}
              onNavigate={(next) => {
                if (next === activeRoute) return;
                navigation.navigate(next);
              }}
            />
          );
        }}
      >
        <Tab.Screen component={AnalyticsScreen} name="Analytics" />
        <Tab.Screen component={ProfileScreen} name="Profile" />
        <Tab.Screen component={WorkoutScreen} name="Workout" />
        <Tab.Screen component={MealsScreen} name="Meals" />
        <Tab.Screen component={TransformationScreen} name="Transformation" />
      </Tab.Navigator>
    </FitnessOnboardingGate>
  );
}

export function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen component={MainTabs} name="MainTabs" />
      <Stack.Screen
        component={FitnessSetupScreen}
        name="FitnessSetup"
        options={{ gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}
