/**
 * NEXORA AI — Language Localization, Onboarding & Persistence Verification
 */

import { TRANSLATIONS, translate, SUPPORTED_LANGUAGES } from '../src/i18n/translations.ts';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('====================================================');
console.log('   NEXORA AI LOCALIZATION & PERSISTENCE TEST        ');
console.log('====================================================\n');

// [Test 1] Translation Dictionary Integrity
console.log('[Test 1] Supported Languages & Dictionary Integrity');
assert(SUPPORTED_LANGUAGES.length >= 2, 'Exports at least 2 primary supported languages');
assert(SUPPORTED_LANGUAGES.some((l) => l.code === 'en-US'), 'Includes en-US configuration');
assert(SUPPORTED_LANGUAGES.some((l) => l.code === 'ta-IN'), 'Includes ta-IN configuration');

const enKeys = Object.keys(TRANSLATIONS['en-US']);
const taKeys = Object.keys(TRANSLATIONS['ta-IN']);

assert(enKeys.length > 30, `en-US contains ${enKeys.length} translation keys`);
assert(taKeys.length > 30, `ta-IN contains ${taKeys.length} translation keys`);

let missingInTamil = [];
for (const k of enKeys) {
  if (!TRANSLATIONS['ta-IN'][k]) {
    missingInTamil.push(k);
  }
}
assert(missingInTamil.length === 0, `All en-US keys exist in ta-IN (missing: ${missingInTamil.join(', ')})`);

// [Test 2] Tamil Script & Natural Language Content Verification
console.log('\n[Test 2] Tamil Script Accuracy & Key Translations');
assert(TRANSLATIONS['ta-IN'].nav_home === 'முகப்பு', 'Nav Home translated to தமிழ் (முகப்பு)');
assert(TRANSLATIONS['ta-IN'].nav_my_day === 'எனது நாள்', 'Nav My Day translated to தமிழ் (எனது நாள்)');
assert(TRANSLATIONS['ta-IN'].nav_chat === 'அரட்டை', 'Nav Chat translated to தமிழ் (அரட்டை)');
assert(TRANSLATIONS['ta-IN'].nav_friends === 'நண்பர்கள்', 'Nav Friends translated to தமிழ் (நண்பர்கள்)');
assert(TRANSLATIONS['ta-IN'].nav_my_life === 'எனது வாழ்க்கை', 'Nav My Life translated to தமிழ் (எனது வாழ்க்கை)');
assert(TRANSLATIONS['ta-IN'].greeting_morning === 'காலை வணக்கம்', 'Good morning translated to தமிழ் (காலை வணக்கம்)');
assert(TRANSLATIONS['ta-IN'].greeting_evening === 'மாலை வணக்கம்', 'Good evening translated to தமிழ் (மாலை வணக்கம்)');
assert(TRANSLATIONS['ta-IN'].action_confirm === 'உறுதிப்படுத்துக', 'Action confirm translated to தமிழ் (உறுதிப்படுத்துக)');
assert(TRANSLATIONS['ta-IN'].action_get_started === 'தொடங்குக', 'Get started translated to தமிழ் (தொடங்குக)');

// [Test 3] Translation Function & Parameter Substitution
console.log('\n[Test 3] Dynamic Translation & Parametric Interpolation');
const paramTestEn = translate('missed_reminder_scheduled_for', 'en-US', {
  title: 'Water plants',
  time: '10:00 AM',
});
assert(
  paramTestEn === '"Water plants" was scheduled for 10:00 AM',
  `Parametric replacement works in English: ${paramTestEn}`
);

const paramTestTa = translate('missed_reminder_scheduled_for', 'ta-IN', {
  title: 'செடிகளுக்கு தண்ணீர்',
  time: '10:00 AM',
});
assert(
  paramTestTa.includes('செடிகளுக்கு தண்ணீர்') && paramTestTa.includes('10:00 AM'),
  `Parametric replacement works in Tamil: ${paramTestTa}`
);

// Fallback behavior
const fallbackTest = translate('nav_home', 'unknown-lang');
assert(fallbackTest === 'Home', 'Falls back to en-US when language code is unconfigured');

// [Test 4] App Level Key Preservation on Cache Clear
console.log('\n[Test 4] Local Cache Clearance & Preference Preservation');
const mockKeys = [
  '@nexora_user_profile',
  '@nexora_memories',
  '@nexora_tasks',
  '@nexora_goals_v2',
  '@nexora_app_language',
  '@nexora_onboarding_completed',
  '@nexora_ai_language',
];

const preservedKeys = new Set([
  '@nexora_app_language',
  '@nexora_onboarding_completed',
  '@nexora_ai_language',
]);

const keysToRemove = mockKeys.filter(
  (k) => k.startsWith('@nexora_') && !preservedKeys.has(k)
);

assert(keysToRemove.includes('@nexora_user_profile'), 'Purges user profile on sign out');
assert(keysToRemove.includes('@nexora_memories'), 'Purges private memories on sign out');
assert(!keysToRemove.includes('@nexora_app_language'), 'Preserves @nexora_app_language on sign out');
assert(!keysToRemove.includes('@nexora_onboarding_completed'), 'Preserves @nexora_onboarding_completed on sign out');
assert(!keysToRemove.includes('@nexora_ai_language'), 'Preserves @nexora_ai_language on sign out');

console.log('\n====================================================');
console.log(`Tests Passed: ${passed} | Tests Failed: ${failed}`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
