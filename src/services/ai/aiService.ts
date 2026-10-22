// src/services/ai/aiService.ts
// Client service that forwards AI requests to the configured production backend gateway.
import { env } from '../../config/env';
import { supabase } from '../auth/supabaseClient';

export interface GeneratePayload {
  userId: string;
  conversationId: string;
  message: string;
  /** Optional additional context (systemPrompt, recentMessages, etc.) */
  context?: any;
}

export interface AIResponse {
  text: string;
  model: string;
}

/** Resolves the full target URL for the AI chat endpoint */
function getEndpointUrl(): string {
  if (env.apiUrl && env.apiUrl.trim() !== '') {
    const trimmed = env.apiUrl.trim().replace(/\/+$/, '');
    if (trimmed.endsWith('/ai-chat') || trimmed.endsWith('/chat')) {
      return trimmed;
    }
    if (trimmed.includes('/functions/v1')) {
      return `${trimmed}/ai-chat`;
    }
    return `${trimmed}/api/ai/chat`;
  }

  // Fallback to project-default Supabase Edge Function if env.supabaseUrl is available
  if (env.supabaseUrl && env.supabaseUrl.trim() !== '') {
    const base = env.supabaseUrl.trim().replace(/\/+$/, '');
    return `${base}/functions/v1/ai-chat`;
  }

  return '';
}

/** Calls the backend AI chat endpoint and returns the assistant text and model. */
export async function generateResponse(payload: GeneratePayload): Promise<AIResponse> {
  const primaryUrl = getEndpointUrl();
  const candidateUrls: string[] = [];

  if (primaryUrl) {
    candidateUrls.push(primaryUrl);
  }

  // Also include deployed MCP gateway /api/ai/chat as fallback candidate if primary is Supabase Function
  if (env.mcpUrl && env.mcpUrl.trim() !== '') {
    const cleanMcp = env.mcpUrl.trim().replace(/\/+$/, '');
    const mcpAiUrl = `${cleanMcp}/api/ai/chat`;
    if (!candidateUrls.includes(mcpAiUrl)) {
      candidateUrls.push(mcpAiUrl);
    }
  }

  if (candidateUrls.length === 0) {
    throw new Error('NEXORA AI endpoint is not configured. Please verify EXPO_PUBLIC_API_URL or EXPO_PUBLIC_MCP_URL.');
  }

  // Retrieve current authenticated Supabase session token
  let accessToken: string | undefined;
  try {
    const { data } = await supabase.auth.getSession();
    accessToken = data?.session?.access_token;
  } catch (authErr) {
    console.warn('[aiService] Could not retrieve session token:', authErr);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  if (env.supabaseAnonKey) {
    headers['apikey'] = env.supabaseAnonKey;
  }

  let lastError: Error | null = null;

  for (const targetUrl of candidateUrls) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      const isExpressBackend = targetUrl.includes('/api/ai/chat');
      const requestBody = isExpressBackend
        ? {
            prompt: payload.message,
            history: payload.context?.recentMessages?.map((m: any) => ({
              role: m.role === 'assistant' ? 'model' : m.role,
              content: m.content,
            })),
            activeMode: payload.context?.inferredContext || 'general',
            systemPrompt: payload.context?.systemPrompt,
          }
        : payload;

      const resp = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!resp.ok) {
        const errorText = await resp.text();
        let parsedMessage = errorText;
        try {
          const parsedJson = JSON.parse(errorText);
          if (parsedJson.error) {
            parsedMessage = parsedJson.error;
          }
        } catch {}
        throw new Error(`AI service error (${resp.status}): ${parsedMessage.slice(0, 150)}`);
      }

      const data = await resp.json();
      if (!data.success) {
        throw new Error(data.error ?? 'AI service failed');
      }
      return { text: data.text, model: data.model };
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name === 'AbortError') {
        lastError = new Error('AI request timed out. Please check your internet connection.');
      } else {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }
  }

  throw lastError || new Error('Could not connect to NEXORA AI backend.');
}
