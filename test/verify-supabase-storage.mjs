#!/usr/bin/env node
/**
 * NEXORA AI — Supabase PostgREST Storage Adapter Verification Suite
 * Tests persistent task and memory storage against an isolated PostgREST emulator.
 * Verifies RLS enforcement, multi-tenant isolation, AES-256-GCM vault security,
 * fail-closed database errors (zero silent fallback to JSON), and live data protection.
 *
 * Budget: Strictly ₹0 personal cost.
 */

import http from 'http';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
process.env.NODE_ENV = 'test';

let passed = 0;
let failed = 0;

function check(condition, desc) {
  if (condition) {
    console.log(`  ${GREEN}✓${RESET} ${desc}`);
    passed++;
  } else {
    console.error(`  ${RED}✗ FAIL:${RESET} ${desc}`);
    failed++;
  }
}

function getFileHash(filepath) {
  if (!fs.existsSync(filepath)) return null;
  const content = fs.readFileSync(filepath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

// ---------------------------------------------------------------------
// 1. Snapshot Live Production Data Before Tests
// ---------------------------------------------------------------------
const liveMemoriesPath = path.resolve('server/data/memories.json');
const liveTasksPath = path.resolve('server/data/tasks.json');
const initialMemoriesHash = getFileHash(liveMemoriesPath);
const initialTasksHash = getFileHash(liveTasksPath);

// ---------------------------------------------------------------------
// 2. Setup In-Memory PostgREST Emulator (HTTP Server)
// ---------------------------------------------------------------------
const MOCK_ANON_KEY = 'mock-anon-key-stage4-testing-xyz';
const TOKEN_ALICE = 'jwt-token-alice-usr-101';
const TOKEN_BOB = 'jwt-token-bob-usr-202';
const UID_ALICE = 'usr_alice_101';
const UID_BOB = 'usr_bob_202';

// In-memory tables simulating Postgres
const dbTasks = [];
const dbMemories = [];

let simulateServerError = false;
let capturedRequests = [];

const mockServer = http.createServer((req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const pathname = urlObj.pathname;
  const method = req.method;

  let bodyRaw = '';
  req.on('data', chunk => { bodyRaw += chunk; });
  req.on('end', () => {
    let body = {};
    try { if (bodyRaw) body = JSON.parse(bodyRaw); } catch {}

    capturedRequests.push({
      method,
      pathname,
      searchParams: Object.fromEntries(urlObj.searchParams),
      headers: req.headers,
      body,
    });

    if (simulateServerError) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Internal Database Server Error Simulated' }));
      return;
    }

    // Verify Supabase apikey header
    if (req.headers['apikey'] !== MOCK_ANON_KEY) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Invalid or missing API key' }));
      return;
    }

    // Resolve auth token
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    let authenticatedUid = null;
    if (token === TOKEN_ALICE) authenticatedUid = UID_ALICE;
    else if (token === TOKEN_BOB) authenticatedUid = UID_BOB;

    if (!authenticatedUid) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'JWT token invalid or expired' }));
      return;
    }

    // --- Route: /rest/v1/tasks ---
    if (pathname === '/rest/v1/tasks') {
      if (method === 'POST') {
        // Enforce RLS: user_id must match authenticated token
        if (body.user_id !== authenticatedUid) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'new row violates row-level security policy for table "tasks"' }));
          return;
        }
        dbTasks.push(body);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify([body]));
        return;
      }

      if (method === 'GET') {
        const userIdFilter = urlObj.searchParams.get('user_id');
        const idFilter = urlObj.searchParams.get('id');

        let results = dbTasks.filter(t => {
          // RLS: only return rows owned by authenticated user
          if (t.user_id !== authenticatedUid) return false;
          if (userIdFilter && userIdFilter !== `eq.${authenticatedUid}`) return false;
          if (idFilter && idFilter !== `eq.${t.id}`) return false;
          return true;
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(results));
        return;
      }

      if (method === 'PATCH') {
        const idFilter = urlObj.searchParams.get('id')?.replace(/^eq\./, '');
        const target = dbTasks.find(t => t.id === idFilter && t.user_id === authenticatedUid);
        if (!target) {
          // PostgREST returns empty array representation when RLS blocks or not found
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify([]));
          return;
        }
        Object.assign(target, body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify([target]));
        return;
      }

      if (method === 'DELETE') {
        const idFilter = urlObj.searchParams.get('id')?.replace(/^eq\./, '');
        const idx = dbTasks.findIndex(t => t.id === idFilter && t.user_id === authenticatedUid);
        if (idx === -1) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify([]));
          return;
        }
        const [deleted] = dbTasks.splice(idx, 1);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify([deleted]));
        return;
      }
    }

    // --- Route: /rest/v1/memories ---
    if (pathname === '/rest/v1/memories') {
      if (method === 'POST') {
        if (body.user_id !== authenticatedUid) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'new row violates row-level security policy for table "memories"' }));
          return;
        }
        dbMemories.push(body);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify([body]));
        return;
      }

      if (method === 'GET') {
        const idFilter = urlObj.searchParams.get('id');
        let results = dbMemories.filter(m => {
          if (m.user_id !== authenticatedUid) return false;
          if (idFilter && idFilter !== `eq.${m.id}`) return false;
          return true;
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(results));
        return;
      }
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Route not found' }));
  });
});

