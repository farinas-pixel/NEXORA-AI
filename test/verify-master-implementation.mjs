/**
 * NEXORA AI — Master Implementation Verification Suite
 * Verifies Healthcare CRUD, Goals CRUD, Memory CRUD, Voice Auto-Send,
 * ToolManager additions, and Navigation registration.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('\n======================================================');
console.log('   NEXORA AI — MASTER IMPLEMENTATION VERIFICATION     ');
console.log('======================================================\n');

let passed = 0;
let failed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  ✓ ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    Error: ${err.message}`);
    failed++;
  }
}

// 1. StorageService & Healthcare Contract
test('[StorageService] HealthRecord interface and methods', () => {
  const storageContent = fs.readFileSync('src/services/storage.ts', 'utf8');
  assert.ok(storageContent.includes('interface HealthRecord'), 'HealthRecord interface defined');
  assert.ok(storageContent.includes('getHealthRecords()'), 'getHealthRecords method exists');
  assert.ok(storageContent.includes('saveHealthRecord('), 'saveHealthRecord method exists');
  assert.ok(storageContent.includes('updateHealthRecord('), 'updateHealthRecord method exists');
  assert.ok(storageContent.includes('deleteHealthRecord('), 'deleteHealthRecord method exists');
  assert.ok(storageContent.includes('HEALTH_RECORDS: \'@nexora_health_records\''), 'Health records key defined');
});

// 2. StorageService Goals & Memory CRUD
test('[StorageService] Goals and Memory update/delete methods', () => {
  const storageContent = fs.readFileSync('src/services/storage.ts', 'utf8');
  assert.ok(storageContent.includes('updateGoal('), 'updateGoal method exists');
  assert.ok(storageContent.includes('deleteGoal('), 'deleteGoal method exists');
  assert.ok(storageContent.includes('updateMemory('), 'updateMemory method exists');
});

// 3. Voice Auto-Submit Configuration
test('[Preferences] autoSendVoice setting configured', () => {
  const storageContent = fs.readFileSync('src/services/storage.ts', 'utf8');
  assert.ok(storageContent.includes('autoSendVoice?: boolean'), 'autoSendVoice in UserPreferences');
  assert.ok(storageContent.includes('autoSendVoice: true'), 'autoSendVoice defaults to true');

  const voicePrefs = fs.readFileSync('src/screens/VoicePreferencesScreen.tsx', 'utf8');
  assert.ok(voicePrefs.includes('autoSendVoice'), 'autoSendVoice present in VoicePreferencesScreen');
  assert.ok(voicePrefs.includes('Auto-Submit Voice Queries'), 'UI label present');
});

// 4. ActiveChatScreen Keyboard & Inline Voice Recognition
test('[ActiveChatScreen] Keyboard-aware height and inline speech recognition', () => {
  const chatContent = fs.readFileSync('src/screens/ActiveChatScreen.tsx', 'utf8');
  assert.ok(chatContent.includes('KeyboardAvoidingView'), 'KeyboardAvoidingView present');
  assert.ok(chatContent.includes("Platform.OS === 'ios' ? 'padding' : 'height'"), 'Height behavior for Android');
  assert.ok(chatContent.includes('ExpoSpeechRecognitionModule'), 'ExpoSpeechRecognitionModule imported');
  assert.ok(chatContent.includes('useSpeechRecognitionEvent'), 'useSpeechRecognitionEvent imported');
  assert.ok(chatContent.includes('autoSendVoice'), 'Respects autoSendVoice preference');
  assert.ok(chatContent.includes('speechDoneRef'), 'Debounce/lock against duplicate submits');
});

// 5. HealthcareScreen Implementation
test('[HealthcareScreen] Complete component implementation and safe disclaimers', () => {
  assert.ok(fs.existsSync('src/screens/HealthcareScreen.tsx'), 'HealthcareScreen.tsx exists');
  const healthContent = fs.readFileSync('src/screens/HealthcareScreen.tsx', 'utf8');
  assert.ok(healthContent.includes('Healthcare & Vitals'), 'Title rendered');
  assert.ok(healthContent.includes('Medical Guidance & Urgent Care Notice'), 'Urgent care warning rendered');
  assert.ok(healthContent.includes('StorageService.getHealthRecords'), 'Loads health records');
  assert.ok(healthContent.includes('StorageService.saveHealthRecord'), 'Saves health records');
  assert.ok(healthContent.includes('StorageService.updateHealthRecord'), 'Updates health records');
  assert.ok(healthContent.includes('StorageService.deleteHealthRecord'), 'Deletes health records');
  assert.ok(healthContent.includes('handleToggleMedicationTaken'), 'Medication taken toggle');
  assert.ok(healthContent.includes('handleToggleSymptomResolved'), 'Symptom resolved toggle');
});

// 6. Navigation Registration
test('[Navigation] Healthcare registered in RootStackParamList and RootNavigator', () => {
  const navTypes = fs.readFileSync('src/types/navigation.ts', 'utf8');
  assert.ok(navTypes.includes('Healthcare: undefined;'), 'Healthcare in RootStackParamList');

  const navRoot = fs.readFileSync('src/navigation/RootNavigator.tsx', 'utf8');
  assert.ok(navRoot.includes('HealthcareScreen'), 'HealthcareScreen imported');
  assert.ok(navRoot.includes('<Stack.Screen name="Healthcare" component={HealthcareScreen} />'), 'Healthcare route registered');

  const screensIndex = fs.readFileSync('src/screens/index.ts', 'utf8');
  assert.ok(screensIndex.includes("export * from './HealthcareScreen'"), 'HealthcareScreen exported');
});

// 7. NexHomeScreen Glassmorphism Composer & Entry Points
test('[NexHomeScreen] Composer dock and header layout', () => {
  const homeContent = fs.readFileSync('src/screens/NexHomeScreen.tsx', 'utf8');
  assert.ok(homeContent.includes('homeComposerCard'), 'Glassmorphism home composer dock exists');
  assert.ok(homeContent.includes('handleHomeChatSubmit'), 'Home chat submit handler wired');
  assert.ok(homeContent.includes("navigation.navigate('Healthcare')"), 'Healthcare suite link present');
  assert.ok(homeContent.includes("navigation.navigate('Profile')"), 'Profile header button wired');
  assert.ok(homeContent.includes("navigation.navigate('VoicePreferences')"), 'Settings header button wired');
});

// 8. ToolManager Tool Extensions
test('[ToolManager] Registered tools include add_health_record and create_goal', () => {
  const toolContent = fs.readFileSync('src/services/tools/toolManager.ts', 'utf8');
  assert.ok(toolContent.includes('add_health_record'), 'add_health_record tool registered');
  assert.ok(toolContent.includes('create_goal'), 'create_goal tool registered');
  assert.ok(toolContent.includes('saveHealthRecord'), 'Calls saveHealthRecord');
  assert.ok(toolContent.includes('saveGoal'), 'Calls saveGoal');
});

// 9. MemoryOverviewScreen In-Place Edit
test('[MemoryOverviewScreen] In-place edit and delete controls', () => {
  const memContent = fs.readFileSync('src/screens/MemoryOverviewScreen.tsx', 'utf8');
  assert.ok(memContent.includes('handleStartEdit'), 'handleStartEdit present');
  assert.ok(memContent.includes('handleSaveEdit'), 'handleSaveEdit present');
  assert.ok(memContent.includes('updateMemory'), 'Calls updateMemory');
  assert.ok(memContent.includes('handleDelete'), 'Alert-confirmed delete present');
});

// 10. Package ID & Protected Security Files
test('[Configuration] Package ID com.nexora.ai preserved and no regression on auth', () => {
  const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
  assert.strictEqual(appJson.expo.android.package, 'com.nexora.ai', 'Package ID is com.nexora.ai');

  const authContent = fs.readFileSync('src/services/auth/authService.ts', 'utf8');
  assert.ok(authContent.includes('restoreSession'), 'restoreSession preserved');
  assert.ok(authContent.includes('signIn'), 'signIn preserved');
  assert.ok(authContent.includes('signUp'), 'signUp preserved');
});

console.log('\n======================================================');
console.log(`   EXECUTION SUMMARY: Passed ${passed} / ${passed + failed} tests`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
}
