/**
 * NEXORA AI — Cross-Platform Secure Storage Adapter
 * On iOS and Android, uses native hardware-backed expo-secure-store.
 * On Web, gracefully falls back to isolated AsyncStorage/localStorage.
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const isAvailableAsync = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return true;
  }
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
};

export const getItemAsync = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    try {
      return await AsyncStorage.getItem(`__sec_${key}`);
    } catch {
      return null;
    }
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch (err) {
    console.warn(`[SecureStore] Error reading key ${key}:`, err);
    return null;
  }
};

export const setItemAsync = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    try {
      await AsyncStorage.setItem(`__sec_${key}`, value);
    } catch (err) {
      console.warn(`[SecureStore] Error setting web key ${key}:`, err);
    }
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (err) {
    console.warn(`[SecureStore] Error setting key ${key}:`, err);
  }
};

export const deleteItemAsync = async (key: string): Promise<void> => {
  if (Platform.OS === 'web') {
    try {
      await AsyncStorage.removeItem(`__sec_${key}`);
    } catch (err) {
      console.warn(`[SecureStore] Error deleting web key ${key}:`, err);
    }
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (err) {
    console.warn(`[SecureStore] Error deleting key ${key}:`, err);
  }
};
