/**
 * NEXORA AI — Dedicated MCP Server & Official Streamable HTTP Verification Test Suite
 * Tests official @modelcontextprotocol/sdk StreamableHTTPServerTransport over real HTTP network requests:
 * 1. Streamable HTTP GET & POST handshake on /mcp
 * 2. Real HTTP JSON-RPC initialize & tool discovery on /mcp
 * 3. Server-side Authentication & Authorization guards (HTTP 401 on missing/invalid tokens)
 * 4. Per-user data isolation (Alice vs Bob cross-user access defense)
 * 5. Real HTTP task lifecycle & sensitive action confirmation (delete_task)
 * 6. Sovereign Memory Vault AES-256-GCM encryption & authorized decryption
 * 7. Real HTTP input validation & error handling
 * 8. Legacy transport backward compatibility
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import assert from 'assert';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

let passed = 0;
let failed = 0;

function check(assertion, message) {
  try {
    assert(assertion);
    console.log(`  ${GREEN}✓${RESET} ${message}`);
    passed++;
  } catch (err) {
    console.error(`  ${RED}✗ FAIL:${RESET} ${message}`);
    console.error(`    ${RED}${err.message}${RESET}`);
    failed++;
  }
}

async function runMcpVerification() {
  console.log(`\n====================================================`);
  console.log(`   NEXORA AI MCP STREAMABLE HTTP & SECURITY SUITE   `);
  console.log(`====================================================\n`);

  process.env.NODE_ENV = 'test';

  // Snapshot live data files for regression byte-for-byte verification
  const liveMemoriesPath = path.resolve('server/data/memories.json');
  const liveTasksPath = path.resolve('server/data/tasks.json');
  const liveMemoriesHashBefore = fs.existsSync(liveMemoriesPath)
    ? crypto.createHash('sha256').update(fs.readFileSync(liveMemoriesPath)).digest('hex')
    : null;
  const liveTasksHashBefore = fs.existsSync(liveTasksPath)
    ? crypto.createHash('sha256').update(fs.readFileSync(liveTasksPath)).digest('hex')
    : null;

  // Set dedicated temporary sandbox data directory outside server/data
  const testSandboxDir = path.resolve('server/test_tmp/verify_mcp_' + Date.now());
  process.env.NEXORA_DATA_DIR = testSandboxDir;

  // Import server module
  const serverModule = await import('../server/dist/index.js');
  const mcpStore = serverModule.mcpStore;
  const app = serverModule.default?.default || serverModule.default;

  // Ensure store points to isolated sandbox
  mcpStore.setDataDir(testSandboxDir);
  mcpStore.clearAll();

  const port = process.env.PORT || 3000;
  let httpServer;
  try {
    httpServer = await new Promise((resolve, reject) => {
      const server = app.listen(port, () => resolve(server));
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(null); // already running externally
        } else {
          reject(err);
        }
      });
    });
  } catch (err) {
    console.warn(`Could not start internal server: ${err.message}`);
  }

  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`${CYAN}Testing against live MCP Gateway at ${baseUrl}${RESET}`);

  // Helper to send real HTTP POST requests to /mcp with optional auth token
  async function postMcpHttp(payload, token = null, id = Date.now()) {
    const postUrl = `${baseUrl}/mcp`;
    const bodyObj = {
      jsonrpc: '2.0',
      id,
      ...payload,
    };

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(postUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyObj),
    });

    const status = response.status;
    const contentType = response.headers.get('content-type') || '';
    const rawText = await response.text();

    let parsed = null;
    if (contentType.includes('text/event-stream')) {
      const lines = rawText.split('\n');
      const dataLine = lines.find((l) => l.startsWith('data: '));
      if (dataLine) {
        try {
          parsed = JSON.parse(dataLine.replace('data: ', '').trim());
        } catch {}
      }
    } else {
      try {
        parsed = JSON.parse(rawText);
      } catch {}
    }

    return { status, contentType, rawText, parsed };
  }

  // Helper to invoke tools over real HTTP network requests with identity
  async function callToolHttp(name, args = {}, token = null, id = Date.now()) {
    return postMcpHttp({
      method: 'tools/call',
      params: {
        name,
        arguments: args,
      },
    }, token, id);
  }

  const ALICE_TOKEN = 'test-token-alice';
  const BOB_TOKEN = 'test-token-bob';

  try {
    // ----------------------------------------------------
    // SUITE 1: OFFICIAL STREAMABLE HTTP SPECIFICATION (/mcp)
    // ----------------------------------------------------
    console.log(`\n${YELLOW}[Suite 1] Official Streamable HTTP Specification (/mcp)${RESET}`);

    // Test 1: POST /mcp initialization handshake over real HTTP
    const initRes = await postMcpHttp({
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'nexora-real-http-verifier', version: '2.0.0' },
      },
    }, null, 101);

    check(initRes.status === 200, 'POST /mcp initialize returns HTTP 200');
    check(
      initRes.contentType.includes('text/event-stream'),
      'POST /mcp streams response as event-stream per Streamable HTTP spec'
    );
    check(initRes.parsed?.result?.serverInfo?.name === 'nexora-mcp-server', 'Server identifies as nexora-mcp-server');
    check(Boolean(initRes.parsed?.result?.protocolVersion), 'Negotiates protocol version over Streamable HTTP');

    // Test 2: GET /mcp standalone SSE stream capability with clean cancellation
    const ac = new AbortController();
    const getRes = await fetch(`${baseUrl}/mcp`, {
      method: 'GET',
      headers: { 'Accept': 'text/event-stream' },
      signal: ac.signal,
    }).catch(() => null);
    check(getRes?.status === 200, 'GET /mcp responds with HTTP 200');
    check(
      Boolean(getRes?.headers.get('content-type')?.includes('text/event-stream')),
      'GET /mcp Content-Type contains text/event-stream'
    );
    ac.abort();

    // ----------------------------------------------------
    // SUITE 2: REAL HTTP TOOL DISCOVERY (tools/list)
    // ----------------------------------------------------
    console.log(`\n${YELLOW}[Suite 2] Real HTTP Tool Discovery (POST /mcp)${RESET}`);

    const listRes = await postMcpHttp({
      method: 'tools/list',
      params: {},
    }, null, 201);

    check(listRes.status === 200, 'POST /mcp tools/list returns HTTP 200 over real network');
    const tools = listRes.parsed?.result?.tools || [];
    check(Array.isArray(tools) && tools.length >= 7, `Discovered ${tools.length} tools via Streamable HTTP`);

    const toolNames = tools.map((t) => t.name);
    check(toolNames.includes('add_task'), 'Real HTTP tool discovery includes add_task');
    check(toolNames.includes('get_tasks'), 'Real HTTP tool discovery includes get_tasks');
    check(toolNames.includes('update_task'), 'Real HTTP tool discovery includes update_task');
    check(toolNames.includes('delete_task'), 'Real HTTP tool discovery includes delete_task');
    check(toolNames.includes('save_memory'), 'Real HTTP tool discovery includes save_memory');
    check(toolNames.includes('search_memory'), 'Real HTTP tool discovery includes search_memory');
    check(toolNames.includes('get_decrypted_memory'), 'Real HTTP tool discovery includes get_decrypted_memory');

    // ----------------------------------------------------
    // SUITE 3: SERVER-SIDE AUTHENTICATION & ACCESS CONTROL
    // ----------------------------------------------------
    console.log(`\n${YELLOW}[Suite 3] Server-Side Authentication & Access Control${RESET}`);

    // 1. Unauthenticated request to private tool is rejected with HTTP 401
    const unauthAddRes = await callToolHttp('add_task', { title: 'Hack task' }, null, 301);
    check(unauthAddRes.status === 401, 'Unauthenticated add_task rejected with HTTP 401');
    check(unauthAddRes.parsed?.error?.code === -32001, 'Returns standard JSON-RPC unauthorized error code -32001');

    // 2. Invalid token rejected with HTTP 401
    const invalidTokenRes = await callToolHttp('add_task', { title: 'Hack task' }, 'invalid_forged_token_xyz', 302);
    check(invalidTokenRes.status === 401, 'Invalid bearer token rejected with HTTP 401');

    // 3. Public tool (get_weather) succeeds without authentication
    const publicWeatherRes = await callToolHttp('get_weather', { location: 'Chennai' }, null, 303);
    check(publicWeatherRes.status === 200, 'Public tool (get_weather) accessible without authentication');

    // ----------------------------------------------------
    // SUITE 4: PER-USER DATA ISOLATION (ALICE VS BOB)
    // ----------------------------------------------------
    console.log(`\n${YELLOW}[Suite 4] Per-User Data Isolation & Cross-User Defense${RESET}`);

    // 1. Alice creates a task under her authenticated identity
    const aliceAddRes = await callToolHttp('add_task', {
      title: 'Alice Private Objective',
      category: 'work',
      priority: 'high',
    }, ALICE_TOKEN, 401);

    check(aliceAddRes.status === 200, 'Alice authenticated add_task returns HTTP 200');
    const aliceAddContent = JSON.parse(aliceAddRes.parsed?.result?.content?.[0]?.text || '{}');
    check(aliceAddContent.success === true, 'Alice task creation succeeds');
    const aliceTaskId = aliceAddContent.task?.id;
    check(Boolean(aliceTaskId), `Alice assigned task ID: ${aliceTaskId}`);

    // 2. Alice retrieves her tasks: returns 1 task
    const aliceGetRes = await callToolHttp('get_tasks', {}, ALICE_TOKEN, 402);
    check(aliceGetRes.status === 200, 'Alice get_tasks returns HTTP 200');
    const aliceGetContent = JSON.parse(aliceGetRes.parsed?.result?.content?.[0]?.text || '{}');
    check(aliceGetContent.count === 1, 'Alice sees exactly 1 task');
    check(aliceGetContent.tasks?.[0]?.id === aliceTaskId, 'Alice task ID matches created task');

    // 3. Bob retrieves tasks: MUST NOT see Alice's task (strict cross-user isolation!)
    const bobGetRes = await callToolHttp('get_tasks', {}, BOB_TOKEN, 403);
    check(bobGetRes.status === 200, 'Bob get_tasks returns HTTP 200');
    const bobGetContent = JSON.parse(bobGetRes.parsed?.result?.content?.[0]?.text || '{}');
    check(bobGetContent.count === 0, 'Bob sees 0 tasks (Alice task is completely hidden from Bob)');

    // 4. Bob attempts to update Alice's task: MUST BE REJECTED!
    const bobUpdateAliceRes = await callToolHttp('update_task', {
      id: aliceTaskId,
      title: 'Hacked by Bob',
    }, BOB_TOKEN, 404);
    check(
      bobUpdateAliceRes.parsed?.result?.isError === true || Boolean(bobUpdateAliceRes.parsed?.error),
      'Bob is strictly blocked from updating Alice task'
    );

    // 5. Bob attempts to delete Alice's task: MUST BE REJECTED!
    const bobDeleteAliceRes = await callToolHttp('delete_task', {
      id: aliceTaskId,
      confirm: true,
    }, BOB_TOKEN, 405);
    check(
      bobDeleteAliceRes.parsed?.result?.isError === true || Boolean(bobDeleteAliceRes.parsed?.error),
      'Bob is strictly blocked from deleting Alice task'
    );

    // Verify Alice's task is STILL intact in storage
    const aliceTaskStillThere = mcpStore.getTaskById('usr_alice_101', aliceTaskId);
    check(Boolean(aliceTaskStillThere), 'Alice task remains intact after Bob unauthorized deletion attempt');

    // ----------------------------------------------------
    // SUITE 5: SENSITIVE ACTION CONFIRMATION (delete_task)
    // ----------------------------------------------------
    console.log(`\n${YELLOW}[Suite 5] Sensitive Action Confirmation (delete_task)${RESET}`);

    // Alice attempts deletion without confirm: true
    const aliceDelUnconfirmed = await callToolHttp('delete_task', {
      id: aliceTaskId,
    }, ALICE_TOKEN, 501);
    check(aliceDelUnconfirmed.status === 200, 'delete_task unconfirmed returns HTTP 200');
    const delUnconfirmedContent = JSON.parse(aliceDelUnconfirmed.parsed?.result?.content?.[0]?.text || '{}');
    check(delUnconfirmedContent.requiresConfirmation === true, 'Enforces requiresConfirmation: true over HTTP');

    // Alice executes deletion WITH confirm: true
    const aliceDelConfirmed = await callToolHttp('delete_task', {
      id: aliceTaskId,
      confirm: true,
    }, ALICE_TOKEN, 502);
    check(aliceDelConfirmed.status === 200, 'delete_task confirmed returns HTTP 200');
    const delConfirmedContent = JSON.parse(aliceDelConfirmed.parsed?.result?.content?.[0]?.text || '{}');
    check(delConfirmedContent.deleted === true, 'Alice task successfully deleted on explicit confirmation');

    // Verify Alice's task is now deleted from storage
    const aliceTaskGone = mcpStore.getTaskById('usr_alice_101', aliceTaskId);
    check(!aliceTaskGone, 'Alice task permanently removed from persistent store');

    // ----------------------------------------------------
    // SUITE 6: VAULT SECURITY, AES-256-GCM & REVERSIBLE DECRYPTION
    // ----------------------------------------------------
    console.log(`\n${YELLOW}[Suite 6] Sovereign Vault AES-256-GCM Encryption & Reversible Decryption${RESET}`);

    // 1. Alice saves a standard memory
    const aliceSaveStd = await callToolHttp('save_memory', {
      content: 'Alice prefers voice summaries in Tamil',
      category: 'preference',
      securityTier: 'standard',
    }, ALICE_TOKEN, 601);
    check(aliceSaveStd.status === 200, 'Alice save_memory standard returns HTTP 200');
    const aliceStdContent = JSON.parse(aliceSaveStd.parsed?.result?.content?.[0]?.text || '{}');
    check(aliceStdContent.memory?.isProtected === false, 'Standard memory stored in plaintext');

    // 2. Alice saves a critical credential: encrypted via AES-256-GCM with SHA-256 digest
    const aliceSecretKey = 'sk-prod-live-aws-access-token-998877';
    const aliceSaveCrit = await callToolHttp('save_memory', {
      content: aliceSecretKey,
      category: 'work',
      securityTier: 'critical',
    }, ALICE_TOKEN, 602);

    check(aliceSaveCrit.status === 200, 'Alice save_memory critical returns HTTP 200');
    const aliceCritContent = JSON.parse(aliceSaveCrit.parsed?.result?.content?.[0]?.text || '{}');
    check(aliceCritContent.memory?.isProtected === true, 'Critical memory marked isProtected: true');
    check(!aliceCritContent.memory?.content.includes('aws-access-token'), 'Plaintext secret is masked from display content');
    check(aliceCritContent.memory?.content.includes('[CRITICAL PROTECTED]'), 'Memory tagged with [CRITICAL PROTECTED]');
    check(Boolean(aliceCritContent.memory?.digest), 'Includes cryptographic SHA-256 digest');
    const critMemId = aliceCritContent.memory?.id;

    // 3. Bob searches memories: MUST NOT find Alice's memories
    const bobSearchMem = await callToolHttp('search_memory', { query: 'voice summaries' }, BOB_TOKEN, 603);
    check(bobSearchMem.status === 200, 'Bob search_memory returns HTTP 200');
    const bobSearchContent = JSON.parse(bobSearchMem.parsed?.result?.content?.[0]?.text || '{}');
    check(bobSearchContent.matchedCount === 0, 'Bob search yields 0 memories (Alice memories strictly isolated)');

    // 4. Bob attempts to decrypt Alice's critical credential: MUST BE REJECTED!
    const bobDecryptAlice = await callToolHttp('get_decrypted_memory', { id: critMemId }, BOB_TOKEN, 604);
    check(
      bobDecryptAlice.parsed?.result?.isError === true || Boolean(bobDecryptAlice.parsed?.error),
      'Bob is strictly blocked from decrypting Alice critical credential'
    );

    // 5. Authorized Owner Decryption: Alice retrieves her decrypted plaintext credential
    const aliceDecryptRes = await callToolHttp('get_decrypted_memory', { id: critMemId }, ALICE_TOKEN, 605);
    check(aliceDecryptRes.status === 200, 'Alice get_decrypted_memory returns HTTP 200');
    const aliceDecryptContent = JSON.parse(aliceDecryptRes.parsed?.result?.content?.[0]?.text || '{}');
    check(aliceDecryptContent.success === true, 'Decryption succeeds for authorized owner');
    check(aliceDecryptContent.isDecrypted === true, 'Payload reports isDecrypted: true');
    check(aliceDecryptContent.content === aliceSecretKey, 'Decrypted content exactly matches original plaintext secret');

    // ----------------------------------------------------
    // SUITE 7: INPUT VALIDATION & ERROR DEFENSE
    // ----------------------------------------------------
    console.log(`\n${YELLOW}[Suite 7] Input Validation & Error Handling${RESET}`);

    // Empty task title over HTTP
    const emptyTaskRes = await callToolHttp('add_task', { title: '' }, ALICE_TOKEN, 701);
    check(
      emptyTaskRes.parsed?.result?.isError === true || Boolean(emptyTaskRes.parsed?.error),
      'add_task rejects empty title with structured error over HTTP'
    );

    // Non-existent task update over HTTP
    const badUpdateRes = await callToolHttp('update_task', { id: 'nonexistent_task_99999', completed: true }, ALICE_TOKEN, 702);
    check(
      badUpdateRes.parsed?.result?.isError === true || Boolean(badUpdateRes.parsed?.error),
      'update_task returns structured error for non-existent task ID'
    );

    // Empty memory content over HTTP
    const emptyMemRes = await callToolHttp('save_memory', { content: '' }, ALICE_TOKEN, 703);
    check(
      emptyMemRes.parsed?.result?.isError === true || Boolean(emptyMemRes.parsed?.error),
      'save_memory rejects empty content with structured error over HTTP'
    );

    // ----------------------------------------------------
    // SUITE 8: LEGACY ENDPOINTS SECURITY & BACKWARD COMPATIBILITY
    // ----------------------------------------------------
    console.log(`\n${YELLOW}[Suite 8] Legacy Endpoints Security & Backward Compatibility${RESET}`);

    // Legacy SSE handshake on /sse
    const legacySseRes = await fetch(`${baseUrl}/sse`, { method: 'GET' });
    check(legacySseRes.status === 200, 'Legacy GET /sse returns HTTP 200 for backward compatibility');

    // Legacy public JSON-RPC on /api/mcp/rpc
    const legacyRpcRes = await fetch(`${baseUrl}/api/mcp/rpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 801,
        method: 'tools/call',
        params: { name: 'get_weather', arguments: { location: 'Chennai' } },
      }),
    });
    check(legacyRpcRes.status === 200, 'Legacy POST /api/mcp/rpc returns HTTP 200 for public tools');
    const legacyRpcJson = await legacyRpcRes.json();
    check(
      legacyRpcJson.result?.content?.[0]?.text?.includes('Chennai'),
      'Legacy weather execution succeeds on /api/mcp/rpc'
    );

    // 8.1 POST /api/mcp/execute: unauthenticated private tool must return 401
    const unauthExecRes = await fetch(`${baseUrl}/api/mcp/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolName: 'add_task', params: { title: 'Illegal Task' } }),
    });
    check(unauthExecRes.status === 401, 'POST /api/mcp/execute add_task without token is blocked with HTTP 401');

    // 8.2 POST /api/mcp/execute: Alice authenticated add_task returns 200
    const authExecRes = await fetch(`${baseUrl}/api/mcp/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ALICE_TOKEN}` },
      body: JSON.stringify({ toolName: 'add_task', params: { title: 'Alice Task via Execute' } }),
    });
    check(authExecRes.status === 200, 'POST /api/mcp/execute add_task with Alice token returns HTTP 200');

    // 8.3 POST /api/mcp/rpc: unauthenticated private tool must return 401
    const unauthRpcRes = await fetch(`${baseUrl}/api/mcp/rpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 802,
        method: 'tools/call',
        params: { name: 'add_task', arguments: { title: 'Illegal Task via RPC' } },
      }),
    });
    check(unauthRpcRes.status === 401, 'POST /api/mcp/rpc add_task without token is blocked with HTTP 401');

    // 8.4 POST /api/mcp/rpc: Alice authenticated add_task returns 200
    const authRpcRes = await fetch(`${baseUrl}/api/mcp/rpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ALICE_TOKEN}` },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 803,
        method: 'tools/call',
        params: { name: 'add_task', arguments: { title: 'Alice Task via RPC' } },
      }),
    });
    check(authRpcRes.status === 200, 'POST /api/mcp/rpc add_task with Alice token returns HTTP 200');

    // 8.5 POST /api/mcp/rpc: Bob querying get_tasks sees 0 Alice tasks
    const bobRpcRes = await fetch(`${baseUrl}/api/mcp/rpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${BOB_TOKEN}` },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 804,
        method: 'tools/call',
        params: { name: 'get_tasks', arguments: {} },
      }),
    });
    check(bobRpcRes.status === 200, 'POST /api/mcp/rpc get_tasks with Bob token returns HTTP 200');
    const bobRpcJson = await bobRpcRes.json();
    const bobRpcText = bobRpcJson.result?.content?.[0]?.text || '';
    check(!bobRpcText.includes('Alice Task via RPC'), 'Bob cannot see Alice tasks on /api/mcp/rpc');

    // ----------------------------------------------------
    // SUITE 9: CRYPTOGRAPHIC RESILIENCE & KEY REQUIREMENT ENFORCEMENT
    // ----------------------------------------------------
    console.log(`\n${YELLOW}[Suite 9] Cryptographic Resilience & Fail-Closed Enforcement${RESET}`);

    const { VaultCrypto } = await import('../server/dist/crypto.js');
    const secretText = 'sk-stage3-remediation-secret-token-999';
    const encResult = VaultCrypto.encrypt(secretText);

    // Tampered ciphertext
    let cipherTamperFailed = false;
    try {
      const badCipher = encResult.ciphertext.slice(0, -2) + (encResult.ciphertext.slice(-2) === '11' ? '22' : '11');
      VaultCrypto.decrypt({ iv: encResult.iv, authTag: encResult.authTag, ciphertext: badCipher });
    } catch {
      cipherTamperFailed = true;
    }
    check(cipherTamperFailed, 'AES-256-GCM throws securely when ciphertext is tampered with');

    // Tampered authTag
    let tagTamperFailed = false;
    try {
      const badTag = encResult.authTag.slice(0, -2) + (encResult.authTag.slice(-2) === '33' ? '44' : '33');
      VaultCrypto.decrypt({ iv: encResult.iv, authTag: badTag, ciphertext: encResult.ciphertext });
    } catch {
      tagTamperFailed = true;
    }
    check(tagTamperFailed, 'AES-256-GCM throws securely when authentication tag is tampered with');

    // Missing encryption key fail-closed behavior
    let keyFailClosed = false;
    try {
      process.env.TEST_MISSING_VAULT_KEY = 'true';
      VaultCrypto.encrypt('test');
    } catch {
      keyFailClosed = true;
    } finally {
      delete process.env.TEST_MISSING_VAULT_KEY;
    }
    check(keyFailClosed, 'VaultCrypto fails closed when encryption key is missing or unconfigured');

    // ----------------------------------------------------
    // SUITE 10: ZERO DATA LOSS & LIVE PRODUCTION DATA PROTECTION
    // ----------------------------------------------------
    console.log(`\n${YELLOW}[Suite 10] Zero Data Loss & Production Data Protection${RESET}`);

    const liveMemoriesHashAfter = fs.existsSync(liveMemoriesPath)
      ? crypto.createHash('sha256').update(fs.readFileSync(liveMemoriesPath)).digest('hex')
      : null;
    const liveTasksHashAfter = fs.existsSync(liveTasksPath)
      ? crypto.createHash('sha256').update(fs.readFileSync(liveTasksPath)).digest('hex')
      : null;

    check(
      liveMemoriesHashBefore === liveMemoriesHashAfter,
      'REGRESSION PROOF: Production memories.json remained 100% byte-for-byte identical before & after test suite'
    );
    check(
      liveTasksHashBefore === liveTasksHashAfter,
      'REGRESSION PROOF: Production tasks.json remained 100% byte-for-byte identical before & after test suite'
    );
  } catch (err) {
    console.error(`${RED}Unexpected verification failure:${RESET}`, err);
    failed++;
  } finally {
    // Clean up temporary test sandbox directory
    if (fs.existsSync(testSandboxDir)) {
      try {
        fs.rmSync(testSandboxDir, { recursive: true, force: true });
      } catch {}
    }
  }

  console.log(`\n====================================================`);
  console.log(`   TEST EXECUTION SUMMARY                            `);
  console.log(`====================================================`);
  console.log(`  Passed: ${GREEN}${passed}${RESET}`);
  console.log(`  Failed: ${failed > 0 ? RED : GREEN}${failed}${RESET}`);
  console.log(`  Total:  ${passed + failed}\n`);

  if (httpServer) {
    httpServer.close();
  }

  process.exit(failed > 0 ? 1 : 0);
}

runMcpVerification().catch((err) => {
  console.error(`${RED}Fatal error running verification:${RESET}`, err);
  process.exit(1);
});
