/**
 * NEXORA AI — Localization & Multilingual Engine
 * Offline-first translations for English (en-US) and Tamil (ta-IN)
 * Zero external dependencies; 100% type-safe.
 */

export type AppLanguage = 'en-US' | 'ta-IN';

export interface LanguageInfo {
  code: AppLanguage;
  name: string;
  nativeName: string;
  badge?: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en-US', name: 'English (US)', nativeName: 'English', badge: 'Default' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்', badge: 'Indic Native' },
];

export const TRANSLATIONS = {
  'en-US': {
    // Navigation Dock
    nav_home: 'Home',
    nav_my_day: 'My Day',
    nav_chat: 'Chat',
    nav_friends: 'Friends',
    nav_my_life: 'My Life',

    // Common Actions
    action_save: 'Save',
    action_cancel: 'Cancel',
    action_continue: 'Continue',
    action_back: '← Back',
    action_confirm: 'Confirm',
    action_get_started: 'Get Started',
    action_skip_to_home: 'Skip directly to Home →',
    action_reschedule_30m: 'Reschedule (+30m)',
    action_view_my_day: 'View My Day',
    action_log_out: 'Log Out',
    action_log_out_account: 'Log Out of Account',
    action_retry: 'Retry',
    action_close: 'Close',
    action_done: 'Done',
    action_delete: 'Delete',
    action_edit: 'Edit',

    // Splash Screen
    splash_title: 'NEX',
    splash_subtitle: 'Your Intelligent Companion',
    splash_caption: 'Evolved from Alexa',

    // Welcome Screen
    welcome_title: 'Welcome to\nNEXORA AI',
    welcome_subtitle: 'Your AI companion for a smarter life',

    // Language Screen
    language_header_title: 'Select Language',
    language_header_sub: 'Choose your preferred dialect',
    language_avatar_prompt: '"I can adapt my speech and text cadence to your native tongue."',
    language_confirm_btn: 'Confirm Language',
    language_current: 'Active Language',

    // Setup Complete Screen
    setup_complete_title: "You're All Set!",
    setup_complete_subtitle: 'Your intelligent companion is configured, calibrated, and ready.',
    setup_system_readiness: 'System Readiness',
    setup_dual_voice_ready: 'Dual Voice Loop: Ready',
    setup_sovereign_memory_active: 'Sovereign Memory: Active',
    setup_robot_sync: 'Robot State Sync: 100%',
    setup_continue_home: 'Continue to Home',

    // Home Screen Status & Greetings
    status_offline: 'Offline Standby',
    status_solo: 'Solo Airgap',
    status_living: 'NEX Living',
    status_connected: 'Connected',

    greeting_morning: 'Good Morning',
    greeting_focus: 'Focus Sprints',
    greeting_evening: 'Good Evening',
    greeting_reflection: 'Evening Reflection',
    greeting_rest: 'Sovereign Rest',
    greeting_partner: 'Partner',
    greeting_brain_active: 'Cognitive Brain active • Tap to view profile & account',

    tap_voice_dialog: '🎙️ Tap to start voice dialog',

    // Missed Reminder Banner
    missed_reminder_title: 'Missed Reminder Alert',
    missed_reminder_scheduled_for: '"{title}" was scheduled for {time}',

    // Environment Pill
    env_context_label: '🌐 Context: {context} • {desc}',

    // Intelligence Suites
    section_core_suites: 'Core Intelligence Suites',
    suite_my_day_title: 'My Day',
    suite_my_day_sub: '5 Phases & Focus Timer',
    suite_my_life_title: 'My Life',
    suite_my_life_sub: 'Goals & Decisions Matrix',
    suite_exam_title: 'Exam Companion',
    suite_exam_sub: 'Countdown & Adaptive Quiz',
    suite_news_title: 'News Intelligence',
    suite_news_sub: 'Importance Filtered Feed',
    suite_friends_title: 'Friends Space',
    suite_friends_sub: 'Group Assistant & Collab',
    suite_home_title: 'Home IoT',
    suite_home_sub: 'Local Simulation & IF-THEN',

    // Instant Prompts
    section_instant_actions: 'Instant Brain Actions',

    // Profile & Account Screen
    profile_header: 'Account Profile',
    profile_default_user: 'Sovereign User',
    profile_no_email: 'No email registered',
    profile_badge_vault: 'Sovereign Vault',
    profile_badge_airgap: 'Local Airgap Ready',
    profile_section_identity: 'User Identity & Security',
    profile_label_fullname: 'Full Name',
    profile_label_email: 'Email Address',
    profile_label_user_id: 'Supabase User ID',
    profile_label_unauthenticated: 'Unauthenticated',
    profile_label_member_since: 'Member Since',
    profile_label_active_session: 'Active Session',
    profile_label_app_language: 'App UI Language',
    profile_label_ai_language: 'AI Voice & Chat Language',
    profile_label_timezone: 'Timezone',
    profile_privacy_title: '🔒 Sovereign Data Isolation',
    profile_privacy_body: 'Your memories, goals, tasks, and conversations belong exclusively to your authenticated Supabase ID. When you log out, cached sessions are purged locally. Logging back in will securely restore only your sovereign data.',
    profile_logout_dialog_title: 'Log Out of NEXORA',
    profile_logout_dialog_desc: 'Are you sure you want to log out? Your remote database history and memory vault will remain safely preserved in your private account.',
    profile_replay_onboarding_title: 'Onboarding & Intro Walkthrough',
    profile_replay_onboarding_btn: 'Replay Onboarding Guide',
    profile_switch_language: 'Switch Language',

    // Voice & Audio Screen
    voice_header_title: 'Voice & Audio',
    voice_header_sub: 'Acoustic Synthesis Profile',
    voice_section_model: 'Neural Voice Engine',
    voice_section_speed: 'Playback Speed',
    voice_section_pitch: 'Speech Pitch',
    voice_section_auto_speak: 'Auto-Speak Responses',
    voice_auto_speak_desc: 'Automatically speak incoming AI responses aloud',
    voice_test_btn: 'Test Voice Synthesizer',
    voice_test_stop: 'Stop Voice Test',
    voice_save_btn: 'Save Voice Settings',
    voice_saved_toast: 'Voice parameters successfully saved.',
    voice_test_sample: 'Hello! I am NEX. This is my voice configured for your personal companion.',

    // Sign In & Auth Screens
    auth_signin_title: 'Welcome Back',
    auth_signin_sub: 'Sign in to sync your sovereign companion vault',
    auth_email_label: 'Email Address',
    auth_email_placeholder: 'Enter your email',
    auth_password_label: 'Password',
    auth_password_placeholder: 'Enter your password',
    auth_forgot_password: 'Forgot Password?',
    auth_signin_btn: 'Sign In',
    auth_signing_in: 'Signing in...',
    auth_resend_confirm: 'Resend Confirmation Email',
    auth_resending_confirm: 'Resending...',
    auth_no_account: "Don't have an account? ",
    auth_create_account_link: 'Create Account',
    auth_err_email_invalid: 'Please enter a valid email address.',
    auth_err_password_required: 'Please enter your password.',
    auth_err_email_unconfirmed: 'Your email address has not been confirmed yet. Please verify your email to log in.',
    auth_err_invalid_credentials: 'Incorrect email or password. Please try again.',
    auth_verification_sent_title: 'Verification Email Sent',
    auth_verification_sent_desc: 'Please check your email inbox to verify your account.',

    // Create Account Screen
    auth_signup_title: 'Create Account',
    auth_signup_sub: 'Begin your sovereign intelligence experience',
    auth_fullname_label: 'Full Name',
    auth_fullname_placeholder: 'Enter your full name',
    auth_confirm_password_label: 'Confirm Password',
    auth_confirm_password_placeholder: 'Re-enter your password',
    auth_signup_btn: 'Create Account',
    auth_already_have_account: 'Already have an account? ',
    auth_signin_link: 'Sign In',
    auth_err_name_required: 'Please enter your full name.',
    auth_err_password_length: 'Password must be at least 6 characters long.',
    auth_err_password_mismatch: 'Passwords do not match.',
    auth_signup_verify_email: 'Please check your email to confirm your account before logging in.',

    // Active Chat & Live Voice Screens
    chat_title: 'NEX Conversation',
    chat_thinking: 'Thinking...',
    chat_listening: 'Listening...',
    chat_speaking: 'Speaking...',
    chat_input_placeholder: 'Ask NEX anything, or command actions...',
    chat_clear_confirm_title: 'Clear Conversation',
    chat_clear_confirm_desc: 'Are you sure you want to clear current chat messages?',
    voice_dialog_title: 'Live Voice Session',
    voice_tap_to_listen: 'Tap microphone to speak',
    voice_tap_to_stop: 'Tap to stop',

    // Offline & System Feedback
    offline_banner: 'You are currently offline. Local cache and records are available.',
    network_restored: 'Network connection restored. Syncing latest data...',
  },

  'ta-IN': {
    // Navigation Dock
    nav_home: 'முகப்பு',
    nav_my_day: 'எனது நாள்',
    nav_chat: 'அரட்டை',
    nav_friends: 'நண்பர்கள்',
    nav_my_life: 'எனது வாழ்க்கை',

    // Common Actions
    action_save: 'சேமிக்க',
    action_cancel: 'ரத்து செய்',
    action_continue: 'தொடரவும்',
    action_back: '← பின்செல்ல',
    action_confirm: 'உறுதிப்படுத்துக',
    action_get_started: 'தொடங்குக',
    action_skip_to_home: 'நேரடியாக முகப்புக்குச் செல்லவும் →',
    action_reschedule_30m: 'நேரம் மாற்றுக (+30நி)',
    action_view_my_day: 'எனது நாளைக் காண்க',
    action_log_out: 'வெளியேறு',
    action_log_out_account: 'கணக்கிலிருந்து வெளியேறு',
    action_retry: 'மீண்டும் முயற்சிக்க',
    action_close: 'மூடுக',
    action_done: 'முடிந்தது',
    action_delete: 'நீக்குக',
    action_edit: 'திருத்துக',

    // Splash Screen
    splash_title: 'NEX',
    splash_subtitle: 'உங்கள் நுண்ணறிவுத் துணை',
    splash_caption: 'அலெக்ஸாவிலிருந்து உருவானது',

    // Welcome Screen
    welcome_title: 'NEXORA AI-க்கு\nவரவேற்கிறோம்',
    welcome_subtitle: 'சிறந்த வாழ்க்கைக்கான உங்கள் AI துணை',

    // Language Screen
    language_header_title: 'மொழியைத் தேர்ந்தெடுக்கவும்',
    language_header_sub: 'உங்கள் விருப்ப மொழியைத் தேர்ந்தெடுக்கவும்',
    language_avatar_prompt: '"உங்கள் தாய்மொழிக்கேற்ப எனது பேச்சு மற்றும் எழுத்து நடையை நான் மாற்றிக்கொள்ள முடியும்."',
    language_confirm_btn: 'மொழியை உறுதிப்படுத்துக',
    language_current: 'தற்போதைய மொழி',

    // Setup Complete Screen
    setup_complete_title: 'அனைத்தும் தயார்!',
    setup_complete_subtitle: 'உங்கள் நுண்ணறிவுத் துணை முழுமையாக ஒருங்கிணைக்கப்பட்டு தயாராக உள்ளது.',
    setup_system_readiness: 'கணினி தயார்நிலை',
    setup_dual_voice_ready: 'இருவழி குரல் வளையம்: தயார்',
    setup_sovereign_memory_active: 'சுயாதீன நினைவகம்: செயலில் உள்ளது',
    setup_robot_sync: 'ரோபோ நிலை ஒத்திசைவு: 100%',
    setup_continue_home: 'முகப்புக்குச் செல்லவும்',

    // Home Screen Status & Greetings
    status_offline: 'இணைப்பற்ற காத்திருப்பு',
    status_solo: 'தனிப்பட்ட பாதுகாப்பு',
    status_living: 'NEX இயக்கம்',
    status_connected: 'இணைக்கப்பட்டது',

    greeting_morning: 'காலை வணக்கம்',
    greeting_focus: 'கவனக் குவியம்',
    greeting_evening: 'மாலை வணக்கம்',
    greeting_reflection: 'மாலை சிந்தனை',
    greeting_rest: 'இரவு ஓய்வு',
    greeting_partner: 'தோழரே',
    greeting_brain_active: 'அறிவாற்றல் மூளை செயலில் உள்ளது • சுயவிவரத்தைக் காண தட்டவும்',

    tap_voice_dialog: '🎙️ குரல் உரையாடலைத் தொடங்க தட்டவும்',

    // Missed Reminder Banner
    missed_reminder_title: 'தவறிய நினைவூட்டல் எச்சரிக்கை',
    missed_reminder_scheduled_for: '"{title}" என்பது {time}-க்கு திட்டமிடப்பட்டிருந்தது',

    // Environment Pill
    env_context_label: '🌐 சூழல்: {context} • {desc}',

    // Intelligence Suites
    section_core_suites: 'முதன்மை நுண்ணறிவு தொகுதிகள்',
    suite_my_day_title: 'எனது நாள்',
    suite_my_day_sub: '5 நிலைகள் & கவன டைமர்',
    suite_my_life_title: 'எனது வாழ்க்கை',
    suite_my_life_sub: 'இலக்குகள் & முடிவுகள் வரைபடம்',
    suite_exam_title: 'தேர்வுத் துணை',
    suite_exam_sub: 'நேரக்கணிப்பு & தகவமைப்பு வினாடி வினா',
    suite_news_title: 'செய்தி நுண்ணறிவு',
    suite_news_sub: 'முக்கியத்துவம் வடிகட்டிய செய்தி ஓடை',
    suite_friends_title: 'நண்பர்கள் வெளி',
    suite_friends_sub: 'குழு உதவியாளர் & கூட்டுப்பணி',
    suite_home_title: 'வீட்டு IoT',
    suite_home_sub: 'உள்ளூர் பாவனை & IF-THEN விதிகள்',

    // Instant Prompts
    section_instant_actions: 'உடனடி மூளை செயல்கள்',

    // Profile & Account Screen
    profile_header: 'கணக்கு சுயவிவரம்',
    profile_default_user: 'சுயாதீன பயனர்',
    profile_no_email: 'மின்னஞ்சல் பதிவு செய்யப்படவில்லை',
    profile_badge_vault: 'சுயாதீன பெட்டகம்',
    profile_badge_airgap: 'உள்ளூர் பாதுகாப்பு தயார்',
    profile_section_identity: 'பயனர் அடையாளம் & பாதுகாப்பு',
    profile_label_fullname: 'முழுப் பெயர்',
    profile_label_email: 'மின்னஞ்சல் முகவரி',
    profile_label_user_id: 'சுபபேஸ் பயனர் ஐடி',
    profile_label_unauthenticated: 'அங்கீகரிக்கப்படவில்லை',
    profile_label_member_since: 'உறுப்பினர் காலம்',
    profile_label_active_session: 'செயலில் உள்ள அமர்வு',
    profile_label_app_language: 'செயலி இடைமுக மொழி',
    profile_label_ai_language: 'AI குரல் & அரட்டை மொழி',
    profile_label_timezone: 'நேர மண்டலம்',
    profile_privacy_title: '🔒 சுயாதீன தரவு தனிமைப்படுத்தல்',
    profile_privacy_body: 'உங்கள் நினைவுகள், இலக்குகள், பணிகள் மற்றும் உரையாடல்கள் உங்கள் அங்கீகரிக்கப்பட்ட சுபபேஸ் ஐடிக்கு மட்டுமே சொந்தமானது. நீங்கள் வெளியேறும்போது தற்காலிக சேமிப்பு நீக்கப்படும். மீண்டும் உள்நுழையும்போது உங்கள் தரவு பாதுகாப்பாக மீட்டமைக்கப்படும்.',
    profile_logout_dialog_title: 'NEXORA-விலிருந்து வெளியேறு',
    profile_logout_dialog_desc: 'நிச்சயமாக வெளியேற விரும்புகிறீர்களா? உங்கள் தொலைநிலை தரவுத்தள வரலாறும் நினைவுகளும் உங்கள் கணக்கில் பாதுகாப்பாக இருக்கும்.',
    profile_replay_onboarding_title: 'அறிமுக வழிகாட்டி',
    profile_replay_onboarding_btn: 'வழிகாட்டியை மீண்டும் பார்க்க',
    profile_switch_language: 'மொழியை மாற்றுக',

    // Voice & Audio Screen
    voice_header_title: 'குரல் & ஆடியோ',
    voice_header_sub: 'ஒலியியல் தொகுப்பு சுயவிவரம்',
    voice_section_model: 'நியூரல் குரல் பொறி',
    voice_section_speed: 'பின்னணி வேகம்',
    voice_section_pitch: 'குரல் சுருதி',
    voice_section_auto_speak: 'பதில்களைத் தானாகப் பேசுதல்',
    voice_auto_speak_desc: 'AI பதில்களைத் தானாகவே உரக்கப் பேசுதல்',
    voice_test_btn: 'குரல் தொகுப்பைச் சோதிக்கவும்',
    voice_test_stop: 'குரல் சோதனையை நிறுத்தவும்',
    voice_save_btn: 'குரல் அமைப்புகளைச் சேமிக்கவும்',
    voice_saved_toast: 'குரல் அமைப்புகள் வெற்றிகரமாகச் சேமிக்கப்பட்டன.',
    voice_test_sample: 'வணக்கம்! நான் NEX. இது உங்கள் தனிப்பட்ட நுண்ணறிவுத் துணைக்கான குரல் வடிவம்.',

    // Sign In & Auth Screens
    auth_signin_title: 'மீண்டும் வருக',
    auth_signin_sub: 'உங்கள் சுயாதீன துணைப் பெட்டகத்தை ஒத்திசைக்க உள்நுழையவும்',
    auth_email_label: 'மின்னஞ்சல் முகவரி',
    auth_email_placeholder: 'உங்கள் மின்னஞ்சலை உள்ளிடவும்',
    auth_password_label: 'கடவுச்சொல்',
    auth_password_placeholder: 'உங்கள் கடவுச்சொல்லை உள்ளிடவும்',
    auth_forgot_password: 'கடவுச்சொல் மறந்துவிட்டதா?',
    auth_signin_btn: 'உள்நுழைக',
    auth_signing_in: 'உள்நுழைகிறது...',
    auth_resend_confirm: 'உறுதிப்படுத்தல் மின்னஞ்சலை மீண்டும் அனுப்புக',
    auth_resending_confirm: 'அனுப்பப்படுகிறது...',
    auth_no_account: 'கணக்கு இல்லையா? ',
    auth_create_account_link: 'கணக்கை உருவாக்கவும்',
    auth_err_email_invalid: 'சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.',
    auth_err_password_required: 'உங்கள் கடவுச்சொல்லை உள்ளிடவும்.',
    auth_err_email_unconfirmed: 'உங்கள் மின்னஞ்சல் இன்னும் உறுதிப்படுத்தப்படவில்லை. உள்நுழைய மின்னஞ்சலைச் சரிபார்க்கவும்.',
    auth_err_invalid_credentials: 'தவறான மின்னஞ்சல் அல்லது கடவுச்சொல். மீண்டும் முயற்சிக்கவும்.',
    auth_verification_sent_title: 'சரிபார்ப்பு மின்னஞ்சல் அனுப்பப்பட்டது',
    auth_verification_sent_desc: 'உங்கள் கணக்கைச் சரிபார்க்க உங்கள் மின்னஞ்சல் இன்பாக்ஸைச் சரிபார்க்கவும்.',

    // Create Account Screen
    auth_signup_title: 'கணக்கை உருவாக்கவும்',
    auth_signup_sub: 'உங்கள் சுயாதீன நுண்ணறிவுப் பயணத்தைத் தொடங்குங்கள்',
    auth_fullname_label: 'முழுப் பெயர்',
    auth_fullname_placeholder: 'உங்கள் முழுப் பெயரை உள்ளிடவும்',
    auth_confirm_password_label: 'கடவுச்சொல்லை உறுதிப்படுத்துக',
    auth_confirm_password_placeholder: 'கடவுச்சொல்லை மீண்டும் உள்ளிடவும்',
    auth_signup_btn: 'கணக்கை உருவாக்குக',
    auth_already_have_account: 'ஏற்கனவே கணக்கு உள்ளதா? ',
    auth_signin_link: 'உள்நுழைக',
    auth_err_name_required: 'உங்கள் முழுப் பெயரை உள்ளிடவும்.',
    auth_err_password_length: 'கடவுச்சொல் குறைந்தது 6 எழுத்துகள் கொண்டிருக்க வேண்டும்.',
    auth_err_password_mismatch: 'கடவுச்சொற்கள் பொருந்தவில்லை.',
    auth_signup_verify_email: 'உள்நுழைவதற்கு முன் உங்கள் கணக்கை உறுதிப்படுத்த மின்னஞ்சலைச் சரிபார்க்கவும்.',

    // Active Chat & Live Voice Screens
    chat_title: 'NEX உரையாடல்',
    chat_thinking: 'யோசிக்கிறது...',
    chat_listening: 'கேட்கிறது...',
    chat_speaking: 'பேசுகிறது...',
    chat_input_placeholder: 'NEX-யிடம் எதையும் கேட்கலாம், அல்லது கட்டளையிடலாம்...',
    chat_clear_confirm_title: 'உரையாடலை அழிக்கவா',
    chat_clear_confirm_desc: 'தற்போதைய அரட்டைச் செய்திகளை அழிக்க நிச்சயமாக விரும்புகிறீர்களா?',
    voice_dialog_title: 'நேரலை குரல் அமர்வு',
    voice_tap_to_listen: 'பேச மைக்ரோஃபோனைத் தட்டவும்',
    voice_tap_to_stop: 'நிறுத்த தட்டவும்',

    // Offline & System Feedback
    offline_banner: 'நீங்கள் தற்போது இணைப்பற்ற நிலையில் உள்ளீர்கள். உள்ளூர் பதிவுகள் கிடைக்கின்றன.',
    network_restored: 'இணைய இணைப்பு மீட்டமைக்கப்பட்டது. தரவு ஒத்திசைக்கப்படுகிறது...',
  },
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS['en-US'];

/**
 * Type-safe string translation function with parameterized replacement
 */
export function translate(
  key: TranslationKey,
  language: AppLanguage = 'en-US',
  params?: Record<string, string | number>
): string {
  const dictionary = TRANSLATIONS[language] || TRANSLATIONS['en-US'];
  let text: string = dictionary[key] || TRANSLATIONS['en-US'][key] || String(key);

  if (params) {
    Object.keys(params).forEach((paramKey) => {
      const val = String(params[paramKey]);
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), val);
    });
  }

  return text;
}
