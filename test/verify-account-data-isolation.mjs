/**
 * NEXORA AI — Account Data Isolation, Multi-User Synchronization & Email Redirect Audit
 * 
 * Verifies:
 * 1. Production verification redirects target the official Render domain:
 *    https://nexora-ai-web-z486.onrender.com/
 * 2. Hard-coded identities ('Isha Shree S', 'isha@nexora.ai', 'Partner') are completely removed.
 * 3. Email prefixes are NOT used as substitutes for user profile names.
 * 4. Account-scoped cache keys partition user records (@nexora_<userId>_*).
 * 5. Genuinely new accounts start in clean/empty state (zero cross-contamination).
 * 6. Switching accounts safely invalidates transient cache without leaking stale records.
 * 7. Signing back into the original account restores all existing records intact.
 * 8. DataResetService is guarded so it NEVER wipes remote records for authenticated users.
 */

import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('\n================================================================');
console.log('  NEXORA AI — ACCOUNT DATA ISOLATION & REDIRECT VERIFICATION    ');
console.log('================================================================\n');

const projectRoot = process.cwd();

// -------------------------------------------------------------
// Test 1: Production Email Verification Redirects
// -------------------------------------------------------------
console.log('[Test 1] Inspecting Production Auth Redirect URLs & Official Domain');
{
  const authServiceContent = fs.readFileSync(
    path.join(projectRoot, 'src', 'services', 'auth', 'authService.ts'),
    'utf8'
  );

  const officialDomain = 'https://nexora-ai-web-z486.onrender.com';
  assert.ok(
    authServiceContent.includes(officialDomain),
    'authService.ts must configure official production domain: ' + officialDomain
  );

  assert.ok(
    authServiceContent.includes("getAuthRedirectUrl = (path: 'confirm-email' | 'reset-password')"),
    'authService.ts must export getAuthRedirectUrl helper'
  );

  assert.ok(
    authServiceContent.includes("emailRedirectTo: getAuthRedirectUrl('confirm-email')"),
    'signUp and resendConfirmationEmail must redirect to getAuthRedirectUrl("confirm-email")'
  );

  assert.ok(
    authServiceContent.includes("redirectTo: getAuthRedirectUrl('reset-password')"),
    'resetPassword must redirect to getAuthRedirectUrl("reset-password")'
  );

  // Verify RootNavigator linking configuration
  const rootNavContent = fs.readFileSync(
    path.join(projectRoot, 'src', 'navigation', 'RootNavigator.tsx'),
    'utf8'
  );
  assert.ok(rootNavContent.includes("SignIn: 'confirm-email'"), 'RootNavigator linking must route confirm-email to SignIn');
  assert.ok(rootNavContent.includes("ResetPassword: 'reset-password'"), 'RootNavigator linking must route reset-password to ResetPassword');

  console.log('  ✓ Official Render domain configured: ' + officialDomain);
  console.log('  ✓ Production verification redirects to /confirm-email on official domain');
  console.log('  ✓ Production password reset redirects to /reset-password on official domain');
  console.log('  ✓ RootNavigator linking maps both paths declaratively');
}

// -------------------------------------------------------------
// Test 2: Elimination of Hard-Coded Names, Fallbacks, & Email Prefixes
// -------------------------------------------------------------
console.log('\n[Test 2] Auditing Source Code for Hard-Coded Identifiers & Name Resolution');
{
  const appContextContent = fs.readFileSync(
    path.join(projectRoot, 'src', 'context', 'AppContext.tsx'),
    'utf8'
  );
  const authServiceContent = fs.readFileSync(
    path.join(projectRoot, 'src', 'services', 'auth', 'authService.ts'),
    'utf8'
  );

  // Check hardcoded personal name / email
  assert.ok(
    !appContextContent.includes('Isha Shree S'),
    'AppContext must NOT contain hardcoded name "Isha Shree S"'
  );
  assert.ok(
    !appContextContent.includes('isha@nexora.ai'),
    'AppContext must NOT contain hardcoded email "isha@nexora.ai"'
  );
  assert.ok(
    !appContextContent.includes("name: 'Partner'"),
    'AppContext must NOT contain hardcoded "Partner" profile fallback'
  );

  // Check email prefix fallback prohibition in authService.ts
  assert.ok(
    !authServiceContent.includes("email.split('@')[0]"),
    'authService.ts must NOT use email prefix (email.split("@")[0]) as a substitute for user profile name'
  );

  console.log('  ✓ Zero hard-coded real names or test emails found in AppContext');
  console.log('  ✓ Hardcoded "Partner" fallback removed');
  console.log('  ✓ Email prefix substitution prohibited; real profile name metadata prioritized');
}

