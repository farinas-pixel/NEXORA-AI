import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation';
import { AppProvider } from './src/context/AppContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={styles.outerContainer}>
        <View style={styles.appShell}>
          <AppProvider>
            <RootNavigator />
          </AppProvider>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#02040A',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  appShell: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 480 : undefined,
    height: '100%',
    backgroundColor: '#050814',
    overflow: 'hidden',
  },
});