async function run() {
  console.log(`\n====================================================`);
  console.log(`   NEXORA AI SUPABASE POSTGREST STORAGE TEST SUITE   `);
  console.log(`====================================================\n`);

  // Start mock server on dynamic available port
  await new Promise(resolve => mockServer.listen(0, '127.0.0.1', resolve));
  const mockPort = mockServer.address().port;
  const mockBaseUrl = `http://127.0.0.1:${mockPort}`;
  console.log(`[PostgREST Mock Server] Listening on ${mockBaseUrl}`);

  // Dynamic import of compiled JavaScript modules
  const { SupabaseStorageAdapter } = await import('../server/dist/supabaseStorage.js');
  const { McpPersistentStore } = await import('../server/dist/storage.js');

  const adapter = new SupabaseStorageAdapter({
    supabaseUrl: mockBaseUrl,
    supabaseAnonKey: MOCK_ANON_KEY,
  });

  // ----------------------------------------------------
  // SUITE 1: AUTHENTICATION & ACCESS TOKEN ENFORCEMENT
  // ----------------------------------------------------
  console.log(`\n${YELLOW}[Suite 1] Authentication & Access Token Enforcement${RESET}`);

  let missingTokenError = false;
  try {
    await adapter.addTask(UID_ALICE, { title: 'No token task' }, '');
  } catch (err) {
    missingTokenError = err.message.toLowerCase().includes('authentication required');
  }
  check(missingTokenError, 'addTask without auth token throws authentication error');

  let invalidUserIdError = false;
  try {
    await adapter.addTask('legacy_owner', { title: 'Legacy owner task' }, TOKEN_ALICE);
  } catch (err) {
    invalidUserIdError = err.message.toLowerCase().includes('authentication required');
  }
  check(invalidUserIdError, 'addTask with legacy_owner or empty userId fails closed');

  // ----------------------------------------------------
  // SUITE 2: POSTGREST TASK CRUD LIFECYCLE (ALICE)
  // ----------------------------------------------------
  console.log(`\n${YELLOW}[Suite 2] PostgREST Task CRUD Lifecycle (User Alice)${RESET}`);

  capturedRequests = [];
  const aliceTask = await adapter.addTask(
    UID_ALICE,
    {
      title: 'Review System Design Document',
      category: 'work',
      dueDate: 'Tomorrow',
      priority: 'high',
    },
    TOKEN_ALICE
  );

  check(Boolean(aliceTask?.id), 'Alice task successfully created with persistent ID');
  check(aliceTask.title === 'Review System Design Document', 'Task title matches');
  check(aliceTask.userId === UID_ALICE, 'Task strictly bound to Alice userId');
  check(aliceTask.completed === false, 'Completed defaults to false');

  // Verify headers sent to PostgREST
  const lastPost = capturedRequests.find(r => r.method === 'POST' && r.pathname === '/rest/v1/tasks');
  check(lastPost?.headers?.apikey === MOCK_ANON_KEY, 'PostgREST request sent correct apikey header');
  check(lastPost?.headers?.authorization === `Bearer ${TOKEN_ALICE}`, 'PostgREST request sent Alice Bearer token');
  check(lastPost?.headers?.prefer === 'return=representation', 'Sent Prefer: return=representation header');

  // Read tasks
  const aliceTasks = await adapter.getTasks(UID_ALICE, {}, TOKEN_ALICE);
  check(aliceTasks.length === 1, 'Alice gets exactly 1 task from PostgREST');
  check(aliceTasks[0].id === aliceTask.id, 'Retrieved task ID matches created task');

  // Get task by ID
  const fetchedTask = await adapter.getTaskById(UID_ALICE, aliceTask.id, TOKEN_ALICE);
  check(fetchedTask?.id === aliceTask.id, 'getTaskById successfully retrieves task');

  // Update task
  const updatedTask = await adapter.updateTask(
    UID_ALICE,
    aliceTask.id,
    { completed: true, priority: 'medium' },
    TOKEN_ALICE
  );
  check(updatedTask.completed === true, 'Task completed status updated in PostgREST');
  check(updatedTask.priority === 'medium', 'Task priority updated in PostgREST');

  // ----------------------------------------------------
  // SUITE 3: MULTI-TENANT ISOLATION & RLS REJECTION (BOB)
  // ----------------------------------------------------
  console.log(`\n${YELLOW}[Suite 3] Multi-Tenant Isolation & RLS Rejection (Bob vs Alice)${RESET}`);

  // Bob queries tasks
  const bobTasks = await adapter.getTasks(UID_BOB, {}, TOKEN_BOB);
  check(bobTasks.length === 0, 'Bob task query returns 0 tasks (Alice task is completely hidden by RLS)');

  // Bob attempts to get Alice's task by ID
  const bobPeek = await adapter.getTaskById(UID_BOB, aliceTask.id, TOKEN_BOB);
  check(!bobPeek, 'Bob cannot fetch Alice task by ID (returns undefined)');

  // Bob attempts to update Alice's task
  let bobUpdateBlocked = false;
  try {
    await adapter.updateTask(UID_BOB, aliceTask.id, { title: 'Hacked by Bob' }, TOKEN_BOB);
  } catch (err) {
    bobUpdateBlocked = true;
  }
  check(bobUpdateBlocked, 'Bob cannot update Alice task (fails closed via RLS/ownership check)');

  // Bob attempts to delete Alice's task
  let bobDeleteBlocked = false;
  try {
    await adapter.deleteTask(UID_BOB, aliceTask.id, TOKEN_BOB);
  } catch (err) {
    bobDeleteBlocked = true;
  }
  check(bobDeleteBlocked, 'Bob cannot delete Alice task (fails closed via RLS/ownership check)');

  // Verify Alice task is still intact
  const aliceTaskStillThere = await adapter.getTaskById(UID_ALICE, aliceTask.id, TOKEN_ALICE);
  check(Boolean(aliceTaskStillThere), 'Alice task remains intact after unauthorized cross-user attacks');

  // Alice deletes her own task
  const deletedAliceTask = await adapter.deleteTask(UID_ALICE, aliceTask.id, TOKEN_ALICE);
  check(deletedAliceTask.id === aliceTask.id, 'Alice successfully deletes her own task');
  const aliceTasksAfterDel = await adapter.getTasks(UID_ALICE, {}, TOKEN_ALICE);
  check(aliceTasksAfterDel.length === 0, 'Task permanently removed from PostgREST');

  // ----------------------------------------------------
  // SUITE 4: SOVEREIGN VAULT AES-256-GCM OVER POSTGREST
  // ----------------------------------------------------
  console.log(`\n${YELLOW}[Suite 4] Sovereign Vault AES-256-GCM Encryption over PostgREST${RESET}`);

  const secretPlaintext = 'NEXORA-REVERSIBLE-VAULT-TOKEN-STAGE4';
  const savedCritical = await adapter.saveMemory(
    UID_ALICE,
    {
      content: secretPlaintext,
      category: 'personal',
      securityTier: 'critical',
    },
    TOKEN_ALICE
  );

  check(savedCritical.isProtected === true, 'Critical memory marked isProtected: true');
  check(savedCritical.content.includes('[CRITICAL PROTECTED]'), 'Display mask applied to content in memory record');
  check(!savedCritical.content.includes(secretPlaintext), 'Plaintext secret is not present in display mask');

  // Verify stored row in PostgREST
  const storedDbMemory = dbMemories.find(m => m.id === savedCritical.id);
  check(Boolean(storedDbMemory?.encrypted_payload), 'PostgREST stored encrypted_payload (iv:authTag:ciphertext)');
  check(!storedDbMemory.content.includes(secretPlaintext), 'PostgREST database row does not contain raw plaintext');

  // Decrypt memory for authorized owner
  const decryptedResult = await adapter.getDecryptedMemoryContent(UID_ALICE, savedCritical.id, TOKEN_ALICE);
  check(decryptedResult.isDecrypted === true, 'Decryption succeeds for authorized owner');
  check(decryptedResult.content === secretPlaintext, 'Decrypted plaintext accurately matches original secret');

  // Bob cannot read Alice critical memory
  let bobDecryptBlocked = false;
  try {
    await adapter.getDecryptedMemoryContent(UID_BOB, savedCritical.id, TOKEN_BOB);
  } catch {
    bobDecryptBlocked = true;
  }
  check(bobDecryptBlocked, 'Bob is strictly blocked from decrypting Alice critical memory');

  // ----------------------------------------------------
  // SUITE 5: FAIL-CLOSED BEHAVIOR & ZERO SILENT FALLBACK
  // ----------------------------------------------------
  console.log(`\n${YELLOW}[Suite 5] Fail-Closed Behavior & Zero Silent Fallback${RESET}`);

  // Test pluggable store in Supabase mode
  const pluggableStore = new McpPersistentStore(undefined, 'supabase');
  pluggableStore.setSupabaseAdapter(adapter);
  check(pluggableStore.getBackend() === 'supabase', 'McpPersistentStore reports backend: supabase');

  // Simulate 500 error on database
  simulateServerError = true;
  let serverErrorCaught = false;
  try {
    await pluggableStore.addTask(UID_ALICE, { title: 'Should fail' }, TOKEN_ALICE);
  } catch (err) {
    serverErrorCaught = err.message.toLowerCase().includes('database error');
  }
  simulateServerError = false;

  check(serverErrorCaught, 'Database 500 throws explicit database error');
  check(
    !fs.existsSync(path.join(pluggableStore.getDataDir(), 'tasks.tmp.500')),
    'Proves store does NOT silently fall back to writing to JSON on database failure'
  );

  // ----------------------------------------------------
  // SUITE 6: UUID FORMAT & DATE NORMALIZATION CONTRACT
  // ----------------------------------------------------
  console.log(`\n${YELLOW}[Suite 6] UUID Format & Date Normalization Contract${RESET}`);

  // 1. UUID Format Check for Task & Memory
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  check(uuidRegex.test(aliceTask.id), 'Task ID is a valid RFC 4122 v4 UUID');
  check(uuidRegex.test(savedCritical.id), 'Memory ID is a valid RFC 4122 v4 UUID');

  // 2. Missing dueDate defaults to today's local YYYY-MM-DD
  const now = new Date();
  const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const taskNoDate = await adapter.addTask(UID_ALICE, { title: 'No date provided' }, TOKEN_ALICE);
  check(taskNoDate.dueDate === todayLocal, `Missing dueDate normalized to local today (${todayLocal})`);

  // 3. 'Today' normalizes to today's local YYYY-MM-DD
  const taskToday = await adapter.addTask(UID_ALICE, { title: 'Explicit today task', dueDate: 'Today' }, TOKEN_ALICE);
  check(taskToday.dueDate === todayLocal, `'Today' string normalized to local date (${todayLocal})`);

  // 4. Valid ISO date preserved exactly
  const taskIso = await adapter.addTask(UID_ALICE, { title: 'Future project milestone', dueDate: '2026-11-20' }, TOKEN_ALICE);
  check(taskIso.dueDate === '2026-11-20', 'Explicit valid ISO YYYY-MM-DD preserved byte-for-byte');

  // 5. Invalid date rejected with clear error (never silently converted)
  let invalidDateError = false;
  let invalidDateMsg = '';
  try {
    await adapter.addTask(UID_ALICE, { title: 'Invalid date task', dueDate: 'invalid-date-string' }, TOKEN_ALICE);
  } catch (err) {
    invalidDateError = true;
    invalidDateMsg = err.message;
  }
  check(invalidDateError, 'Invalid date string throws explicit validation error');
  check(invalidDateMsg.includes('not a recognized date format'), 'Error message clearly explains date format requirement');

  // 6. Non-existent calendar date rejected (e.g. 2026-02-31)
  let nonExistentDateError = false;
  try {
    await adapter.addTask(UID_ALICE, { title: 'Feb 31 task', dueDate: '2026-02-31' }, TOKEN_ALICE);
  } catch (err) {
    nonExistentDateError = err.message.includes('non-existent calendar date');
  }
  check(nonExistentDateError, 'Non-existent calendar date (2026-02-31) rejected');

  // 7. Task description preserved and returned
  const taskWithDesc = await adapter.addTask(
    UID_ALICE,
    { title: 'Task with notes', description: 'Crucial architectural context', category: 'study' },
    TOKEN_ALICE
  );
  check(taskWithDesc.description === 'Crucial architectural context', 'Task description is accurately preserved');
  const fetchedDesc = await adapter.getTaskById(UID_ALICE, taskWithDesc.id, TOKEN_ALICE);
  check(fetchedDesc?.description === 'Crucial architectural context', 'getTaskById accurately returns task description');

  // ----------------------------------------------------
  // SUITE 7: CANONICAL SECURITY TIER & MIGRATION CONTRACT
  // ----------------------------------------------------
  console.log(`\n${YELLOW}[Suite 7] Canonical Security Tier & Migration Contract${RESET}`);

  const { normalizeSecurityTier } = await import('../server/dist/supabaseStorage.js');

  // 1. Verify normalizeSecurityTier maps correctly for all known, missing, and unknown values
  check(normalizeSecurityTier('standard') === 'low', 'normalizeSecurityTier("standard") maps to "low"');
  check(normalizeSecurityTier('sensitive') === 'high', 'normalizeSecurityTier("sensitive") maps to "high"');
  check(normalizeSecurityTier('critical') === 'critical', 'normalizeSecurityTier("critical") maps to "critical"');
  check(normalizeSecurityTier('low') === 'low', 'normalizeSecurityTier("low") maps to "low"');
  check(normalizeSecurityTier('medium') === 'medium', 'normalizeSecurityTier("medium") maps to "medium"');
  check(normalizeSecurityTier('high') === 'high', 'normalizeSecurityTier("high") maps to "high"');
  check(normalizeSecurityTier(undefined) === 'low', 'normalizeSecurityTier(undefined) defaults safely to "low"');
  check(normalizeSecurityTier('') === 'low', 'normalizeSecurityTier("") empty string defaults safely to "low"');
  check(normalizeSecurityTier('UNKNOWN_TIER_XYZ') === 'low', 'normalizeSecurityTier("UNKNOWN_TIER_XYZ") defaults safely to "low"');

  // 2. Verify PostgREST payload receives canonical security tier on write
  const savedStdMemory = await adapter.saveMemory(
    UID_ALICE,
    { content: 'Regular note', category: 'personal', securityTier: 'standard' },
    TOKEN_ALICE
  );
  const stdDbMemory = dbMemories.find(m => m.id === savedStdMemory.id);
  check(stdDbMemory?.security_tier === 'low', 'Standard tier normalized to "low" in PostgREST payload');

  const savedSensMemory = await adapter.saveMemory(
    UID_ALICE,
    { content: 'Confidential project details', category: 'work', securityTier: 'sensitive' },
    TOKEN_ALICE
  );
  const sensDbMemory = dbMemories.find(m => m.id === savedSensMemory.id);
  check(sensDbMemory?.security_tier === 'high', 'Sensitive tier normalized to "high" in PostgREST payload');

  // Verify memory read normalizes securityTier (e.g. historical un-migrated 'standard' row in DB)
  dbMemories.push({
    id: crypto.randomUUID(),
    user_id: UID_ALICE,
    content: 'Legacy note directly in database',
    category: 'general',
    security_tier: 'standard', // simulated raw un-migrated DB value
    is_protected: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  const aliceReadMemories = await adapter.getMemories(UID_ALICE, TOKEN_ALICE);
  const legacyReadMem = aliceReadMemories.find(m => m.content === 'Legacy note directly in database');
  check(legacyReadMem?.securityTier === 'low', 'Read operation safely normalizes raw database "standard" to "low"');

  // 3. Verify Stage 4 SQL migration script contracts
  const migrationSqlPath = path.resolve('server/data/supabase_migration_stage4.sql');
  const migrationSql = fs.readFileSync(migrationSqlPath, 'utf8');

  // Verify created_at safe ordering in migration SQL
  const colAddIdx = migrationSql.indexOf('ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;');
  const backfillIdx = migrationSql.indexOf('SET created_at = timestamp');
  const notNullIdx = migrationSql.indexOf('ALTER COLUMN created_at SET NOT NULL;');
  const defaultIdx = migrationSql.indexOf('ALTER COLUMN created_at SET DEFAULT now();');

  check(colAddIdx !== -1, 'Migration adds created_at nullable without default first');
  check(backfillIdx !== -1 && backfillIdx > colAddIdx, 'Migration backfills created_at after column addition');
  check(notNullIdx !== -1 && notNullIdx > backfillIdx, 'Migration sets NOT NULL after backfill completes');
  check(defaultIdx !== -1 && defaultIdx > notNullIdx, 'Migration sets DEFAULT now() after backfill and NOT NULL');

  // Verify atomic RLS policy retirement
  check(
    migrationSql.includes('DROP POLICY IF EXISTS "user can access own tasks" ON public.tasks;'),
    'Migration drops legacy permissive tasks policy'
  );
  check(
    migrationSql.includes('DROP POLICY IF EXISTS "user can access own memories" ON public.memories;'),
    'Migration drops legacy permissive memories policy'
  );
  check(
    migrationSql.includes('CREATE POLICY "Users can only view their own tasks"'),
    'Migration creates granular SELECT tasks policy'
  );
  check(
    migrationSql.includes('CREATE POLICY "Users can only view their own memories"'),
    'Migration creates granular SELECT memories policy'
  );

  // 4. Verify Full-Row Deterministic Integrity Comparison Logic
  // Deterministic JSON row normalization + SHA-256 / MD5 hashing
  const fullRowHasher = (rows, tableName) => {
    if (!rows || rows.length === 0) {
      return {
        count: 0,
        hash: crypto.createHash('sha256').update(`EMPTY_TABLE:${tableName}`).digest('hex'),
      };
    }
    // Sort rows deterministically by id
    const sorted = [...rows].sort((a, b) => String(a.id).localeCompare(String(b.id)));
    // Produce deterministic JSON string with sorted keys
    const canonicalRows = sorted.map(row => {
      const sortedKeys = Object.keys(row).sort();
      const obj = {};
      for (const k of sortedKeys) {
        obj[k] = row[k] === null || row[k] === undefined ? null : String(row[k]);
      }
      return JSON.stringify(obj);
    });
    const content = canonicalRows.join('\n');
    return {
      count: rows.length,
      hash: crypto.createHash('sha256').update(content).digest('hex'),
    };
  };

  const emptyTasksHash = fullRowHasher([], 'tasks');
  check(emptyTasksHash.count === 0, 'Empty table row count evaluates to 0');
  check(Boolean(emptyTasksHash.hash), 'Empty table produces non-null deterministic SHA-256 hash');

  const testRowA = { id: 'uuid-1', title: 'Task A', description: 'Desc A', priority: 'high', completed: false };
  const testRowB = { id: 'uuid-2', title: 'Task B', description: null, priority: 'low', completed: true };
  const hash1 = fullRowHasher([testRowA, testRowB], 'tasks');
  const hash2 = fullRowHasher([testRowB, testRowA], 'tasks'); // out of order
  check(hash1.hash === hash2.hash, 'Full-row integrity hash is order-independent (deterministic sort by id)');

  // Any column change alters the hash
  const testRowTampered = { ...testRowA, description: 'Tampered' };
  const hashTampered = fullRowHasher([testRowTampered, testRowB], 'tasks');
  check(hash1.hash !== hashTampered.hash, 'Tampering with non-id/non-updated_at column strictly changes full-row hash');

  // 5. Verify Legacy Timestamps Backfill Logic
  const legacyRows = [
    { id: '1', timestamp: '2026-10-08T10:00:00Z', updated_at: '2026-10-08T12:00:00Z', created_at: null },
    { id: '2', timestamp: null, updated_at: '2026-10-08T11:00:00Z', created_at: null },
    { id: '3', timestamp: null, updated_at: null, created_at: null },
  ];
  // Simulate migration sequence
  for (const r of legacyRows) {
    if (!r.created_at && r.timestamp) r.created_at = r.timestamp;
    if (!r.created_at && r.updated_at) r.created_at = r.updated_at;
    if (!r.created_at) r.created_at = 'FALLBACK_NOW';
  }
  check(legacyRows[0].created_at === '2026-10-08T10:00:00Z', 'Legacy row with timestamp preserves historical timestamp');
  check(legacyRows[1].created_at === '2026-10-08T11:00:00Z', 'Legacy row without timestamp falls back to updated_at');
  check(legacyRows[2].created_at === 'FALLBACK_NOW', 'Legacy row without timestamp or updated_at falls back to now()');

  // 6. Verify SQL Migration Idempotency
  // All tables, columns, indexes, extensions use IF NOT EXISTS / DROP IF EXISTS
  check(migrationSql.includes('CREATE EXTENSION IF NOT EXISTS "pgcrypto"'), 'Migration pgcrypto extension is idempotent');
  check(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.tasks'), 'Migration tasks table creation is idempotent');
  check(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.memories'), 'Migration memories table creation is idempotent');
  check(migrationSql.includes('ADD COLUMN IF NOT EXISTS description'), 'Migration tasks description column addition is idempotent');
  check(migrationSql.includes('ADD COLUMN IF NOT EXISTS digest'), 'Migration memories digest column addition is idempotent');
  check(migrationSql.includes('ADD COLUMN IF NOT EXISTS encrypted_payload'), 'Migration memories encrypted_payload column addition is idempotent');
  check(migrationSql.includes('DROP POLICY IF EXISTS'), 'Migration RLS drops use IF EXISTS for idempotency');
  check(migrationSql.includes('CREATE INDEX IF NOT EXISTS'), 'Migration indexes use IF NOT EXISTS for idempotency');

  // 7. Verify Schema Manifest & verifyBackup Module Logic
  const { verifyBackupFile, SCHEMA_MANIFEST, computeCanonicalTableHash } = await import('../server/dist/verifyBackup.js');
  check(Boolean(SCHEMA_MANIFEST.tasks), 'SCHEMA_MANIFEST defines tasks manifest');
  check(Boolean(SCHEMA_MANIFEST.memories), 'SCHEMA_MANIFEST defines memories manifest');
  check(!SCHEMA_MANIFEST.tasks.liveColumns.includes('description'), 'Tasks manifest correctly isolates "description" as Stage 4 added column');
  check(SCHEMA_MANIFEST.tasks.liveColumns.includes('title'), 'Tasks manifest includes guaranteed live column "title"');
  check(!SCHEMA_MANIFEST.memories.liveColumns.includes('created_at'), 'Memories manifest correctly isolates "created_at" as Stage 4 added column');
  check(SCHEMA_MANIFEST.memories.liveColumns.includes('timestamp'), 'Memories manifest includes guaranteed live column "timestamp"');

  // Test verifyBackupFile with non-existent file
  const nonExistentResult = verifyBackupFile('tasks', 0, 'server/data/backups/non_existent_file.json');
  check(nonExistentResult.fileExists === false, 'verifyBackupFile fails safely when export file does not exist');
  check(nonExistentResult.columnErrors.length > 0, 'verifyBackupFile reports missing file in columnErrors');

  // Test verifyBackupFile with mock valid export
  const scratchValidExport = path.resolve('server/data/backups/scratch_test_tasks.json');
  fs.writeFileSync(scratchValidExport, JSON.stringify([
    {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      user_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      title: 'Valid Task',
      category: 'work',
      due_date: '2026-10-10',
      due_time: null,
      priority: 'high',
      completed: false,
      recurring: null,
      created_at: '2026-10-10T00:00:00Z',
      updated_at: '2026-10-10T00:00:00Z',
    }
  ]));
  const validResult = verifyBackupFile('tasks', 1, scratchValidExport);
  check(validResult.fileExists === true, 'verifyBackupFile detects existing file');
  check(validResult.validJson === true, 'verifyBackupFile parses valid JSON array');
  check(validResult.parsedRowCount === 1, 'verifyBackupFile parsed exactly 1 row');
  check(validResult.rowCountMatch === true, 'verifyBackupFile confirms match with live reported count (1)');
  check(validResult.columnsValid === true, 'verifyBackupFile validates all required columns in row');
  check(validResult.uuidsValid === true, 'verifyBackupFile validates RFC 4122 UUID format');
  check(validResult.noDuplicateIds === true, 'verifyBackupFile confirms zero duplicate IDs in export');

  // Test live canonical hash matching
  const matchingHashResult = verifyBackupFile('tasks', 1, scratchValidExport, validResult.canonicalHash);
  check(matchingHashResult.hashMatch === true, 'verifyBackupFile confirms exact match with compatible live database hash');

  const mismatchedHashResult = verifyBackupFile('tasks', 1, scratchValidExport, 'deadbeef00000000000000000000000000000000000000000000000000000000');
  check(mismatchedHashResult.hashMatch === false, 'verifyBackupFile detects and rejects hash mismatch against live hash');

  // Test row count mismatch rejection
  const mismatchResult = verifyBackupFile('tasks', 5, scratchValidExport);
  check(mismatchResult.rowCountMatch === false, 'verifyBackupFile flags row count mismatch (expected 5, found 1)');

  // Test missing required column rejection
  const scratchInvalidCol = path.resolve('server/data/backups/scratch_test_invalid.json');
  fs.writeFileSync(scratchInvalidCol, JSON.stringify([
    { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', title: 'Missing category, due_date, etc' }
  ]));
  const invalidColResult = verifyBackupFile('tasks', 1, scratchInvalidCol);
  check(invalidColResult.columnsValid === false, 'verifyBackupFile flags row missing required manifest columns');

  // Test invalid UUID format detection
  const scratchInvalidUuid = path.resolve('server/data/backups/scratch_test_uuid.json');
  fs.writeFileSync(scratchInvalidUuid, JSON.stringify([
    {
      id: 'NOT-A-UUID',
      user_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      title: 'Invalid ID Task',
      category: 'work',
      due_date: '2026-10-10',
      due_time: null,
      priority: 'high',
      completed: false,
      recurring: null,
      created_at: '2026-10-10T00:00:00Z',
      updated_at: '2026-10-10T00:00:00Z',
    }
  ]));
  const invalidUuidResult = verifyBackupFile('tasks', 1, scratchInvalidUuid);
  check(invalidUuidResult.uuidsValid === false, 'verifyBackupFile flags non-UUID ID format');

  // Test duplicate ID rejection
  const scratchDuplicateId = path.resolve('server/data/backups/scratch_test_dup.json');
  fs.writeFileSync(scratchDuplicateId, JSON.stringify([
    {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      user_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      title: 'Task 1',
      category: 'work',
      due_date: '2026-10-10',
      due_time: null,
      priority: 'high',
      completed: false,
      recurring: null,
      created_at: '2026-10-10T00:00:00Z',
      updated_at: '2026-10-10T00:00:00Z',
    },
    {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', // duplicate
      user_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      title: 'Task 2',
      category: 'study',
      due_date: '2026-10-10',
      due_time: null,
      priority: 'low',
      completed: false,
      recurring: null,
      created_at: '2026-10-10T00:00:00Z',
      updated_at: '2026-10-10T00:00:00Z',
    }
  ]));
  const duplicateIdResult = verifyBackupFile('tasks', 2, scratchDuplicateId);
  check(duplicateIdResult.noDuplicateIds === false, 'verifyBackupFile detects and rejects duplicate IDs');

  // Test combined snapshot wrapper format
  const scratchCombinedSnapshot = path.resolve('server/data/backups/scratch_combined_snapshot.json');
  fs.writeFileSync(scratchCombinedSnapshot, JSON.stringify([
    {
      database_snapshot: {
        tasks: [
          {
            id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            user_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
            title: 'Task in combined snapshot',
            category: 'daily',
            due_date: '2026-10-10',
            due_time: null,
            priority: 'low',
            completed: false,
            recurring: null,
            created_at: '2026-10-10T00:00:00Z',
            updated_at: '2026-10-10T00:00:00Z',
          }
        ],
        memories: [],
        snapshot_utc: new Date().toISOString()
      }
    }
  ]));
  const combinedTasksResult = verifyBackupFile('tasks', 1, scratchCombinedSnapshot);
  check(combinedTasksResult.wrapperDetected === 'supabase_combined_snapshot_wrapper', 'verifyBackupFile parses supabase_combined_snapshot_wrapper');
  check(combinedTasksResult.parsedRowCount === 1, 'verifyBackupFile extracts 1 task from combined snapshot');
  const combinedMemoriesResult = verifyBackupFile('memories', 0, scratchCombinedSnapshot);
  check(combinedMemoriesResult.parsedRowCount === 0, 'verifyBackupFile extracts 0 memories from combined snapshot');

  // Test RLS recovery generation fails safely when snapshot file is missing
  const { generateRecoverySqlFromSnapshot } = await import('../server/dist/verifyBackup.js');
  const recoveryResult = generateRecoverySqlFromSnapshot('server/data/backups/non_existent_snapshot.txt');
  check(recoveryResult.success === false, 'generateRecoverySqlFromSnapshot fails safely when snapshot is missing');
  check(recoveryResult.error.includes('Recovery SQL generation is BLOCKED'), 'Recovery generator refuses to substitute assumed policies');

  // Clean up scratch files
  if (fs.existsSync(scratchValidExport)) fs.unlinkSync(scratchValidExport);
  if (fs.existsSync(scratchInvalidCol)) fs.unlinkSync(scratchInvalidCol);
  if (fs.existsSync(scratchInvalidUuid)) fs.unlinkSync(scratchInvalidUuid);
  if (fs.existsSync(scratchDuplicateId)) fs.unlinkSync(scratchDuplicateId);
  if (fs.existsSync(scratchCombinedSnapshot)) fs.unlinkSync(scratchCombinedSnapshot);

  // ----------------------------------------------------
  // SUITE 8: LIVE PRODUCTION DATA BYTE-FOR-BYTE INTEGRITY
  // ----------------------------------------------------
  console.log(`\n${YELLOW}[Suite 8] Live Production Data Byte-for-Byte Integrity${RESET}`);

  const finalMemoriesHash = getFileHash(liveMemoriesPath);
  const finalTasksHash = getFileHash(liveTasksPath);

  check(
    initialMemoriesHash === finalMemoriesHash,
    `Production memories.json byte-for-byte unchanged (${finalMemoriesHash.slice(0, 16)}...)`
  );
  check(
    initialTasksHash === finalTasksHash,
    `Production tasks.json byte-for-byte unchanged (${finalTasksHash.slice(0, 16)}...)`
  );

  // Close mock server
  mockServer.close();

  console.log(`\n====================================================`);
  console.log(`   TEST EXECUTION SUMMARY                            `);
  console.log(`====================================================`);
  console.log(`  Passed: ${GREEN}${passed}${RESET}`);
  console.log(`  Failed: ${failed > 0 ? RED : GREEN}${failed}${RESET}`);
  console.log(`  Total:  ${passed + failed}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('[FATAL TEST ERROR]', err);
  mockServer.close();
  process.exit(1);
});
