/**
 * NEXORA AI — Environment Configuration Loader
 * Safe validation and typed access to public environment variables.
 * 
 * IMPORTANT: In Expo, variables prefixed with EXPO_PUBLIC_ are embedded into the client bundle.
 * NEVER store critical secrets or private keys in EXPO_PUBLIC_ variables.
 */

const resolveApiUrl = (): string => {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) {
    return configured;
  }
  return '';
};

const resolveMcpUrl = (): string => {
  const configured = process.env.EXPO_PUBLIC_MCP_URL?.trim();
  if (configured) {
    return configured;
  }
  return '';
};

export interface EnvConfig {
  apiUrl: string;
  mcpUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  isDev: boolean;
}

export const env: EnvConfig = {
  apiUrl: resolveApiUrl(),
  mcpUrl: resolveMcpUrl(),
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
  if (!env.apiUrl) {
    missing.push('EXPO_PUBLIC_API_URL');
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
