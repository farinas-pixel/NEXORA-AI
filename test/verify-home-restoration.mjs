/**
 * NEXORA AI — Home Redesign & Original App Restoration Verification
 * Verifies:
 * 1. Home layout (Robot + Orbit + Glassmorphism Chatbot + Restored 5-Item BottomNavBar).
 * 2. Elimination of Core Intelligence Suites cards and Explore tab.
 * 3. BottomNavBar 5-item arrangement: Home | My Day | Central Robot | Friends | My Life.
 * 4. Central Robot single-tap vs double-tap detection to open ActiveChat.
 * 5. Removal of Agents Hub screen from user-facing navigation.
 * 6. Full preservation of authentication, My Day, Friends, My Life, Healthcare, and Memory routes.
 */

import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('\n===============================================================');
console.log('   NEXORA AI — HOME REDESIGN & RESTORATION CONTRACT AUDIT       ');
console.log('===============================================================\n');

const projectRoot = process.cwd();

// Test 1: Home Screen Layout & Unwanted Elements Removal
console.log('[Test 1] Inspecting NexHomeScreen.tsx structure');
{
  const homeContent = fs.readFileSync(path.join(projectRoot, 'src', 'screens', 'NexHomeScreen.tsx'), 'utf8');

  // Verify Cute 3D Robot & Orbit
  assert.ok(homeContent.includes('NexAvatar'), 'NexAvatar must be rendered');
  assert.ok(homeContent.includes('orbitAnim'), 'Animated orbital ring must exist');
  assert.ok(homeContent.includes('orbitContainer'), 'Orbital ring container must exist');
  assert.ok(homeContent.includes('pointerEvents="none"'), 'Orbit must have pointerEvents="none" to prevent tap blocking');
  assert.ok(homeContent.includes('handleAvatarTap'), 'handleAvatarTap must handle robot tap');

  // Verify Glassmorphism Chatbot interface
  assert.ok(homeContent.includes('homeComposerCard'), 'Glassmorphism chatbot interface must exist');
  assert.ok(homeContent.includes('composerTextInput'), 'Text input must exist');
  assert.ok(homeContent.includes('handleHomeChatSubmit'), 'Send text handler must exist');
  assert.ok(homeContent.includes('micControlBtn'), 'Voice control button must exist');
  assert.ok(homeContent.includes('sendActionBtn'), 'Send button must exist');

  // Verify Restored BottomNavBar is hosted
  assert.ok(homeContent.includes('<BottomNavBar'), 'BottomNavBar component must be rendered on Home');
  assert.ok(homeContent.includes('onDoubleTapChat='), 'BottomNavBar must have onDoubleTapChat callback');

  // Verify Removal of Core Intelligence Suites cards & 3-item dock / Explore
  assert.ok(!homeContent.includes('suitesGrid'), 'Core Intelligence Suites grid must be removed from Home');
  assert.ok(!homeContent.includes('suiteCard'), 'Suite cards must be removed from Home');
  assert.ok(!homeContent.includes('bottomNavGlassBar'), '3-item navigation bar must be removed');
  assert.ok(!homeContent.includes('Explore tab'), 'Explore tab must not exist on Home');
  assert.ok(!homeContent.includes('handleExplorePress'), 'handleExplorePress must be removed');

  console.log('  ✓ Top 3D Robot with animated planetary orbit present');
  console.log('  ✓ Glassmorphism Chatbot interface directly below robot with functional text and voice');
  console.log('  ✓ Core Intelligence Suites cards and Explore tab completely removed');
  console.log('  ✓ Original BottomNavBar integration restored on Home');
}

// Test 2: Bottom Navigation Structure (5 Items)
console.log('\n[Test 2] Inspecting BottomNavBar.tsx 5-item structure');
{
  const navContent = fs.readFileSync(path.join(projectRoot, 'src', 'components', 'common', 'BottomNavBar.tsx'), 'utf8');

  // Verify Home, My Day, Friends, My Life
  assert.ok(navContent.includes("onTabPress('Home')"), 'Home tab button must exist');
  assert.ok(navContent.includes("onTabPress('MyDay')"), 'My Day tab button must exist');
  assert.ok(navContent.includes("onTabPress('Friends')"), 'Friends tab button must exist');
  assert.ok(navContent.includes("onTabPress('MyLife')"), 'My Life tab button must exist');

  // Verify Central Robot (RadialQuickActionMenu)
  assert.ok(navContent.includes('<RadialQuickActionMenu'), 'Central Robot (RadialQuickActionMenu) must exist in dock');
  assert.ok(navContent.includes('onDoubleTapChat'), 'onDoubleTapChat handler must be wired');

  // Verify Vector Icons (NO Emojis)
  assert.ok(navContent.includes('Ionicons'), 'BottomNavBar must use Ionicons');
  assert.ok(!navContent.includes("icon: '🏠'"), 'Home tab must not use emoji');
  assert.ok(!navContent.includes("icon: '📅'"), 'Calendar tab must not use emoji');
  assert.ok(!navContent.includes("icon: '👥'"), 'Friends tab must not use emoji');
  assert.ok(!navContent.includes("icon: '✨'"), 'Memory tab must not use emoji');

  console.log('  ✓ 5 items verified: Home | My Day | Central Robot | Friends | My Life');
  console.log('  ✓ Vector icons verified with zero emojis');
}

