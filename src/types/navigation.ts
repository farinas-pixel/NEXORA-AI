/**
 * NEXORA AI — Navigation Type Definitions: Phase 1 Core Flow
 */

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  SignIn: undefined;
  SetupComplete: undefined;
  Home: undefined;
  ActiveChat: { initialPrompt?: string } | undefined;
  LiveVoice: undefined;
};

export type AppNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export type ScreenNavProp<T extends keyof RootStackParamList> = NativeStackNavigationProp<
  RootStackParamList,
  T
>;

export type ScreenRouteProp<T extends keyof RootStackParamList> = RouteProp<
  RootStackParamList,
  T
>;
