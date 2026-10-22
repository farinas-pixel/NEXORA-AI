/**
 * NEXORA AI — Comprehensive Navigation Type Definitions
 * Covers Core Companion, My Day, My Life, Academic, Social, IoT, and System Flows
 */

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  SignIn: undefined;
  CreateAccount: undefined;
  Language: undefined;
  SetupComplete: undefined;
  Home: undefined;
  ActiveChat: { initialPrompt?: string } | undefined;
  BotModes: undefined;
  LiveVoice: undefined;
  VoicePreferences: undefined;
  PlanDashboard: undefined;
  CreateTask: undefined;
  Calendar: undefined;
  StudySession: { topic?: string } | undefined;
  MemoryOverview: undefined;
  AddMemory: undefined;
  IntegrationsHub: undefined;
  SecurityCenter: undefined;
  AboutLegal: undefined;

  ForgotPassword: undefined;
  ResetPassword: { accessToken?: string; refreshToken?: string } | undefined;
  Profile: undefined;
  MyDay: undefined;
  MyLife: undefined;
  ExamCompanion: undefined;
  NewsIntelligence: undefined;
  FriendsChat: undefined;
  HomeIntelligence: undefined;
  AgentsHub: undefined;
  Healthcare: undefined;
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
