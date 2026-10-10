/**
 * NEXORA AI — Sovereign Persistent Storage Engine with Per-User Data Isolation
 * Enforces per-user scoping for Tasks and Memory Vault.
 * Implements AES-256-GCM authenticated encryption for sensitive credentials.
 * Provides atomic, crash-safe disk writes and safe backward-compatible data migration.
 * Supports dual storage engines: JSON Local Vault & Supabase PostgREST Database.
 */

import fs from 'fs';
import path from 'path';
import { VaultCrypto } from './crypto';
import { SupabaseStorageAdapter } from './supabaseStorage';

export interface TaskRecord {
  id: string;
  userId: string; // Enforces user-scoped ownership
  title: string;
  description?: string;
  category: 'daily' | 'study' | 'work' | 'fitness';
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryRecord {
  id: string;
  userId: string; // Enforces user-scoped ownership
  content: string; // Safe display content (masked if critical)
  category: 'personal' | 'preference' | 'study' | 'work' | 'health' | 'general';
  securityTier: 'standard' | 'sensitive' | 'critical' | 'low' | 'medium' | 'high';
  isProtected: boolean;
  digest?: string; // 8-char SHA-256 verification digest
  encryptedPayload?: string; // AES-256-GCM serialized iv:authTag:ciphertext
  createdAt: string;
  updatedAt: string;
}

export interface IMcpStorageAdapter {
  addTask(
    userId: string,
    input: {
      title: string;
      description?: string;
      category?: 'daily' | 'study' | 'work' | 'fitness';
      dueDate?: string;
      priority?: 'low' | 'medium' | 'high';
    },
    authToken?: string
  ): Promise<TaskRecord> | TaskRecord;

  getTasks(
    userId: string,
    filter?: {
      category?: string;
      completed?: boolean;
      search?: string;
    },
    authToken?: string
  ): Promise<TaskRecord[]> | TaskRecord[];

  getTaskById(userId: string, id: string, authToken?: string): Promise<TaskRecord | undefined> | (TaskRecord | undefined);

  updateTask(
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
  ): Promise<TaskRecord> | TaskRecord;

  deleteTask(userId: string, id: string, authToken?: string): Promise<TaskRecord> | TaskRecord;

  saveMemory(
    userId: string,
    input: {
      content: string;
      category?: 'personal' | 'preference' | 'study' | 'work' | 'health' | 'general';
      securityTier?: 'standard' | 'sensitive' | 'critical' | 'low' | 'medium' | 'high';
    },
    authToken?: string
  ): Promise<MemoryRecord> | MemoryRecord;

  searchMemory(
    userId: string,
    query: string,
    category?: string,
    limit?: number,
    authToken?: string
  ): Promise<MemoryRecord[]> | MemoryRecord[];

  getMemories(userId: string, authToken?: string): Promise<MemoryRecord[]> | MemoryRecord[];

  getDecryptedMemoryContent(
    userId: string,
    id: string,
    authToken?: string
  ): Promise<{ success: boolean; content: string; isDecrypted: boolean; note?: string }> | { success: boolean; content: string; isDecrypted: boolean; note?: string };
}

export function validateProductionStorageConfiguration(): { valid: boolean; error?: string } {
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    return { valid: true };
  }

  const backend = process.env.STORAGE_BACKEND?.trim();
  if (!backend) {
    return {
      valid: false,
      error: 'FATAL CONFIGURATION ERROR: STORAGE_BACKEND is required in production and must be set to "supabase" to prevent data loss on ephemeral container disks. Refusing to operate with missing STORAGE_BACKEND.',
    };
  }

  if (backend.toLowerCase() === 'json') {
    return {
      valid: false,
      error: 'FATAL SECURITY/PERSISTENCE ERROR: STORAGE_BACKEND="json" is forbidden in production environments to prevent catastrophic data loss on ephemeral container restarts. Set STORAGE_BACKEND="supabase".',
    };
  }

  if (backend.toLowerCase() !== 'supabase') {
    return {
      valid: false,
      error: `FATAL CONFIGURATION ERROR: Invalid STORAGE_BACKEND="${backend}". Production environments strictly require STORAGE_BACKEND="supabase".`,
    };
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseUrl.trim()) {
    return {
      valid: false,
      error: 'FATAL CONFIGURATION ERROR: SUPABASE_URL is missing in production environment variables.',
    };
  }

