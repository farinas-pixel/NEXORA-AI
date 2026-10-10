/**
 * NEXORA AI — Server-Side Authentication & Identity Verification
 * Validates Supabase JWT access tokens against the official Supabase Auth service.
 * Derives user identity strictly from verified token claims.
 * Never trusts client-supplied user IDs in request bodies.
 */

import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: string;
}

export interface AuthResult {
  authenticated: boolean;
  status: number;
  user?: AuthenticatedUser;
  token?: string;
  error?: string;
}

// In-memory test token mapping for deterministic local testing
const TEST_TOKENS: Record<string, AuthenticatedUser> = {
  'test-token-alice': { id: 'usr_alice_101', email: 'alice@nexora.test', role: 'authenticated' },
  'test-token-bob': { id: 'usr_bob_202', email: 'bob@nexora.test', role: 'authenticated' },
};

export async function verifyRequestIdentity(req: Request): Promise<AuthResult> {
  let authHeader = req.headers?.authorization;
  if (!authHeader && typeof req.query?.token === 'string') {
    if (process.env.NODE_ENV === 'production') {
      return {
        authenticated: false,
        status: 401,
        error: 'Insecure authentication rejected: Bearer tokens in query strings are disabled in production to prevent token leakage in access logs. Use Authorization: Bearer <token> header.',
      };
    }
    authHeader = `Bearer ${req.query.token.trim()}`;
  }

  if (!authHeader) {
    return {
      authenticated: false,
      status: 401,
      error: 'Missing Authorization header. Expected: Bearer <token>',
    };
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return {
      authenticated: false,
      status: 401,
      error: 'Invalid Authorization header format. Expected: Bearer <token>',
    };
  }

  const token = parts[1].trim();
  if (!token) {
    return {
      authenticated: false,
      status: 401,
      error: 'Empty bearer token supplied.',
    };
  }

  // 1. Check test tokens during local test runs
  if (process.env.NODE_ENV === 'test' && TEST_TOKENS[token]) {
    return {
      authenticated: true,
      status: 200,
      user: TEST_TOKENS[token],
      token,
    };
  }

  // 2. Production verification against Supabase Auth API
  const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return {
      authenticated: false,
      status: 503,
      error: 'Authentication service configuration is unavailable on the server.',
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: anonKey,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (!data?.id) {
        return {
          authenticated: false,
          status: 401,
          error: 'Invalid token: User ID could not be resolved from token payload.',
        };
      }
      return {
        authenticated: true,
        status: 200,
        user: {
          id: data.id,
          email: data.email,
          role: data.role || 'authenticated',
        },
        token,
      };
    }

    if (res.status === 401 || res.status === 403) {
      return {
        authenticated: false,
        status: 401,
        error: 'Invalid or expired Supabase authentication token.',
      };
    }

    return {
      authenticated: false,
      status: 401,
      error: `Authentication failed (HTTP ${res.status}).`,
    };
  } catch (err: any) {
    const isTimeout = err.name === 'AbortError';
    return {
      authenticated: false,
      status: isTimeout ? 504 : 502,
      error: isTimeout ? 'Authentication service verification timed out.' : 'Failed to reach Supabase Auth service.',
    };
  }
}
