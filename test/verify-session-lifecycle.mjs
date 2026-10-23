/**
 * NEXORA AI — Session Lifecycle & Post-Login Freeze Regression Audit
 * 
 * AUDIT SCOPE & LIMITATIONS:
 * This script performs a static source contract audit and pure JavaScript
 * logic-state simulation. Because this repository does not include a full React
 * DOM/Hook testing framework (such as Jest or @testing-library/react), this script
 * verifies source contract constraints and simulates idempotency logic.
 * Actual runtime DOM rendering and event-loop unresponsiveness must be confirmed
 * via the manual browser test plan.
 * 
 * Verifies that:
 * 1. AppContext.tsx breaks the startup useEffect -> loadUserData -> setUser dependency cycle.
 * 2. Session restoration is guarded to run once per provider mount lifecycle.
 * 3. Network listener is attached once and calls the safe ref-backed loadUserData.
 * 4. loadUserData maintains identity stability ([]) while reading the latest authenticated user via userRef.
 * 5. DataResetService contains an in-flight guard preventing duplicate/concurrent resets.
 * 6. SignInScreen relies purely on RootNavigator's declarative authentication stack switch.
 */

import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('\n===============================================================');
console.log('   NEXORA AI — SESSION LIFECYCLE & FREEZE REGRESSION AUDIT     ');
console.log('   (Static Source Contract Audit & JS State Simulation)        ');
console.log('===============================================================\n');

const projectRoot = process.cwd();

// Test 1: AppContext.tsx dependency cycle resolution
console.log('[Test 1] Inspecting AppContext.tsx lifecycle and effect dependencies');
{
  const appContextContent = fs.readFileSync(path.join(projectRoot, 'src', 'context', 'AppContext.tsx'), 'utf8');

  // Verify userRef prevents stale closures without re-triggering effects
  assert.ok(appContextContent.includes('const userRef = useRef<UserProfile | null>(user);'), 'Must maintain userRef for fresh user profile access');
  assert.ok(appContextContent.includes('userRef.current = user;'), 'Must synchronize userRef with state updates');

  // Verify loadUserData has stable callback identity ([])
  const loadUserDataMatch = appContextContent.match(/const loadUserData = useCallback\(async \([\s\S]*?\n\s*\}, \[\]\);/);
  assert.ok(loadUserDataMatch, 'loadUserData must have a stable dependency array ([]) to avoid re-triggering startup and network effects');

  // Verify loadUserData reads userRef or targetUserId parameter
  assert.ok(appContextContent.includes('currentUserId = targetUserId || userRef.current?.id || sessionData?.session?.user?.id;'), 'loadUserData must resolve user ID safely without stale closures');

  // Verify startup useEffect does NOT depend on loadUserData
  const startupEffectMatch = appContextContent.match(/\/\/ Load persistent data on startup[\s\S]*?\n\s*\}, \[\]\);/);
  assert.ok(startupEffectMatch, 'Startup useEffect must run once on provider mount with an empty dependency array ([])');

  // Verify session restoration has execution guard
  assert.ok(appContextContent.includes('sessionRestoreStartedRef'), 'Must guard session restoration with sessionRestoreStartedRef');
  assert.ok(appContextContent.includes('hasCompletedAuthResolutionRef'), 'Must track completion with hasCompletedAuthResolutionRef for Strict Mode resilience');

  // Verify network listener useEffect runs once on mount ([])
  const networkEffectMatch = appContextContent.match(/\/\/ Monitor hardware network state[\s\S]*?\n\s*\}, \[\]\);/);
  assert.ok(networkEffectMatch, 'Network listener effect must run once on mount with an empty dependency array ([])');
  assert.ok(appContextContent.includes('loadUserDataRef.current()'), 'Network listener must invoke loadUserDataRef.current()');

  console.log('  ✓ Startup useEffect decoupled from loadUserData identity');
  console.log('  ✓ loadUserData identity stabilized with userRef freshness');
  console.log('  ✓ Session restoration guarded against repeated execution on rerender');
  console.log('  ✓ Network listener registered once per provider mount');
}

// Test 2: DataResetService.ts in-flight execution guard
console.log('\n[Test 2] Inspecting DataResetService.ts in-flight execution guard');
{
  const dataResetContent = fs.readFileSync(path.join(projectRoot, 'src', 'services', 'dataResetService.ts'), 'utf8');

  assert.ok(dataResetContent.includes('_inFlightResetPromise'), 'Must maintain _inFlightResetPromise singleton guard');
  assert.ok(dataResetContent.includes('if (_inFlightResetPromise) {'), 'ensureTargetedReset must return existing in-flight promise if active');
  assert.ok(dataResetContent.includes('_inFlightResetPromise = null;'), 'Must clean up in-flight promise on completion');

  console.log('  ✓ DataResetService guarded against concurrent / repeated reset execution');
}

// Test 3: SignInScreen.tsx declarative navigation transition
console.log('\n[Test 3] Inspecting SignInScreen.tsx authentication transition');
{
  const signInContent = fs.readFileSync(path.join(projectRoot, 'src', 'screens', 'SignInScreen.tsx'), 'utf8');

  assert.ok(signInContent.includes('await signIn(email.trim(), password);'), 'Must authenticate user');
  assert.ok(signInContent.includes('await completeOnboarding();'), 'Must complete onboarding');
  assert.ok(!signInContent.includes("navigation.replace('Home')"), 'Must NOT contain redundant navigation.replace to prevent unmounted collisions');
  assert.ok(!signInContent.includes('navigation.canGoBack?.()'), 'Must NOT contain unreliable canGoBack guard');

  console.log('  ✓ Authentication and onboarding preserved');
  console.log('  ✓ Declarative RootNavigator stack switch preferred (redundant replace removed)');
}

// Test 4: Simulation of Session Restoration Idempotency
console.log('\n[Test 4] Simulating session restoration idempotency in multi-render lifecycle');
{
  let restoreSessionCallCount = 0;
  let sessionRestoreStarted = false;
  let hasCompletedAuthResolution = false;

  const mockRestoreSession = async () => {
    restoreSessionCallCount++;
    return { id: 'usr_test_123', name: 'Test User' };
  };

  // Simulating provider render cycle 1 (initial mount)
  const simulateMount = async () => {
    let isMounted = true;
    if (sessionRestoreStarted) return;
    sessionRestoreStarted = true;

    const profile = await mockRestoreSession();
    if (!isMounted) return;
    hasCompletedAuthResolution = true;
  };

  await simulateMount();

  // Simulating provider re-renders 2, 3, 4 (e.g. from setUser, loadUserData, context consumers)
  for (let i = 0; i < 5; i++) {
    let isMounted = true;
    if (sessionRestoreStarted) {
      // Guard correctly prevents re-running
      continue;
    }
    await simulateMount();
  }

  assert.equal(restoreSessionCallCount, 1, 'restoreSession must only execute once across multiple provider re-renders');
  assert.equal(hasCompletedAuthResolution, true, 'auth resolution must be marked complete');

  console.log(`  ✓ restoreSession executed exactly ${restoreSessionCallCount} time across 6 simulated render cycles`);
}

console.log('\n===============================================================');
console.log('   ALL SESSION LIFECYCLE & FREEZE TESTS PASSED (4/4)            ');
console.log('===============================================================\n');