  if (!anonKey || !anonKey.trim()) {
    return {
      valid: false,
      error: 'FATAL CONFIGURATION ERROR: SUPABASE_ANON_KEY is missing in production environment variables.',
    };
  }

  return { valid: true };
}

function assertValidUserId(userId?: string): string {
  if (!userId || typeof userId !== 'string' || !userId.trim() || userId === 'legacy_owner') {
    throw new Error('Authentication required: a valid verified userId is required for storage operations.');
  }
  return userId.trim();
}

export class McpPersistentStore implements IMcpStorageAdapter {
  private dataDir: string;
  private tasksFile: string;
  private memoriesFile: string;
  private tasks: TaskRecord[] = [];
  private memories: MemoryRecord[] = [];
  private isLoaded = false;
  private backend: 'json' | 'supabase';
  private supabaseAdapter?: IMcpStorageAdapter;

  constructor(customDataDir?: string, backend?: 'json' | 'supabase') {
    this.dataDir = customDataDir || process.env.NEXORA_DATA_DIR || path.resolve(__dirname, '../data');
    this.tasksFile = path.join(this.dataDir, 'tasks.json');
    this.memoriesFile = path.join(this.dataDir, 'memories.json');

    if (backend) {
      this.backend = backend;
    } else if (process.env.NODE_ENV === 'production') {
      const check = validateProductionStorageConfiguration();
      if (!check.valid) {
        throw new Error(check.error);
      }
      this.backend = 'supabase';
    } else {
      this.backend = process.env.STORAGE_BACKEND === 'supabase' ? 'supabase' : 'json';
    }

    this.init();
  }

  public setBackend(backend: 'json' | 'supabase', adapter?: IMcpStorageAdapter) {
    this.backend = backend;
    if (adapter) {
      this.supabaseAdapter = adapter;
    }
  }

  public getBackend(): 'json' | 'supabase' {
    return this.backend;
  }

  public setSupabaseAdapter(adapter: IMcpStorageAdapter) {
    this.supabaseAdapter = adapter;
  }

  public setDataDir(newDir: string) {
    this.dataDir = newDir;
    this.tasksFile = path.join(this.dataDir, 'tasks.json');
    this.memoriesFile = path.join(this.dataDir, 'memories.json');
    this.init();
  }

  public getDataDir(): string {
    return this.dataDir;
  }

  private init() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      if (fs.existsSync(this.tasksFile)) {
        const raw = fs.readFileSync(this.tasksFile, 'utf-8');
        const parsed: any[] = JSON.parse(raw);
        // Non-destructive backward-compatible migration: preserve unassigned legacy records
        this.tasks = parsed.map((t) => ({
          ...t,
          userId: t.userId || 'unassigned_legacy_owner',
        }));
      } else {
        this.tasks = [];
        this.persistTasks();
      }

      if (fs.existsSync(this.memoriesFile)) {
        const raw = fs.readFileSync(this.memoriesFile, 'utf-8');
        const parsed: any[] = JSON.parse(raw);
        // Non-destructive backward-compatible migration: preserve unassigned legacy records
        this.memories = parsed.map((m) => ({
          ...m,
          userId: m.userId || 'unassigned_legacy_owner',
        }));
      } else {
        this.memories = [];
        this.persistMemories();
      }

