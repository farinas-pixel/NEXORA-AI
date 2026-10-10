import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  SplashScreen,
  WelcomeScreen,
  SignInScreen,
  CreateAccountScreen,
  LanguageScreen,
  SetupCompleteScreen,
  NexHomeScreen,
  ActiveChatScreen,
  BotModesScreen,
  LiveVoiceScreen,
  VoicePreferencesScreen,
  PlanDashboardScreen,
  CreateTaskScreen,
  CalendarScreen,
  StudySessionScreen,
  MemoryOverviewScreen,
  AddMemoryScreen,
  IntegrationsHubScreen,
  SecurityCenterScreen,
  AboutLegalScreen,
  MyDayScreen,
  MyLifeScreen,
  ExamCompanionScreen,
  NewsIntelligenceScreen,
  FriendsChatScreen,
  HomeIntelligenceScreen,
  ForgotPasswordScreen,
  ResetPasswordScreen,

  AgentsHubScreen,
  ProfileScreen,
} from '../screens';
import type { RootStackParamList } from '../types/navigation';
import { theme } from '../theme';
import * as Linking from 'expo-linking';

const Stack = createNativeStackNavigator<RootStackParamList>();

const prefix = Linking.createURL('/');

const linking = {
  prefixes: ['nexora://', prefix],
  config: {
    screens: {
      ResetPassword: 'reset-password',
      SignIn: 'confirm-email',
    },
  },
};

export const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer
      linking={linking}
      theme={{
        dark: true,
        colors: {
          primary: theme.colors.accent.primary,
          background: theme.colors.background.primary,
          card: theme.colors.background.secondary,
          text: theme.colors.text.primary,
          border: theme.colors.glass.border,
          notification: theme.colors.accent.secondary,
        },
        fonts: {
          regular: { fontFamily: theme.typography.fontFamily.regular, fontWeight: 'normal' },
          medium: { fontFamily: theme.typography.fontFamily.medium, fontWeight: '500' },
          bold: { fontFamily: theme.typography.fontFamily.bold, fontWeight: 'bold' },
          heavy: { fontFamily: theme.typography.fontFamily.bold, fontWeight: '900' },
        },
      }}
    >
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background.primary },
          animation: 'fade',
        }}
      >
        {/* Onboarding & Authentication Flow */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Language" component={LanguageScreen} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
        <Stack.Screen name="SetupComplete" component={SetupCompleteScreen} />

        {/* Primary Living Companion Flow */}
        <Stack.Screen name="Home" component={NexHomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="ActiveChat" component={ActiveChatScreen} />
        <Stack.Screen name="BotModes" component={BotModesScreen} />
        <Stack.Screen
          name="LiveVoice"
          component={LiveVoiceScreen}
          options={{
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen name="VoicePreferences" component={VoicePreferencesScreen} />

        {/* Core Daily & Strategic Flow */}
        <Stack.Screen name="MyDay" component={MyDayScreen} />
        <Stack.Screen name="MyLife" component={MyLifeScreen} />

        {/* Intelligence Suites */}
        <Stack.Screen name="ExamCompanion" component={ExamCompanionScreen} />
        <Stack.Screen name="NewsIntelligence" component={NewsIntelligenceScreen} />
        <Stack.Screen name="FriendsChat" component={FriendsChatScreen} />
        <Stack.Screen name="HomeIntelligence" component={HomeIntelligenceScreen} />
        <Stack.Screen name="AgentsHub" component={AgentsHubScreen} />

        {/* Productivity & Planner Flow */}
        <Stack.Screen name="PlanDashboard" component={PlanDashboardScreen} />
        <Stack.Screen name="CreateTask" component={CreateTaskScreen} />
        <Stack.Screen name="Calendar" component={CalendarScreen} />
        <Stack.Screen name="StudySession" component={StudySessionScreen} />

        {/* Memory Vault & IoT Flow */}
        <Stack.Screen name="MemoryOverview" component={MemoryOverviewScreen} />
        <Stack.Screen name="AddMemory" component={AddMemoryScreen} />
        <Stack.Screen name="IntegrationsHub" component={IntegrationsHubScreen} />

        {/* System & Privacy Flow */}
        <Stack.Screen name="SecurityCenter" component={SecurityCenterScreen} />
        <Stack.Screen name="AboutLegal" component={AboutLegalScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
