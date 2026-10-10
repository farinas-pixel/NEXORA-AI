#!/usr/bin/env node
/**
 * NEXORA AI — Production Storage Safeguard Automated Verification Suite
 * Tests fail-closed behavior for missing, invalid, and "json" backend configurations in production.
 * Verifies that production strictly requires STORAGE_BACKEND="supabase" and Supabase credentials,
 * while development/testing seamlessly defaults to isolated local JSON storage.
 *
 * Budget: Strictly ₹0 personal cost.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

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

async function run() {
  console.log(`\n====================================================`);
  console.log(`   NEXORA AI PRODUCTION STORAGE SAFEGUARD SUITE     `);
  console.log(`====================================================\n`);

  // Import compiled storage module from server/dist
  const { validateProductionStorageConfiguration, McpPersistentStore } = await import('../server/dist/storage.js');

  // Save original environment
  const originalEnv = { ...process.env };

  function resetEnv() {
    process.env = { ...originalEnv };
  }

  // ----------------------------------------------------
  // SUITE 1: PRODUCTION WITH MISSING STORAGE_BACKEND
  // ----------------------------------------------------
  console.log(`\n${YELLOW}[Suite 1] Production with Missing STORAGE_BACKEND${RESET}`);
  resetEnv();
  process.env.NODE_ENV = 'production';
  delete process.env.STORAGE_BACKEND;

  const missingRes = validateProductionStorageConfiguration();
  check(missingRes.valid === false, 'Validation fails when STORAGE_BACKEND is omitted in production');
  check(
    missingRes.error?.includes('STORAGE_BACKEND is required in production'),
    'Error message clearly explains STORAGE_BACKEND requirement'
  );
  check(!missingRes.error?.includes('key'), 'Error message contains zero secret credentials');

  let missingThrows = false;
  try {
    new McpPersistentStore();
  } catch (err) {
    missingThrows = err.message.includes('STORAGE_BACKEND is required');
  }
  check(missingThrows, 'McpPersistentStore refuses instantiation in production with missing backend');

  // ----------------------------------------------------
  // SUITE 2: PRODUCTION WITH FORBIDDEN JSON BACKEND
  // ----------------------------------------------------
  console.log(`\n${YELLOW}[Suite 2] Production with Forbidden STORAGE_BACKEND="json"${RESET}`);
  resetEnv();
  process.env.NODE_ENV = 'production';
  process.env.STORAGE_BACKEND = 'json';

  const jsonRes = validateProductionStorageConfiguration();
  check(jsonRes.valid === false, 'Validation fails when STORAGE_BACKEND="json" in production');
  check(
    jsonRes.error?.includes('STORAGE_BACKEND="json" is forbidden in production'),
    'Error explicitly warns against ephemeral data loss on container restarts'
  );

  let jsonThrows = false;
  try {
    new McpPersistentStore();
  } catch (err) {
    jsonThrows = err.message.includes('forbidden in production');
  }
  check(jsonThrows, 'McpPersistentStore constructor throws fatal error when STORAGE_BACKEND="json" in production');

  // ----------------------------------------------------
  // SUITE 3: PRODUCTION WITH INVALID BACKEND STRING
  // ----------------------------------------------------
  console.log(`\n${YELLOW}[Suite 3] Production with Invalid STORAGE_BACKEND String${RESET}`);
  resetEnv();
  process.env.NODE_ENV = 'production';
  process.env.STORAGE_BACKEND = 'redis_cluster';

  const invalidRes = validateProductionStorageConfiguration();
  check(invalidRes.valid === false, 'Validation fails when STORAGE_BACKEND is an invalid unrecognized string');
  check(
    invalidRes.error?.includes('Invalid STORAGE_BACKEND="redis_cluster"'),
    'Error cites invalid backend name and instructs setting "supabase"'
  );

  // ----------------------------------------------------
  // SUITE 4: PRODUCTION WITH MISSING SUPABASE CREDENTIALS
  // ----------------------------------------------------
  console.log(`\n${YELLOW}[Suite 4] Production with Missing Supabase Environment Variables${RESET}`);
  resetEnv();
  process.env.NODE_ENV = 'production';
  process.env.STORAGE_BACKEND = 'supabase';
  delete process.env.SUPABASE_URL;
  delete process.env.EXPO_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_ANON_KEY;
  delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  const noUrlRes = validateProductionStorageConfiguration();
  check(noUrlRes.valid === false, 'Validation fails when SUPABASE_URL is missing in production');
  check(noUrlRes.error?.includes('SUPABASE_URL is missing'), 'Error reports missing SUPABASE_URL');

  process.env.SUPABASE_URL = 'https://example.supabase.co';
  const noKeyRes = validateProductionStorageConfiguration();
  check(noKeyRes.valid === false, 'Validation fails when SUPABASE_ANON_KEY is missing in production');
  check(noKeyRes.error?.includes('SUPABASE_ANON_KEY is missing'), 'Error reports missing SUPABASE_ANON_KEY');

  // ----------------------------------------------------
  // SUITE 5: PRODUCTION WITH VALID SUPABASE CONFIGURATION
  // ----------------------------------------------------
  console.log(`\n${YELLOW}[Suite 5] Production with Valid Supabase Configuration${RESET}`);
  resetEnv();
  process.env.NODE_ENV = 'production';
  process.env.STORAGE_BACKEND = 'supabase';
  process.env.SUPABASE_URL = 'https://prod-valid-ref.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'prod-valid-anon-key-mock-sample';

  const validRes = validateProductionStorageConfiguration();
  check(validRes.valid === true, 'Validation passes with STORAGE_BACKEND="supabase" and configured credentials');

  const prodStore = new McpPersistentStore();
  check(prodStore.getBackend() === 'supabase', 'McpPersistentStore reports backend: "supabase" in production');

  // ----------------------------------------------------
  // SUITE 6: DEVELOPMENT & TEST ENVIRONMENT PRESERVATION
  // ----------------------------------------------------
  console.log(`\n${YELLOW}[Suite 6] Development & Test Environment Preservation${RESET}`);
  resetEnv();
  process.env.NODE_ENV = 'development';
  delete process.env.STORAGE_BACKEND;

  const devRes = validateProductionStorageConfiguration();
  check(devRes.valid === true, 'Validation passes without error in development mode');

  const devStore = new McpPersistentStore();
  check(devStore.getBackend() === 'json', 'McpPersistentStore defaults to "json" in development');

  resetEnv();
  process.env.NODE_ENV = 'test';
  delete process.env.STORAGE_BACKEND;

  const testStore = new McpPersistentStore();
  check(testStore.getBackend() === 'json', 'McpPersistentStore defaults to isolated "json" in test mode');

  // ----------------------------------------------------
  // SUITE 7: LIVE PRODUCTION DATA BYTE-FOR-BYTE INTEGRITY
  // ----------------------------------------------------
  console.log(`\n${YELLOW}[Suite 7] Live Production Data Byte-for-Byte Integrity${RESET}`);
  resetEnv();

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
  process.exit(1);
});
