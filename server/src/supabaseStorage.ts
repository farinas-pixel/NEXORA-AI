/**
 * NEXORA AI — Supabase PostgREST Persistent Storage Adapter
 * Implements persistent task and memory storage using Supabase PostgREST HTTP API.
 * Adheres strictly to Row-Level Security (RLS) using the authenticated user's access token.
 * Never trusts user_id from request bodies or tool parameters.
 * Preserves AES-256-GCM encrypted vault format.
 * Budget: Strictly ₹0 personal investment.
 */

import crypto from 'crypto';
import { VaultCrypto } from './crypto';
import { TaskRecord, MemoryRecord, IMcpStorageAdapter } from './storage';

function getLocalDateISO(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeTaskDueDate(dueDate?: string): string {
  if (!dueDate || dueDate.trim() === '' || dueDate.trim().toLowerCase() === 'today') {
    return getLocalDateISO();
  }
  const trimmed = dueDate.trim();
  if (trimmed.toLowerCase() === 'tomorrow') {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return getLocalDateISO(tomorrow);
  }
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    const d = new Date(year, month - 1, day);
    if (d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day) {
      return trimmed;
    }
    throw new Error(`Invalid dueDate: "${dueDate}" represents a non-existent calendar date.`);
  }
  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid dueDate: "${dueDate}" is not a recognized date format. Expected YYYY-MM-DD, "Today", or "Tomorrow".`);
  }
  return getLocalDateISO(parsed);
}

export type CanonicalSecurityTier = 'low' | 'medium' | 'high' | 'critical';

export function normalizeSecurityTier(tier?: string): CanonicalSecurityTier {
  if (!tier) return 'low';
  const lower = tier.trim().toLowerCase();
  switch (lower) {
    case 'critical':
      return 'critical';
    case 'high':
    case 'sensitive':
      return 'high';
    case 'medium':
      return 'medium';
    case 'low':
    case 'standard':
    default:
      return 'low';
  }
}

export interface SupabaseStorageConfig {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  fetchFn?: typeof fetch;
}

function assertValidUserId(userId?: string): string {
  if (!userId || typeof userId !== 'string' || !userId.trim() || userId === 'legacy_owner') {
    throw new Error('Authentication required: a valid verified userId is required for storage operations.');
  }
  return userId.trim();
}

function assertValidAuthToken(authToken?: string): string {
  if (!authToken || typeof authToken !== 'string' || !authToken.trim()) {
    throw new Error('Authentication required: an authenticated user access token is required for Supabase database operations.');
  }
  return authToken.trim();
}

export class SupabaseStorageAdapter implements IMcpStorageAdapter {
  private supabaseUrl: string;
  private anonKey: string;
  private customFetch: typeof fetch;

  constructor(config?: SupabaseStorageConfig) {
    this.supabaseUrl = (
      config?.supabaseUrl ||
      process.env.SUPABASE_URL ||
      process.env.EXPO_PUBLIC_SUPABASE_URL ||
      ''
    ).replace(/\/+$/, '');

    this.anonKey =
      config?.supabaseAnonKey ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
      '';

    this.customFetch = config?.fetchFn || globalThis.fetch;
  }

  private ensureConfigured() {
    if (!this.supabaseUrl || !this.anonKey) {
      throw new Error(
        'Supabase configuration missing: SUPABASE_URL and SUPABASE_ANON_KEY must be set in the environment.'
      );
    }
  }

  private getHeaders(authToken: string): Record<string, string> {
    return {
      'apikey': this.anonKey,
      'Authorization': `Bearer ${assertValidAuthToken(authToken)}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    };
  }

  // --- TASKS (POSTGREST) ---

  public async addTask(
    userId: string,
    input: {
      title: string;
      description?: string;
      category?: 'daily' | 'study' | 'work' | 'fitness';
      dueDate?: string;
      priority?: 'low' | 'medium' | 'high';
    },
    authToken?: string
  ): Promise<TaskRecord> {
    this.ensureConfigured();
    const verifiedUid = assertValidUserId(userId);
    const token = assertValidAuthToken(authToken);

    const taskId = crypto.randomUUID();
    const now = new Date().toISOString();
    const dueDate = normalizeTaskDueDate(input.dueDate);

    const dbPayload = {
      id: taskId,
      user_id: verifiedUid,
      title: input.title.trim(),
      description: input.description?.trim() || '',
      category: input.category || 'daily',
      due_date: dueDate,
      priority: input.priority || 'medium',
      completed: false,
      created_at: now,
      updated_at: now,
    };

    const res = await this.customFetch(`${this.supabaseUrl}/rest/v1/tasks`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(dbPayload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      if (res.status === 401 || res.status === 403) {
        throw new Error('Database authorization failed: access token rejected by Row-Level Security.');
      }
      throw new Error(`Database error (HTTP ${res.status}): Failed to create task. ${errText ? errText.slice(0, 100) : ''}`);
    }

    const rows: any[] = await res.json();
    const row = rows[0] || dbPayload;

    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description || '',
      category: row.category,
      dueDate: row.due_date,
      priority: row.priority,
      completed: row.completed,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  public async getTasks(
    userId: string,
    filter?: {
      category?: string;
      completed?: boolean;
      search?: string;
    },
    authToken?: string
  ): Promise<TaskRecord[]> {
    this.ensureConfigured();
    const verifiedUid = assertValidUserId(userId);
    const token = assertValidAuthToken(authToken);

    const queryParams = new URLSearchParams({
      user_id: `eq.${verifiedUid}`,
      order: 'created_at.desc',
    });

    if (filter?.category && filter.category !== 'all') {
      queryParams.append('category', `eq.${filter.category}`);
    }
    if (filter?.completed !== undefined) {
      queryParams.append('completed', `eq.${filter.completed}`);
    }

    const res = await this.customFetch(`${this.supabaseUrl}/rest/v1/tasks?${queryParams.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error('Database authorization failed: access token rejected by Row-Level Security.');
      }
      throw new Error(`Database error (HTTP ${res.status}): Failed to fetch tasks.`);
    }

    const rows: any[] = await res.json();
    let tasks: TaskRecord[] = rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description || '',
      category: row.category,
      dueDate: row.due_date,
      priority: row.priority,
      completed: row.completed,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      tasks = tasks.filter((t) => t.title.toLowerCase().includes(q));
    }

    return tasks;
  }

  public async getTaskById(userId: string, id: string, authToken?: string): Promise<TaskRecord | undefined> {
    this.ensureConfigured();
    const verifiedUid = assertValidUserId(userId);
    const token = assertValidAuthToken(authToken);

    const queryParams = new URLSearchParams({
      id: `eq.${id}`,
      user_id: `eq.${verifiedUid}`,
    });

    const res = await this.customFetch(`${this.supabaseUrl}/rest/v1/tasks?${queryParams.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error('Database authorization failed: access token rejected by Row-Level Security.');
      }
      throw new Error(`Database error (HTTP ${res.status}): Failed to fetch task.`);
    }

    const rows: any[] = await res.json();
    if (!rows || rows.length === 0) return undefined;

    const row = rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description || '',
      category: row.category,
      dueDate: row.due_date,
      priority: row.priority,
      completed: row.completed,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  public async updateTask(
    userId: string,
    id: string,
    updates: Partial<{
      title: string;
      description?: string;
      category: 'daily' | 'study' | 'work' | 'fitness';
      dueDate: string;
      priority: 'low' | 'medium' | 'high';
      completed: boolean;
    }>,
    authToken?: string
  ): Promise<TaskRecord> {
    this.ensureConfigured();
    const verifiedUid = assertValidUserId(userId);
    const token = assertValidAuthToken(authToken);

    const dbPayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) dbPayload.title = updates.title.trim();
    if (updates.description !== undefined) dbPayload.description = updates.description.trim();
    if (updates.category !== undefined) dbPayload.category = updates.category;
    if (updates.dueDate !== undefined) dbPayload.due_date = normalizeTaskDueDate(updates.dueDate);
    if (updates.priority !== undefined) dbPayload.priority = updates.priority;
    if (updates.completed !== undefined) dbPayload.completed = updates.completed;

    const queryParams = new URLSearchParams({
      id: `eq.${id}`,
      user_id: `eq.${verifiedUid}`,
    });

    const res = await this.customFetch(`${this.supabaseUrl}/rest/v1/tasks?${queryParams.toString()}`, {
      method: 'PATCH',
      headers: this.getHeaders(token),
      body: JSON.stringify(dbPayload),
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error('Database authorization failed: access token rejected by Row-Level Security.');
      }
      throw new Error(`Database error (HTTP ${res.status}): Failed to update task.`);
    }

    const rows: any[] = await res.json();
    if (!rows || rows.length === 0) {
      throw new Error(`Task with ID "${id}" was not found or does not belong to this user.`);
    }

    const row = rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description || '',
      category: row.category,
      dueDate: row.due_date,
      priority: row.priority,
      completed: row.completed,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  public async deleteTask(userId: string, id: string, authToken?: string): Promise<TaskRecord> {
    this.ensureConfigured();
    const verifiedUid = assertValidUserId(userId);
    const token = assertValidAuthToken(authToken);

    const queryParams = new URLSearchParams({
      id: `eq.${id}`,
      user_id: `eq.${verifiedUid}`,
    });

    const res = await this.customFetch(`${this.supabaseUrl}/rest/v1/tasks?${queryParams.toString()}`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error('Database authorization failed: access token rejected by Row-Level Security.');
      }
      throw new Error(`Database error (HTTP ${res.status}): Failed to delete task.`);
    }

    const rows: any[] = await res.json();
    if (!rows || rows.length === 0) {
      throw new Error(`Task with ID "${id}" was not found or does not belong to this user.`);
    }

    const row = rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description || '',
      category: row.category,
      dueDate: row.due_date,
      priority: row.priority,
      completed: row.completed,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // --- MEMORIES (POSTGREST WITH AES-256-GCM VAULT) ---

  public async saveMemory(
    userId: string,
    input: {
      content: string;
      category?: 'personal' | 'preference' | 'study' | 'work' | 'health' | 'general';
      securityTier?: 'standard' | 'sensitive' | 'critical' | 'low' | 'medium' | 'high';
    },
    authToken?: string
  ): Promise<MemoryRecord> {
    this.ensureConfigured();
    const verifiedUid = assertValidUserId(userId);
    const token = assertValidAuthToken(authToken);

    const memoryId = crypto.randomUUID();
    const now = new Date().toISOString();
    const rawTier = input.securityTier || 'standard';
    const canonicalTier = normalizeSecurityTier(rawTier);
    const rawContent = input.content.trim();

    let displayContent = rawContent;
    let isProtected = false;
    let digest: string | null = null;
    let encryptedPayload: string | null = null;

    if (canonicalTier === 'critical') {
      const encrypted = VaultCrypto.encrypt(rawContent);
      encryptedPayload = VaultCrypto.serialize(encrypted);
      digest = encrypted.digest;
      displayContent = encrypted.displayMask;
      isProtected = true;
    }

    const dbPayload = {
      id: memoryId,
      user_id: verifiedUid,
      content: displayContent,
      category: input.category || 'personal',
      security_tier: canonicalTier,
      is_protected: isProtected,
      digest,
      encrypted_payload: encryptedPayload,
      created_at: now,
      updated_at: now,
    };

    const res = await this.customFetch(`${this.supabaseUrl}/rest/v1/memories`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(dbPayload),
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error('Database authorization failed: access token rejected by Row-Level Security.');
      }
      throw new Error(`Database error (HTTP ${res.status}): Failed to save memory.`);
    }

    const rows: any[] = await res.json();
    const row = rows[0] || dbPayload;

    return {
      id: row.id,
      userId: row.user_id,
      content: row.content,
      category: row.category,
      securityTier: normalizeSecurityTier(row.security_tier),
      isProtected: row.is_protected,
      digest: row.digest || undefined,
      encryptedPayload: row.encrypted_payload || undefined,
      createdAt: row.created_at || row.timestamp || now,
      updatedAt: row.updated_at || now,
    };
  }

  public async searchMemory(
    userId: string,
    query: string,
    category?: string,
    limit: number = 10,
    authToken?: string
  ): Promise<MemoryRecord[]> {
    this.ensureConfigured();
    const verifiedUid = assertValidUserId(userId);
    const token = assertValidAuthToken(authToken);

    const queryParams = new URLSearchParams({
      user_id: `eq.${verifiedUid}`,
      order: 'created_at.desc',
      limit: String(limit),
    });

    if (category && category !== 'all') {
      queryParams.append('category', `eq.${category}`);
    }

    const res = await this.customFetch(`${this.supabaseUrl}/rest/v1/memories?${queryParams.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error('Database authorization failed: access token rejected by Row-Level Security.');
      }
      throw new Error(`Database error (HTTP ${res.status}): Failed to query memories.`);
    }

    const rows: any[] = await res.json();
    const memories: MemoryRecord[] = rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      content: row.content,
      category: row.category,
      securityTier: normalizeSecurityTier(row.security_tier),
      isProtected: row.is_protected,
      digest: row.digest || undefined,
      encryptedPayload: row.encrypted_payload || undefined,
      createdAt: row.created_at || row.timestamp || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    }));

    const q = query.toLowerCase().trim();
    if (!q) return memories;

    return memories.filter(
      (m) => m.content.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)
    );
  }

  public async getMemories(userId: string, authToken?: string): Promise<MemoryRecord[]> {
    return this.searchMemory(userId, '', undefined, 100, authToken);
  }

  public async getDecryptedMemoryContent(
    userId: string,
    id: string,
    authToken?: string
  ): Promise<{ success: boolean; content: string; isDecrypted: boolean; note?: string }> {
    this.ensureConfigured();
    const verifiedUid = assertValidUserId(userId);
    const token = assertValidAuthToken(authToken);

    const queryParams = new URLSearchParams({
      id: `eq.${id}`,
      user_id: `eq.${verifiedUid}`,
    });

    const res = await this.customFetch(`${this.supabaseUrl}/rest/v1/memories?${queryParams.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error('Database authorization failed: access token rejected by Row-Level Security.');
      }
      throw new Error(`Database error (HTTP ${res.status}): Failed to retrieve memory.`);
    }

    const rows: any[] = await res.json();
    if (!rows || rows.length === 0) {
      throw new Error(`Memory with ID "${id}" was not found or does not belong to this user.`);
    }

    const memory = rows[0];

    if (!memory.is_protected) {
      return { success: true, content: memory.content, isDecrypted: false };
    }

    if (memory.encrypted_payload) {
      const parts = VaultCrypto.deserialize(memory.encrypted_payload);
      if (parts) {
        const decrypted = VaultCrypto.decrypt(parts);
        return { success: true, content: decrypted, isDecrypted: true };
      }
    }

    return {
      success: true,
      content: memory.content,
      isDecrypted: false,
      note: 'Legacy memory record was saved under one-way SHA-256 masking. Original plaintext was not preserved prior to AES-256-GCM migration.',
    };
  }
}