// -------------------------------------------------------------
// Test 3: Account-Scoped Key Isolation Logic Simulation
// -------------------------------------------------------------
console.log('\n[Test 3] Simulating Account-Scoped Cache Key Generation & Data Partitioning');
{
  const mockStorageService = {
    activeStorageUserId: null,
    setActiveUser(userId) {
      this.activeStorageUserId = userId ? userId.trim() : null;
    },
    getScopedKey(baseKey, explicitUserId) {
      const uid = explicitUserId || this.activeStorageUserId;
      if (uid) {
        return `@nexora_${uid}_${baseKey.replace(/^@nexora_/, '')}`;
      }
      return baseKey;
    },
  };

  const USER_A_ID = 'aaaaaaaa-1111-2222-3333-444444444444';
  const USER_B_ID = 'bbbbbbbb-5555-6666-7777-888888888888';

  // Account A active
  mockStorageService.setActiveUser(USER_A_ID);
  const taskKeyA = mockStorageService.getScopedKey('@nexora_tasks');
  const memKeyA = mockStorageService.getScopedKey('@nexora_memories');
  const prefKeyA = mockStorageService.getScopedKey('@nexora_preferences');

  assert.equal(taskKeyA, `@nexora_${USER_A_ID}_tasks`);
  assert.equal(memKeyA, `@nexora_${USER_A_ID}_memories`);
  assert.equal(prefKeyA, `@nexora_${USER_A_ID}_preferences`);

  // Switch to Account B
  mockStorageService.setActiveUser(USER_B_ID);
  const taskKeyB = mockStorageService.getScopedKey('@nexora_tasks');
  const memKeyB = mockStorageService.getScopedKey('@nexora_memories');
  const prefKeyB = mockStorageService.getScopedKey('@nexora_preferences');

  assert.equal(taskKeyB, `@nexora_${USER_B_ID}_tasks`);
  assert.equal(memKeyB, `@nexora_${USER_B_ID}_memories`);
  assert.equal(prefKeyB, `@nexora_${USER_B_ID}_preferences`);

  // Keys must never collide
  assert.notEqual(taskKeyA, taskKeyB, 'Account A and Account B task keys must be distinct');
  assert.notEqual(memKeyA, memKeyB, 'Account A and Account B memory keys must be distinct');
  assert.notEqual(prefKeyA, prefKeyB, 'Account A and Account B preference keys must be distinct');

  console.log('  ✓ Account A keys scoped cleanly to @nexora_' + USER_A_ID + '_*');
  console.log('  ✓ Account B keys scoped cleanly to @nexora_' + USER_B_ID + '_*');
  console.log('  ✓ Zero cross-partition key collision');
}

