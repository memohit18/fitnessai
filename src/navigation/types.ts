import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type MainTabParamList = {
  Analytics: undefined;
  Profile: undefined;
  Workout: undefined;
  Meals: undefined;
  Transformation: undefined;
};

export type AppStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  FitnessSetup: { mode?: 'edit' } | undefined;
};

/** Convenience for screens that live inside the main tab navigator. */
export type AppTabScreenParams = MainTabParamList;
