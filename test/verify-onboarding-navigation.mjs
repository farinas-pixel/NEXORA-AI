// test/verify-onboarding-navigation.mjs
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

console.log('\n====================================================');
console.log('   NEXORA AI — ONBOARDING & AUTH NAVIGATION AUDIT   ');
console.log('====================================================\n');

let passed = 0;
let failed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  ✓ ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

const rootDir = process.cwd();

// 1. LanguageScreen.tsx inspection
const languageScreenPath = path.join(rootDir, 'src', 'screens', 'LanguageScreen.tsx');
const languageScreenContent = fs.readFileSync(languageScreenPath, 'utf8');

test('LanguageScreen does not prematurely call completeOnboarding during language selection', () => {
  // Ensure completeOnboarding is not called inside handleConfirm
  const handleConfirmMatch = languageScreenContent.match(/const handleConfirm = async \(\) => {([\s\S]*?)};/);
  assert.ok(handleConfirmMatch, 'handleConfirm function exists');
  const handleConfirmBody = handleConfirmMatch[1];
  assert.ok(!handleConfirmBody.includes('completeOnboarding()'), 'handleConfirm must not call completeOnboarding()');
});

test('LanguageScreen routes unauthenticated users forward to SignInScreen', () => {
  const handleConfirmMatch = languageScreenContent.match(/const handleConfirm = async \(\) => {([\s\S]*?)};/);
  assert.ok(handleConfirmMatch, 'handleConfirm function exists');
  const handleConfirmBody = handleConfirmMatch[1];
  assert.ok(handleConfirmBody.includes("navigation.replace('SignIn')"), 'Must route unauthenticated users to SignIn');
});

test('LanguageScreen only invokes goBack when user is already authenticated', () => {
  const handleConfirmMatch = languageScreenContent.match(/const handleConfirm = async \(\) => {([\s\S]*?)};/);
  const handleConfirmBody = handleConfirmMatch[1];
  assert.ok(handleConfirmBody.includes('isAuthenticated && navigation.canGoBack()'), 'Must check isAuthenticated before goBack()');
});

// 2. SignInScreen.tsx inspection
const signInScreenPath = path.join(rootDir, 'src', 'screens', 'SignInScreen.tsx');
const signInScreenContent = fs.readFileSync(signInScreenPath, 'utf8');

test('SignInScreen contains Email and Password input fields', () => {
  assert.ok(signInScreenContent.includes("label={t('auth_email_label')}"), 'Contains Email input label');
  assert.ok(signInScreenContent.includes("label={t('auth_password_label')}"), 'Contains Password input label');
  assert.ok(signInScreenContent.includes('secureTextEntry'), 'Password input has secureTextEntry enabled');
});

test('SignInScreen contains Sign In action button and invokes signIn', () => {
  assert.ok(signInScreenContent.includes("onPress={handleSignIn}"), 'Button triggers handleSignIn');
  assert.ok(signInScreenContent.includes("signIn(email.trim(), password)"), 'handleSignIn calls signIn');
  assert.ok(!signInScreenContent.includes("navigation.replace('Home')"), 'handleSignIn avoids redundant navigation.replace; Home transition is handled declaratively by RootNavigator');
  assert.ok(signInScreenContent.includes("completeOnboarding()"), 'handleSignIn completes onboarding upon auth');
});

test('SignInScreen contains Forgot Password link and routes to ForgotPassword', () => {
  assert.ok(signInScreenContent.includes("navigation.navigate('ForgotPassword')"), 'Routes to ForgotPassword');
});

test('SignInScreen contains Create Account link and routes to CreateAccount', () => {
  assert.ok(signInScreenContent.includes("navigation.navigate('CreateAccount')"), 'Routes to CreateAccount');
});

test('SignInScreen handles unconfirmed email with resend confirmation action', () => {
  assert.ok(signInScreenContent.includes('resendConfirmationEmail'), 'Imports resendConfirmationEmail');
  assert.ok(signInScreenContent.includes('isEmailNotConfirmed'), 'Maintains isEmailNotConfirmed state');
  assert.ok(signInScreenContent.includes('handleResendConfirmation'), 'Exposes resend confirmation handler');
});

// 3. CreateAccountScreen.tsx inspection
const createAccountScreenPath = path.join(rootDir, 'src', 'screens', 'CreateAccountScreen.tsx');
const createAccountScreenContent = fs.readFileSync(createAccountScreenPath, 'utf8');

test('CreateAccountScreen contains Name, Email, Password, Confirm Password fields', () => {
  assert.ok(createAccountScreenContent.includes("label={t('auth_fullname_label')}"), 'Contains Full Name input');
  assert.ok(createAccountScreenContent.includes("label={t('auth_email_label')}"), 'Contains Email input');
  assert.ok(createAccountScreenContent.includes("label={t('auth_password_label')}"), 'Contains Password input');
  assert.ok(createAccountScreenContent.includes("label={t('auth_confirm_password_label')}"), 'Contains Confirm Password input');
});

test('CreateAccountScreen routes to SetupComplete on direct sign up', () => {
  assert.ok(createAccountScreenContent.includes("navigation.replace('SetupComplete')"), 'Routes to SetupComplete');
});

test('CreateAccountScreen contains link returning to SignIn', () => {
  assert.ok(createAccountScreenContent.includes("navigation.navigate('SignIn')"), 'Routes back to SignIn');
});

// 4. WelcomeScreen.tsx and SplashScreen.tsx inspection
const welcomeScreenPath = path.join(rootDir, 'src', 'screens', 'WelcomeScreen.tsx');
const welcomeScreenContent = fs.readFileSync(welcomeScreenPath, 'utf8');

test('WelcomeScreen Get Started button opens Language screen', () => {
  assert.ok(welcomeScreenContent.includes("navigation.navigate('Language')"), 'Get Started opens Language');
});

test('WelcomeScreen Skip button completes onboarding and opens Home', () => {
  assert.ok(welcomeScreenContent.includes('completeOnboarding()'), 'Skip calls completeOnboarding()');
  assert.ok(welcomeScreenContent.includes("navigation.replace('Home')"), 'Skip opens Home');
});

const splashScreenPath = path.join(rootDir, 'src', 'screens', 'SplashScreen.tsx');
const splashScreenContent = fs.readFileSync(splashScreenPath, 'utf8');

test('SplashScreen checks session / onboarding before routing to Home vs Welcome', () => {
  assert.ok(splashScreenContent.includes("navigation.replace('Home')"), 'Routes to Home when authenticated');
  assert.ok(splashScreenContent.includes("navigation.replace('Welcome')"), 'Routes to Welcome when unauthenticated');
});

// 5. RootNavigator stack configuration
const rootNavigatorPath = path.join(rootDir, 'src', 'navigation', 'RootNavigator.tsx');
const rootNavigatorContent = fs.readFileSync(rootNavigatorPath, 'utf8');

test('RootNavigator registers the complete onboarding and authentication screens', () => {
  const expectedScreens = [
    'Splash',
    'Welcome',
    'Language',
    'SignIn',
    'ForgotPassword',
    'ResetPassword',
    'CreateAccount',
    'SetupComplete',
    'Home',
  ];
  for (const screen of expectedScreens) {
    assert.ok(
      rootNavigatorContent.includes(`<Stack.Screen name="${screen}"`),
      `RootNavigator registers screen "${screen}"`
    );
  }
});

console.log('\n====================================================');
console.log(`Tests Passed: ${passed} | Tests Failed: ${failed}`);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
}
