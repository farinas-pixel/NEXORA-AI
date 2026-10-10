/**
 * NEXORA AI — Model Context Protocol (MCP) Client
 * Connects to standardized MCP tool providers with live connection probing & JSON-RPC 2.0
 * Strict No-Fake-Deployment Policy: Reports disconnected when server is unreachable.
 */
import { env } from '../../config/env';

export interface MCPServerInfo {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'unreachable';
  endpoint: string;
  type: 'local_node' | 'remote_gateway';
  version: string;
  toolsCount: number;
  lastChecked?: string;
}

const getMcpEndpoint = (path: string): string => {
  // EXPO_PUBLIC_MCP_URL is the dedicated endpoint for MCP server.
  // EXPO_PUBLIC_API_URL can only be used if it is an Express server backend, NOT a Supabase Edge Function URL.
  let base = '';
  if (env.mcpUrl && env.mcpUrl.trim()) {
    base = env.mcpUrl.trim();
  } else if (env.apiUrl && env.apiUrl.trim() && !env.apiUrl.includes('/functions/v1')) {
    base = env.apiUrl.trim();
  }

  if (!base) return '';
  const cleanBase = base.replace(/\/+$/, '');
  return `${cleanBase}${path}`;
};

const getInitialServers = (): MCPServerInfo[] => [
  {
    id: 'mcp_gateway',
    name: 'NEXORA Production MCP Gateway',
    description: 'Standard JSON-RPC 2.0 tool execution endpoint',
    status: 'disconnected',
    endpoint: getMcpEndpoint('/api/mcp/rpc'),
    type: 'remote_gateway',
    version: '1.0.0',
    toolsCount: 17,
  },
  {
    id: 'mcp_weather_node',
    name: 'Meteorology Satellite Link',
    description: 'Weather telemetry tool via MCP endpoint',
    status: 'disconnected',
    endpoint: getMcpEndpoint('/api/health'),
    type: 'remote_gateway',
    version: '1.0.4',
    toolsCount: 1,
  },
];

export const MCPClient = {
  get servers(): MCPServerInfo[] {
    return getInitialServers();
  },

  /**
   * Helper to retrieve current Supabase JWT token if user is signed in
   */
  async getAuthToken(): Promise<string | undefined> {
    try {
      const { supabase } = await import('../auth/supabaseClient');
      const { data } = await supabase.auth.getSession();
      return data?.session?.access_token || undefined;
    } catch {
      return undefined;
    }
  },

  /**
   * List all configured MCP servers with real live health probe
   */
  async getServers(): Promise<MCPServerInfo[]> {
    return Promise.all(
      this.servers.map(async (srv) => {
        if (!srv.endpoint) {
          return {
            ...srv,
            status: 'disconnected',
            lastChecked: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        }

        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 1200);

          const response = await fetch(srv.endpoint, {
            method: 'GET',
            signal: controller.signal,
          });
          clearTimeout(timer);

          const isHealthy = response.ok;
          return {
            ...srv,
            status: isHealthy ? 'connected' : 'disconnected',
            lastChecked: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        } catch {
          return {
            ...srv,
            status: 'disconnected',
            lastChecked: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        }
      })
    );
  },

  /**
   * Real check against live server
   */
  async checkHealth(endpoint: string): Promise<boolean> {
    if (!endpoint) return false;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(endpoint, { method: 'GET', signal: controller.signal });
      clearTimeout(timer);
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Standard JSON-RPC 2.0 tool execution with optional Bearer token and timeout
   */
  async callRpc(
    endpoint: string,
    method: string,
    params: Record<string, unknown> = {},
    authToken?: string,
    timeoutMs: number = 5000
  ): Promise<any> {
    if (!endpoint) {
      throw new Error('MCP endpoint is not configured.');
    }

    const payload = {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authToken && authToken.trim()) {
      headers['Authorization'] = `Bearer ${authToken.trim()}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const responseText = await res.text().catch(() => '');
      let parsedBody: any = null;
      try {
        parsedBody = responseText ? JSON.parse(responseText) : null;
      } catch {
        parsedBody = null;
      }

      if (!res.ok) {
        const errorDetail = parsedBody?.error?.message || responseText || res.statusText;
        throw new Error(`MCP RPC HTTP Error ${res.status}: ${errorDetail}`);
      }

      if (!parsedBody) {
        throw new Error('MCP RPC returned empty or non-JSON response.');
      }

      return parsedBody;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`MCP RPC request timed out after ${timeoutMs}ms.`);
      }
      if (err.message && (err.message.includes('Network request failed') || err.message.includes('fetch failed') || err.message.includes('ECONNREFUSED'))) {
        throw new Error(`MCP Gateway unreachable at "${endpoint}". Ensure the MCP backend is deployed and running.`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  },

  /**
   * High-level MCP Tool Invocation via tools/call.
   * If authToken is omitted, automatically attempts to retrieve active Supabase JWT session.
   * Normalizes standard MCP Content array response to parsed payload.
   */
  async callTool(
    toolName: string,
    toolArgs: Record<string, unknown> = {},
    authToken?: string,
    timeoutMs: number = 5000
  ): Promise<any> {
    const endpoint = getMcpEndpoint('/api/mcp/rpc');
    if (!endpoint) {
      throw new Error('MCP Gateway endpoint is not configured (EXPO_PUBLIC_MCP_URL missing).');
    }

    let token = authToken;
    if (!token) {
      token = await this.getAuthToken();
    }

    const response = await this.callRpc(
      endpoint,
      'tools/call',
      {
        name: toolName,
        arguments: toolArgs,
      },
      token,
      timeoutMs
    );

    if (response?.error) {
      throw new Error(`MCP Tool Error (${response.error.code}): ${response.error.message}`);
    }

    const result = response?.result;
    // Standard MCP tools/call returns: { content: [{ type: 'text', text: '...' }], isError?: boolean }
    if (result && Array.isArray(result.content) && result.content[0]?.text) {
      const rawText = result.content[0].text;
      try {
        const parsed = JSON.parse(rawText);
        return parsed;
      } catch {
        return rawText;
      }
    }

    return result;
  },
};
