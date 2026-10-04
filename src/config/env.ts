/**
 * NEXORA AI — Environment Configuration Loader
 * Safe validation and typed access to public environment variables.
 * 
 * IMPORTANT: In Expo, variables prefixed with EXPO_PUBLIC_ are embedded into the client bundle.
 * NEVER store critical secrets or private keys in EXPO_PUBLIC_ variables.
 */

export interface EnvConfig {
  apiUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  isDev: boolean;
}

export const env: EnvConfig = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  isDev: __DEV__,
};

/**
 * Validates whether essential environment variables are configured.
 * Does not throw; returns a diagnostic report to gracefully warn the UI.
 */
export function validateEnvironment(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  if (!env.supabaseUrl) {
    missing.push('EXPO_PUBLIC_SUPABASE_URL');
  }
  if (!env.supabaseAnonKey) {
    missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