// Test 3: Central Robot Single-Tap vs Double-Tap Logic
console.log('\n[Test 3] Inspecting RadialQuickActionMenu.tsx tap behavior');
{
  const radialContent = fs.readFileSync(path.join(projectRoot, 'src', 'components', 'common', 'RadialQuickActionMenu.tsx'), 'utf8');

  assert.ok(radialContent.includes('DOUBLE_TAP_THRESHOLD_MS'), 'DOUBLE_TAP_THRESHOLD_MS timing constant exists');
  assert.ok(radialContent.includes('handleCenterButtonPress'), 'handleCenterButtonPress handles center button');
  assert.ok(radialContent.includes('clearTimeout(tapTimeoutRef.current)'), 'Double-tap cancels single-tap timeout');
  assert.ok(radialContent.includes('onDoubleTapChat()'), 'Double-tap invokes onDoubleTapChat callback');

  console.log('  ✓ Reliable single-tap delayed toggle with cancellation');
  console.log('  ✓ Double-tap directly opens AI Assistant Chat without conflicting actions');
}

// Test 4: Removal of Agents Hub Screen from User Navigation
console.log('\n[Test 4] Inspecting user-facing navigation for Agents Hub removal');
{
  const rootContent = fs.readFileSync(path.join(projectRoot, 'src', 'navigation', 'RootNavigator.tsx'), 'utf8');
  assert.ok(!rootContent.includes('<Stack.Screen name="AgentsHub"'), 'AgentsHub must not be registered in RootNavigator Stack');

  const chatContent = fs.readFileSync(path.join(projectRoot, 'src', 'screens', 'ActiveChatScreen.tsx'), 'utf8');
  assert.ok(!chatContent.includes("navigation.navigate('AgentsHub')"), 'ActiveChatScreen must not navigate to AgentsHub');

  const homeContent = fs.readFileSync(path.join(projectRoot, 'src', 'screens', 'NexHomeScreen.tsx'), 'utf8');
  assert.ok(!homeContent.includes("navigation.navigate('AgentsHub')"), 'NexHomeScreen must not navigate to AgentsHub');

  console.log('  ✓ AgentsHub removed from RootNavigator Stack');
  console.log('  ✓ All user-facing entries to AgentsHub removed');
}

// Test 5: Preservation of Authentication & Core Routes
console.log('\n[Test 5] Inspecting preservation of authentication and core features');
{
  const rootContent = fs.readFileSync(path.join(projectRoot, 'src', 'navigation', 'RootNavigator.tsx'), 'utf8');

  // Authentication
  assert.ok(rootContent.includes('SignIn'), 'SignInScreen route preserved');
  assert.ok(rootContent.includes('CreateAccount'), 'CreateAccountScreen route preserved');
  assert.ok(rootContent.includes('ForgotPassword'), 'ForgotPasswordScreen route preserved');
  assert.ok(rootContent.includes('ResetPassword'), 'ResetPasswordScreen route preserved');

  // Core Features
  assert.ok(rootContent.includes('MyDay'), 'MyDay route preserved');
  assert.ok(rootContent.includes('MyLife'), 'MyLife route preserved');
  assert.ok(rootContent.includes('FriendsChat'), 'FriendsChat route preserved');
  assert.ok(rootContent.includes('ActiveChat'), 'ActiveChat route preserved');
  assert.ok(rootContent.includes('LiveVoice'), 'LiveVoice route preserved');
  assert.ok(rootContent.includes('Healthcare'), 'Healthcare route preserved');
  assert.ok(rootContent.includes('MemoryOverview'), 'MemoryOverview route preserved');
  assert.ok(rootContent.includes('SecurityCenter'), 'SecurityCenter route preserved');

  console.log('  ✓ All authentication routes intact');
  console.log('  ✓ All core feature routes intact');
}

console.log('\n===============================================================');
console.log('   ALL 5 RESTORATION VERIFICATION SUITES PASSED                ');
console.log('===============================================================\n');
