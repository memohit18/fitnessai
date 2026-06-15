import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen } from '../screens/app/HomeScreen';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen component={HomeScreen} name="Home" />
    </Stack.Navigator>
  );
}
