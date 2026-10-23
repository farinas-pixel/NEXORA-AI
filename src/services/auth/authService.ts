// src/services/auth/authService.ts
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from './supabaseClient';
import * as SecureStore from '../secureStore';
import { StorageService, UserProfile } from '../storage';

// Keys for SecureStore
const ACCESS_TOKEN_KEY = 'supabase_access_token';
const REFRESH_TOKEN_KEY = 'supabase_refresh_token';
const USER_PROFILE_KEY = 'user_profile';

export const OFFICIAL_PRODUCTION_URL = 'https://nexora-ai-web-z486.onrender.com';

/**
 * Resolves the official production redirect URL for auth verification callbacks.
 * Production verification links return directly to the official Render domain.
 */
export const getAuthRedirectUrl = (path: 'confirm-email' | 'reset-password'): string => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
      return `${window.location.origin}/${path}`;
    }
    return `${OFFICIAL_PRODUCTION_URL}/${path}`;
  }
  return `nexora://${path}`;
};

export type AuthResult = {
  ok: boolean;
  error?: string;
  profile?: UserProfile;
  isEmailNotConfirmed?: boolean;
  requiresEmailConfirmation?: boolean;
};

// Timeout helper to guarantee auth calls never hang indefinitely
const AUTH_TIMEOUT_MS = 15000;

const withAuthTimeout = <T>(
  promise: Promise<T>,
  timeoutMessage = 'Authentication request timed out. Please check your network connection.'
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), AUTH_TIMEOUT_MS)
    ),
  ]);
};

/**
 * Sign in with email & password.
 */
export const signIn = async (email: string, password: string): Promise<AuthResult> => {
  try {
    const { data, error } = await withAuthTimeout(
      supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      }),
      'Sign in timed out. Please check your internet connection.'
    );

    if (error) {
      const isEmailNotConfirmed = error.message.toLowerCase().includes('email not confirmed');
      return {
        ok: false,
        error: isEmailNotConfirmed
          ? 'Email not confirmed. Please verify your email before signing in.'
          : error.message,
        isEmailNotConfirmed,
      };
    }
    if (!data.session || !data.user) {
      return { ok: false, error: 'No active session returned from server' };
    }

    // Build real user profile using Supabase authenticated user ID and existing profile metadata
    const fullName = data.user.user_metadata?.full_name?.trim() || data.user.user_metadata?.name?.trim() || 'User';
    const profile: UserProfile = {
      id: data.user.id,
      name: fullName,
      email: data.user.email ?? email,
      language: 'English',
      region: 'India',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      createdDate: data.user.created_at || new Date().toISOString(),
    };

    // Persist backup tokens and profile non-blockingly without halting sign-in
    try {
      await Promise.all([
        SecureStore.setItemAsync(ACCESS_TOKEN_KEY, data.session.access_token).catch(() => {}),
        SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.session.refresh_token).catch(() => {}),
        SecureStore.setItemAsync(USER_PROFILE_KEY, JSON.stringify(profile)).catch(() => {}),
      ]);
    } catch {
      // Non-fatal: Supabase client already manages session storage via AsyncStorage
    }

    return { ok: true, profile };
  } catch (e: any) {
    return { ok: false, error: e.message || 'An unexpected error occurred during sign in' };
  }
};

/** Sign up new user */
export const signUp = async (name: string, email: string, password: string): Promise<AuthResult> => {
  try {
    const { data, error } = await withAuthTimeout(
      supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: name.trim() },
          emailRedirectTo: getAuthRedirectUrl('confirm-email'),
        },
      }),
      'Sign up timed out. Please check your internet connection.'
    );

    if (error) {
      return { ok: false, error: error.message };
    }
    if (!data.user) {
      return { ok: false, error: 'User registration failed. Please try again.' };
    }

    // When email confirmation is required, Supabase returns a user but NO active session
    if (!data.session) {
      return {
        ok: true,
        requiresEmailConfirmation: true,
      };
    }

    const profile: UserProfile = {
      id: data.user.id,
      name: name.trim(),
      email: data.user.email ?? email.trim(),
      language: 'English',
      region: 'India',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      createdDate: data.user.created_at || new Date().toISOString(),
    };

    try {
      await Promise.all([
        SecureStore.setItemAsync(ACCESS_TOKEN_KEY, data.session.access_token).catch(() => {}),
        SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.session.refresh_token).catch(() => {}),
        SecureStore.setItemAsync(USER_PROFILE_KEY, JSON.stringify(profile)).catch(() => {}),
      ]);
    } catch {
      // Non-fatal
    }

    return { ok: true, profile };
  } catch (e: any) {
    return { ok: false, error: e.message || 'An unexpected error occurred during sign up' };
  }
};