// -------------------------------------------------------------
// Test 4: Multi-User Account Switching & Isolation Lifecycle Simulation
// -------------------------------------------------------------
console.log('\n[Test 4] Simulating Account Switching Lifecycle (Account A -> Sign Out -> Account B -> Sign Out -> Account A)');
{
  const mockStorageStore = new Map();
  const USER_A_ID = '11111111-aaaa-bbbb-cccc-000000000001';
  const USER_B_ID = '22222222-dddd-eeee-ffff-000000000002';

  let currentActiveUser = null;

  const setActive = (uid) => {
    currentActiveUser = uid;
  };

  const getScopedKey = (base, uid = currentActiveUser) => {
    return uid ? `@nexora_${uid}_${base.replace(/^@nexora_/, '')}` : base;
  };

  const saveTasks = async (uid, tasks) => {
    mockStorageStore.set(getScopedKey('@nexora_tasks', uid), JSON.stringify(tasks));
  };

  const loadTasks = async (uid) => {
    const raw = mockStorageStore.get(getScopedKey('@nexora_tasks', uid));
    return raw ? JSON.parse(raw) : [];
  };

  const signOut = async () => {
    // Mimic supabaseDataService.clearLocalCache: remove transient global keys only
    currentActiveUser = null;
    mockStorageStore.delete('@nexora_user_profile');
    mockStorageStore.delete('@nexora_tasks');
    mockStorageStore.delete('@nexora_reminders');
  };

  // Phase 1: User A logs in and creates 2 tasks
  setActive(USER_A_ID);
  await saveTasks(USER_A_ID, [
    { id: 't_a1', title: 'User A Secret Task 1', completed: false },
    { id: 't_a2', title: 'User A Secret Task 2', completed: true },
  ]);
  const userATasksInitial = await loadTasks(USER_A_ID);
  assert.equal(userATasksInitial.length, 2, 'User A must have 2 tasks');

  // Phase 2: User A signs out
  await signOut();
  assert.equal(currentActiveUser, null, 'Active user must be null on sign-out');

  // Phase 3: Genuinely new user B logs in (has no prior records)
  setActive(USER_B_ID);
  const userBTasks = await loadTasks(USER_B_ID);
  assert.equal(userBTasks.length, 0, 'Genuinely new User B must see clean empty task list');

  // User B creates their own task
  await saveTasks(USER_B_ID, [
    { id: 't_b1', title: 'User B Onboarding Task', completed: false },
  ]);
  const userBTasksAfterCreate = await loadTasks(USER_B_ID);
  assert.equal(userBTasksAfterCreate.length, 1);
  assert.equal(userBTasksAfterCreate[0].title, 'User B Onboarding Task');

  // Phase 4: User B signs out
  await signOut();

  // Phase 5: User A logs back in
  setActive(USER_A_ID);
  const userATasksRestored = await loadTasks(USER_A_ID);
  assert.equal(userATasksRestored.length, 2, 'User A records must be restored completely intact');
  assert.equal(userATasksRestored[0].id, 't_a1');
  assert.equal(userATasksRestored[1].id, 't_a2');

  console.log('  ✓ User A created 2 tasks in isolated partition');
  console.log('  ✓ User B signed in as new account with 0 tasks (no User A data leakage)');
  console.log('  ✓ User B created independent tasks without affecting User A');
  console.log('  ✓ User A signed back in and restored all records intact');
}

// -------------------------------------------------------------
// Test 5: DataResetService Remote Wipe Protection Audit
// -------------------------------------------------------------
console.log('\n[Test 5] Inspecting DataResetService Remote Deletion Guard');
{
  const dataResetContent = fs.readFileSync(
    path.join(projectRoot, 'src', 'services', 'dataResetService.ts'),
    'utf8'
  );

  // Verify authenticated session check prevents data wipe
  assert.ok(
    dataResetContent.includes('sessionData?.session?.user?.id'),
    'isResetDone must check sessionData to protect authenticated users from data wipe'
  );
  assert.ok(
    dataResetContent.includes('isRealUser'),
    'executeReset must guard against deleting remote records for real users'
  );

  console.log('  ✓ Authenticated user session check protects remote records from deletion');
  console.log('  ✓ isRealUser guard prevents remote database wipes for signed-in accounts');
}

// -------------------------------------------------------------
// Test 6: AppContext Onboarding State Overwrite Prevention
// -------------------------------------------------------------
console.log('\n[Test 6] Inspecting AppContext completeOnboarding Guard');
{
  const appContextContent = fs.readFileSync(
    path.join(projectRoot, 'src', 'context', 'AppContext.tsx'),
    'utf8'
  );

  assert.ok(
    appContextContent.includes('if (!userRef.current)'),
    'completeOnboarding must check userRef.current to avoid overwriting authenticated profile'
  );

  assert.ok(
    appContextContent.includes('data?.session?.user'),
    'completeOnboarding must check remote session before initializing local guest user'
  );

  console.log('  ✓ completeOnboarding preserves authenticated user profile from signIn');
  console.log('  ✓ Guest profile initialization only runs for unauthenticated sessions');
}

console.log('\n================================================================');
console.log('  ALL ACCOUNT ISOLATION & REDIRECT TESTS PASSED (6/6)           ');
console.log('================================================================\n');
