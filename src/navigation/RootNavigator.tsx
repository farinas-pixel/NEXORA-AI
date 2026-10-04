import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  SplashScreen,
  WelcomeScreen,
  SignInScreen,
  SetupCompleteScreen,
  NexHomeScreen,
  ActiveChatScreen,
  LiveVoiceScreen,
} from '../screens';
import type { RootStackParamList } from '../types/navigation';
import { theme } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer
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
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SetupComplete" component={SetupCompleteScreen} />
        <Stack.Screen name="Home" component={NexHomeScreen} />
        <Stack.Screen name="ActiveChat" component={ActiveChatScreen} />
        <Stack.Screen
          name="LiveVoice"
          component={LiveVoiceScreen}
          options={{
            animation: 'slide_from_bottom',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