/** Resend confirmation email */
export const resendConfirmationEmail = async (email: string): Promise<{ ok: boolean; error?: string }> => {
  try {
    const { error } = await withAuthTimeout(
      supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: getAuthRedirectUrl('confirm-email'),
        },
      }),
      'Resend request timed out. Please try again.'
    );
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message || 'Failed to resend confirmation email' };
  }
};

/** Reset password via email with native deep link redirect (no localhost) */
export const resetPassword = async (email: string): Promise<{ ok: boolean; error?: string }> => {
  try {
    const { error } = await withAuthTimeout(
      supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: getAuthRedirectUrl('reset-password'),
      }),
      'Password reset request timed out. Please try again.'
    );
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message || 'Password reset request failed' };
  }
};

/** Update user password for authenticated/recovery session */
export const updateUserPassword = async (newPassword: string): Promise<{ ok: boolean; error?: string }> => {
  try {
    const { error } = await withAuthTimeout(
      supabase.auth.updateUser({
        password: newPassword,
      }),
      'Update password timed out. Please try again.'
    );
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message || 'Failed to update password' };
  }
};

/** Parse and set session from recovery deep link URL */
export const setSessionFromUrl = async (url: string): Promise<boolean> => {
  try {
    let queryString = '';
    const hashIndex = url.indexOf('#');
    const queryIndex = url.indexOf('?');

    if (hashIndex !== -1) {
      queryString = url.substring(hashIndex + 1);
    } else if (queryIndex !== -1) {
      queryString = url.substring(queryIndex + 1);
    }

    if (!queryString) return false;

    const params: Record<string, string> = {};
    const parts = queryString.split('&');
    for (const part of parts) {
      const [k, v] = part.split('=');
      if (k && v) {
        params[decodeURIComponent(k)] = decodeURIComponent(v);
      }
    }

    const accessToken = params['access_token'];
    const refreshToken = params['refresh_token'];

    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      return !error;
    }
    return false;
  } catch {
    return false;
  }
};

/** Sign out and clear stored tokens with bounded timeout */
export const signOut = async () => {
  try {
    await withAuthTimeout(
      supabase.auth.signOut(),
      'Sign out request timed out'
    );
  } catch (e) {
    // Continue cleanup locally even if network fails or times out
    console.warn('[authService] Remote signOut failed or timed out:', e);
  }

  try {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY).catch(() => {}),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => {}),
      SecureStore.deleteItemAsync(USER_PROFILE_KEY).catch(() => {}),
    ]);
  } catch {
    // Ignore SecureStore removal failure
  }
};

/** Restore session on app launch */
export const restoreSession = async (): Promise<UserProfile | null> => {
  try {
    // 1. Detect tokens from URL hash or query params if present (e.g. email verification callback or password reset)
    let initialUrl: string | null = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.href) {
      initialUrl = window.location.href;
    } else {
      initialUrl = await Linking.getInitialURL().catch(() => null);
    }

    if (initialUrl && (initialUrl.includes('access_token') || initialUrl.includes('#') || initialUrl.includes('?'))) {
      const parsedSession = await setSessionFromUrl(initialUrl).catch(() => false);
      // Clean sensitive token fragments from browser history if on web
      if (parsedSession && Platform.OS === 'web' && typeof window !== 'undefined' && window.history?.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }

    let session = (await supabase.auth.getSession()).data.session;

    if (!session) {
      const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY).catch(() => null);
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY).catch(() => null);
      if (accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!error && data.session) {
          session = data.session;
        }
      }
    }

    if (!session || !session.user) {
      const localProfile = await StorageService.getUserProfile().catch(() => null);
      if (localProfile && localProfile.id) {
        return localProfile;
      }
      return null;
    }

    // Build or restore profile safely for authenticated session user
    const fullName = session.user.user_metadata?.full_name?.trim() || session.user.user_metadata?.name?.trim() || 'User';
    const profileStr = await SecureStore.getItemAsync(USER_PROFILE_KEY).catch(() => null);
    let profile: UserProfile | null = null;
    if (profileStr) {
      try {
        const parsed = JSON.parse(profileStr);
        // Only reuse stored profile if it belongs to the exact current session user
        if (parsed && parsed.id === session.user.id) {
          profile = {
            ...parsed,
            name: parsed.name && parsed.name !== 'User' ? parsed.name : fullName,
            email: session.user.email ?? parsed.email,
          };
        }
      } catch {}
    }

    if (!profile) {
      profile = {
        id: session.user.id,
        name: fullName,
        email: session.user.email ?? '',
        language: 'English',
        region: 'India',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        createdDate: session.user.created_at || new Date().toISOString(),
      };
    }

    // Keep SecureStore backup updated with verified active user
    await SecureStore.setItemAsync(USER_PROFILE_KEY, JSON.stringify(profile)).catch(() => {});

    return profile;
  } catch {
    return null;
  }
};
