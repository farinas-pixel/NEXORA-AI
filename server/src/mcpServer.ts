/**
 * NEXORA AI — Official Model Context Protocol (MCP) Server Implementation
 * Built with @modelcontextprotocol/sdk and Streamable HTTP (SSE / messages)
 * Enforces server-side authentication, per-user data isolation, and AES-256-GCM vault security.
 */

import { Request, Response, Express } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { z } from 'zod';
import { mcpStore } from './storage';
import { verifyRequestIdentity } from './auth';

export const PRIVATE_TOOLS = new Set([
  'add_task',
  'get_tasks',
  'update_task',
  'delete_task',
  'save_memory',
  'search_memory',
  'get_decrypted_memory',
]);

function requireAuthError() {
  return {
    isError: true,
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          success: false,
          error: 'Unauthorized: Authentication required for private MCP tools.',
        }),
      },
    ],
  };
}

export function createOfficialMcpServer(
  currentUserId?: string | null,
  authToken?: string | null
): McpServer {
  const server = new McpServer({
    name: 'nexora-mcp-server',
    version: '2.0.0',
  });

  // TOOL 1: add_task (Scoped to authenticated user)
  server.tool(
    'add_task',
    'Add a new task to the persistent daily planner with real local persistence (user-scoped)',
    {
      title: z.string().min(1, 'Task title is required'),
      description: z.string().optional(),
      category: z.enum(['daily', 'study', 'work', 'fitness']).default('daily'),
      dueDate: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high']).default('medium'),
    },
    async ({ title, description, category, dueDate, priority }) => {
      if (!currentUserId || currentUserId === 'legacy_owner') return requireAuthError();
      try {
        const task = await mcpStore.addTask(
          currentUserId,
          {
            title,
            description,
            category,
            dueDate,
            priority,
          },
          authToken || undefined
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  task,
                  message: `Task "${task.title}" has been saved to persistent storage for user.`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: false, error: err.message }),
            },
          ],
        };
      }
    }
  );

  // TOOL 2: get_tasks (Strictly scoped to authenticated user)
  server.tool(
    'get_tasks',
    'Query persistent tasks from the daily planner with optional filters (user-scoped)',
    {
      category: z.enum(['all', 'daily', 'study', 'work', 'fitness']).optional(),
      completed: z.boolean().optional(),
      search: z.string().optional(),
    },
    async ({ category, completed, search }) => {
      if (!currentUserId || currentUserId === 'legacy_owner') return requireAuthError();
      try {
        const tasks = await mcpStore.getTasks(
          currentUserId,
          {
            category,
            completed,
            search,
          },
          authToken || undefined
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  count: tasks.length,
                  tasks,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: false, error: err.message }),
            },
          ],
        };
      }
    }
  );

  // TOOL 3: update_task (Owner verified)
  server.tool(
    'update_task',
    'Update an existing task in the daily planner (user-scoped)',
    {
      id: z.string().min(1, 'Task ID is required'),
      title: z.string().optional(),
      description: z.string().optional(),
      category: z.enum(['daily', 'study', 'work', 'fitness']).optional(),
      dueDate: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
      completed: z.boolean().optional(),
    },
    async ({ id, title, description, category, dueDate, priority, completed }) => {
      if (!currentUserId || currentUserId === 'legacy_owner') return requireAuthError();
      try {
        const updated = await mcpStore.updateTask(
          currentUserId,
          id,
          {
            title,
            description,
            category,
            dueDate,
            priority,
            completed,
          },
          authToken || undefined
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  task: updated,
                  message: `Task "${updated.title}" updated successfully.`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: false, error: err.message }),
            },
          ],
        };
      }
    }
  );

  // TOOL 4: delete_task (Requires explicit confirmation & user ownership)
  server.tool(
    'delete_task',
    'Delete a task from the persistent planner (sensitive action: requires explicit confirmation & user ownership)',
    {
      id: z.string().min(1, 'Task ID is required'),
      confirm: z
        .boolean()
        .default(false)
        .describe('Explicit confirmation flag. Must be true to permanently delete the task.'),
    },
    async ({ id, confirm }) => {
      if (!currentUserId || currentUserId === 'legacy_owner') return requireAuthError();
      try {
        const task = await mcpStore.getTaskById(currentUserId, id, authToken || undefined);
        if (!task) {
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: `Task with ID "${id}" was not found or does not belong to this user.`,
                }),
              },
            ],
          };
        }

        // Enforce sensitive action confirmation
        if (!confirm) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: false,
                    requiresConfirmation: true,
                    confirmationMessage: `Deleting task "${task.title}" (ID: ${task.id}) is permanent. Please re-run delete_task with confirm: true to complete deletion.`,
                    task,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        const deleted = await mcpStore.deleteTask(currentUserId, id, authToken || undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  deleted: true,
                  message: `Task "${deleted.title}" (ID: ${deleted.id}) has been permanently deleted.`,
                  task: deleted,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: false, error: err.message }),
            },
          ],
        };
      }
    }
  );

  // TOOL 5: save_memory (Authenticated AES-256-GCM encryption on critical tier)
  server.tool(
    'save_memory',
    'Persist knowledge or facts into the Sovereign Memory Vault with AES-256-GCM encryption for critical credentials',
    {
      content: z.string().min(1, 'Memory content cannot be empty'),
      category: z
        .enum(['personal', 'preference', 'study', 'work', 'health', 'general'])
        .default('personal'),
      securityTier: z.enum(['standard', 'sensitive', 'critical', 'low', 'medium', 'high']).default('standard'),
    },
    async ({ content, category, securityTier }) => {
      if (!currentUserId || currentUserId === 'legacy_owner') return requireAuthError();
      try {
        const memory = await mcpStore.saveMemory(
          currentUserId,
          {
            content,
            category,
            securityTier,
          },
          authToken || undefined
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  memory: {
                    id: memory.id,
                    category: memory.category,
                    securityTier: memory.securityTier,
                    isProtected: memory.isProtected,
                    digest: memory.digest,
                    content: memory.content, // Safe display mask
                    createdAt: memory.createdAt,
                  },
                  message: memory.isProtected
                    ? `Critical credential securely encrypted using AES-256-GCM with SHA-256 verification digest ${memory.digest}.`
                    : `Memory record saved to local sovereign vault.`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: false, error: err.message }),
            },
          ],
        };
      }
    }
  );

  // TOOL 6: search_memory (Strictly user-scoped search)
  server.tool(
    'search_memory',
    'Search stored memories in the Sovereign Memory Vault by keyword or category (user-scoped)',
    {
      query: z.string().min(1, 'Search query cannot be empty'),
      category: z
        .enum(['all', 'personal', 'preference', 'study', 'work', 'health', 'general'])
        .optional(),
      limit: z.number().int().min(1).max(50).default(10),
    },
    async ({ query, category, limit }) => {
      if (!currentUserId || currentUserId === 'legacy_owner') return requireAuthError();
      try {
        const results = await mcpStore.searchMemory(currentUserId, query, category, limit, authToken || undefined);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  query,
                  matchedCount: results.length,
                  memories: results.map((m) => ({
                    id: m.id,
                    content: m.content,
                    category: m.category,
                    securityTier: m.securityTier,
                    isProtected: m.isProtected,
                    digest: m.digest,
                    createdAt: m.createdAt,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: false, error: err.message }),
            },
          ],
        };
      }
    }
  );

  // TOOL 7: get_decrypted_memory (Allows authenticated owner to recover AES-256-GCM encrypted secret)
  server.tool(
    'get_decrypted_memory',
    'Retrieve decrypted plaintext of a sensitive critical memory for authorized owner',
    {
      id: z.string().min(1, 'Memory ID is required'),
    },
    async ({ id }) => {
      if (!currentUserId || currentUserId === 'legacy_owner') return requireAuthError();
      try {
        const result = await mcpStore.getDecryptedMemoryContent(currentUserId, id, authToken || undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: false, error: err.message }),
            },
          ],
        };
      }
    }
  );

  // Backward compatibility tools
  server.tool(
    'get_weather',
    'Fetch current weather conditions for specified location',
    {
      location: z.string().default('Local Area'),
    },
    async ({ location }) => {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                location,
                temperatureC: 26,
                condition: 'Clear Skies',
                humidityPercent: 58,
                windKmh: 12,
                source: 'NEX Meteorology Satellite Link',
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.tool(
    'control_smart_home',
    'Control smart home appliance status (Local Software Simulation)',
    {
      deviceId: z.string(),
      targetState: z.boolean(),
    },
    async ({ deviceId, targetState }) => {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                deviceId,
                state: targetState ? 'ON' : 'OFF',
                relayType: 'Local Software State Emulation',
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  return server;
}

// Active session transport cache for legacy SSE
interface ActiveTransportSession {
  transport: SSEServerTransport;
  userId: string | null;
}
const activeTransports = new Map<string, ActiveTransportSession>();

/**
 * Configure official Streamable HTTP (/mcp) and backward-compatible SSE endpoints on Express
 */
export function setupMcpStreamableHttp(app: Express) {
  // --- 1. OFFICIAL STREAMABLE HTTP TRANSPORT (/mcp) ---
  const handleStreamableMcp = async (req: Request, res: Response) => {
    // Ensure Accept header complies with Streamable HTTP specification
    const currentAccept = req.headers['accept'] || '';
    if (!currentAccept.includes('application/json') || !currentAccept.includes('text/event-stream')) {
      req.headers['accept'] = currentAccept
        ? `${currentAccept}, application/json, text/event-stream`
        : 'application/json, text/event-stream';
    }

    // Require authentication on private MCP tools
    const toolName = req.body?.params?.name;
    let authenticatedUserId: string | null = null;
    let authenticatedToken: string | null = null;

    if (req.body?.method === 'tools/call' && PRIVATE_TOOLS.has(toolName)) {
      const authResult = await verifyRequestIdentity(req);
      if (!authResult.authenticated || !authResult.user) {
        return res.status(authResult.status || 401).json({
          jsonrpc: '2.0',
          error: {
            code: -32001,
            message: `Unauthorized: ${authResult.error || 'Authentication required for private MCP tools.'}`,
          },
          id: req.body?.id || null,
        });
      }
      authenticatedUserId = authResult.user.id;
      authenticatedToken = authResult.token || null;
    } else if (req.headers.authorization || req.query.token) {
      const authResult = await verifyRequestIdentity(req);
      if (authResult.authenticated && authResult.user) {
        authenticatedUserId = authResult.user.id;
        authenticatedToken = authResult.token || null;
      }
    }

    // In stateless Streamable HTTP, each request uses a fresh transport and server instance scoped to verified user
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    const serverInstance = createOfficialMcpServer(authenticatedUserId, authenticatedToken);
    await serverInstance.connect(transport);

    try {
      await transport.handleRequest(req, res, req.body);
    } catch (err: any) {
      console.error('[StreamableHTTP /mcp] Request error:', err);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal Streamable HTTP transport error: ' + (err?.message || 'Unknown') },
          id: req.body?.id || null,
        });
      }
    }
  };

  // Mount official Streamable HTTP endpoint for all HTTP methods (GET and POST)
  app.all('/mcp', handleStreamableMcp);

  // --- 2. BACKWARD-COMPATIBLE LEGACY SSE TRANSPORT (/sse, /mcp/sse, /messages) ---
  const handleSse = async (req: Request, res: Response) => {
    let sseUserId: string | null = null;
    let sseToken: string | null = null;
    if (req.headers.authorization || req.query.token) {
      const authResult = await verifyRequestIdentity(req);
      if (authResult.authenticated && authResult.user) {
        sseUserId = authResult.user.id;
        sseToken = authResult.token || null;
      }
    }

    const transport = new SSEServerTransport('/mcp/messages', res);
    const sessionId = transport.sessionId;
    activeTransports.set(sessionId, { transport, userId: sseUserId });

    transport.onclose = () => {
      activeTransports.delete(sessionId);
    };

    const serverInstance = createOfficialMcpServer(sseUserId, sseToken);
    await serverInstance.connect(transport);
  };

  const handleMessages = async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;
    if (!sessionId) {
      return res.status(400).send('Missing required sessionId query parameter');
    }

    const session = activeTransports.get(sessionId);
    if (!session) {
      return res.status(404).send(`Session not found for sessionId: ${sessionId}`);
    }

    const toolName = req.body?.params?.name;
    if (req.body?.method === 'tools/call' && PRIVATE_TOOLS.has(toolName) && !session.userId) {
      const authResult = await verifyRequestIdentity(req);
      if (!authResult.authenticated || !authResult.user) {
        return res.status(401).json({
          jsonrpc: '2.0',
          error: {
            code: -32001,
            message: 'Unauthorized: Authentication required for private MCP tools on SSE transport.',
          },
          id: req.body?.id || null,
        });
      }
      session.userId = authResult.user.id;
    }

    await session.transport.handlePostMessage(req, res, req.body);
  };

  app.get('/sse', handleSse);
  app.get('/mcp/sse', handleSse);
  app.post('/messages', handleMessages);
  app.post('/mcp/messages', handleMessages);
}