      this.isLoaded = true;
    } catch (err) {
      console.error('[McpPersistentStore] Initialization warning:', err);
      this.tasks = [];
      this.memories = [];
      this.isLoaded = true;
    }
  }

  private atomicWrite(filePath: string, data: any) {
    const tmpPath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 6)}`;
    try {
      fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmpPath, filePath);
    } catch (err) {
      if (fs.existsSync(tmpPath)) {
        try { fs.unlinkSync(tmpPath); } catch {}
      }
      throw err;
    }
  }

  private persistTasks() {
    this.atomicWrite(this.tasksFile, this.tasks);
  }

  private persistMemories() {
    this.atomicWrite(this.memoriesFile, this.memories);
  }

  private getActiveSupabaseAdapter(): IMcpStorageAdapter {
    if (!this.supabaseAdapter) {
      this.supabaseAdapter = new SupabaseStorageAdapter();
    }
    return this.supabaseAdapter;
  }

  // --- TASK METHODS (STRICTLY SCOPED BY USER ID) ---

  public addTask(
    userId: string,
    input: {
      title: string;
      description?: string;
      category?: 'daily' | 'study' | 'work' | 'fitness';
      dueDate?: string;
      priority?: 'low' | 'medium' | 'high';
    },
    authToken?: string
  ): Promise<TaskRecord> | TaskRecord {
    if (this.backend === 'supabase') {
      return this.getActiveSupabaseAdapter().addTask(userId, input, authToken);
    }

    if (!this.isLoaded) this.init();

    const targetUser = assertValidUserId(userId);
    const now = new Date().toISOString();
    const task: TaskRecord = {
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId: targetUser,
      title: input.title.trim(),
      description: input.description?.trim() || '',
      category: input.category || 'daily',
      dueDate: input.dueDate || 'Today',
      priority: input.priority || 'medium',
      completed: false,
      createdAt: now,
      updatedAt: now,
    };

    this.tasks.unshift(task);
    this.persistTasks();
    return task;
  }

  public getTasks(
    userId: string,
    filter?: {
      category?: string;
      completed?: boolean;
      search?: string;
    },
    authToken?: string
  ): Promise<TaskRecord[]> | TaskRecord[] {
    if (this.backend === 'supabase') {
      return this.getActiveSupabaseAdapter().getTasks(userId, filter, authToken);
    }

    if (!this.isLoaded) this.init();

    const targetUser = assertValidUserId(userId);
    return this.tasks.filter((t) => {
      // Enforce strict user isolation
      if (t.userId !== targetUser) return false;

      if (filter?.category && filter.category !== 'all' && t.category !== filter.category) {
        return false;
      }
      if (filter?.completed !== undefined && t.completed !== filter.completed) {
        return false;
      }
      if (filter?.search) {
        const q = filter.search.toLowerCase();
        if (!t.title.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }

  public getTaskById(userId: string, id: string, authToken?: string): Promise<TaskRecord | undefined> | (TaskRecord | undefined) {
    if (this.backend === 'supabase') {
      return this.getActiveSupabaseAdapter().getTaskById(userId, id, authToken);
    }

    if (!this.isLoaded) this.init();
    const targetUser = assertValidUserId(userId);
    return this.tasks.find((t) => t.id === id && t.userId === targetUser);
  }

  public updateTask(
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
  ): Promise<TaskRecord> | TaskRecord {
    if (this.backend === 'supabase') {
      return this.getActiveSupabaseAdapter().updateTask(userId, id, updates, authToken);
    }

    if (!this.isLoaded) this.init();

    const targetUser = assertValidUserId(userId);
    const idx = this.tasks.findIndex((t) => t.id === id && t.userId === targetUser);
    if (idx === -1) {
      throw new Error(`Task with ID "${id}" was not found or does not belong to this user.`);
    }

    const existing = this.tasks[idx];
    const updated: TaskRecord = {
      ...existing,
      ...(updates.title !== undefined ? { title: updates.title.trim() } : {}),
      ...(updates.description !== undefined ? { description: updates.description.trim() } : {}),
      ...(updates.category !== undefined ? { category: updates.category } : {}),
      ...(updates.dueDate !== undefined ? { dueDate: updates.dueDate } : {}),
      ...(updates.priority !== undefined ? { priority: updates.priority } : {}),
      ...(updates.completed !== undefined ? { completed: updates.completed } : {}),
      updatedAt: new Date().toISOString(),
    };

    this.tasks[idx] = updated;
    this.persistTasks();
    return updated;
  }

  public deleteTask(userId: string, id: string, authToken?: string): Promise<TaskRecord> | TaskRecord {
    if (this.backend === 'supabase') {
      return this.getActiveSupabaseAdapter().deleteTask(userId, id, authToken);
    }

    if (!this.isLoaded) this.init();

    const targetUser = assertValidUserId(userId);
    const idx = this.tasks.findIndex((t) => t.id === id && t.userId === targetUser);
    if (idx === -1) {
      throw new Error(`Task with ID "${id}" was not found or does not belong to this user.`);
    }

    const [deleted] = this.tasks.splice(idx, 1);
    this.persistTasks();
    return deleted;
  }

  // --- MEMORY VAULT METHODS (STRICTLY SCOPED BY USER ID) ---

  public saveMemory(
    userId: string,
    input: {
      content: string;
      category?: 'personal' | 'preference' | 'study' | 'work' | 'health' | 'general';
      securityTier?: 'standard' | 'sensitive' | 'critical' | 'low' | 'medium' | 'high';
    },
    authToken?: string
  ): Promise<MemoryRecord> | MemoryRecord {
    if (this.backend === 'supabase') {
      return this.getActiveSupabaseAdapter().saveMemory(userId, input, authToken);
    }

    if (!this.isLoaded) this.init();

    const targetUser = assertValidUserId(userId);
    const now = new Date().toISOString();
    const tier = input.securityTier || 'standard';
    const rawContent = input.content.trim();
    let displayContent = rawContent;
    let isProtected = false;
    let digest: string | undefined;
    let encryptedPayload: string | undefined;

    if (tier === 'critical') {
      // Apply authenticated AES-256-GCM encryption
      const encrypted = VaultCrypto.encrypt(rawContent);
      encryptedPayload = VaultCrypto.serialize(encrypted);
      digest = encrypted.digest;
      displayContent = encrypted.displayMask;
      isProtected = true;
    }

    const memory: MemoryRecord = {
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId: targetUser,
      content: displayContent,
      category: input.category || 'personal',
      securityTier: tier,
      isProtected,
      digest,
      encryptedPayload,
      createdAt: now,
      updatedAt: now,
    };

    this.memories.unshift(memory);
    this.persistMemories();
    return memory;
  }

  public searchMemory(
    userId: string,
    query: string,
    category?: string,
    limit: number = 10,
    authToken?: string
  ): Promise<MemoryRecord[]> | MemoryRecord[] {
    if (this.backend === 'supabase') {
      return this.getActiveSupabaseAdapter().searchMemory(userId, query, category, limit, authToken);
    }

    if (!this.isLoaded) this.init();

    const targetUser = assertValidUserId(userId);
    const q = query.toLowerCase().trim();
    const results = this.memories.filter((m) => {
      // Enforce strict user isolation
      if (m.userId !== targetUser) return false;

      if (category && category !== 'all' && m.category !== category) {
        return false;
      }
      if (!q) return true;
      return (
        m.content.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
      );
    });

    return results.slice(0, limit);
  }

  public getMemories(userId: string, authToken?: string): Promise<MemoryRecord[]> | MemoryRecord[] {
    if (this.backend === 'supabase') {
      return this.getActiveSupabaseAdapter().getMemories(userId, authToken);
    }

    if (!this.isLoaded) this.init();
    const targetUser = assertValidUserId(userId);
    return this.memories.filter((m) => m.userId === targetUser);
  }

  /**
   * Retrieve real decrypted plaintext for authorized owner.
   * If memory was created under legacy one-way hash, returns displayContent with notice.
   */
  public getDecryptedMemoryContent(
    userId: string,
    id: string,
    authToken?: string
  ): Promise<{ success: boolean; content: string; isDecrypted: boolean; note?: string }> | { success: boolean; content: string; isDecrypted: boolean; note?: string } {
    if (this.backend === 'supabase') {
      return this.getActiveSupabaseAdapter().getDecryptedMemoryContent(userId, id, authToken);
    }

    if (!this.isLoaded) this.init();

    const targetUser = assertValidUserId(userId);
    const memory = this.memories.find((m) => m.id === id && m.userId === targetUser);
    if (!memory) {
      throw new Error(`Memory with ID "${id}" was not found or does not belong to this user.`);
    }

    if (!memory.isProtected) {
      return { success: true, content: memory.content, isDecrypted: false };
    }

    if (memory.encryptedPayload) {
      const parts = VaultCrypto.deserialize(memory.encryptedPayload);
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

  public clearAll() {
    this.tasks = [];
    this.memories = [];
    this.persistTasks();
    this.persistMemories();
  }
}

export const mcpStore = new McpPersistentStore();
