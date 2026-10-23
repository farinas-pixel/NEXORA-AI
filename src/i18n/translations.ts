/**
 * NEXORA AI — Localization & Multilingual Engine
 * Offline-first translations for English (en-US), Tamil (ta-IN), and Hindi (hi-IN)
 * Zero external dependencies; 100% type-safe.
 */

export type AppLanguage = 'en-US' | 'ta-IN' | 'hi-IN';

export interface LanguageInfo {
  code: AppLanguage;
  name: string;
  nativeName: string;
  badge?: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en-US', name: 'English', nativeName: 'English', badge: 'Default' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்', badge: 'தமிழ்' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', badge: 'हिन्दी' },
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
    chat_new_convo: 'New Conversation',
    chat_history_title: 'Chat History',
    chat_today: 'Today',
    chat_yesterday: 'Yesterday',
    chat_earlier: 'Earlier',
    chat_attach_title: 'Attach File',
    chat_attach_images: 'Images',
    chat_attach_audio: 'Audio',
    chat_attach_documents: 'Documents',
    chat_attach_pdf: 'PDF',
    chat_attach_browse: 'Browse Files',
    chat_attach_drive: 'Google Drive',
    chat_drive_auth_required: 'Google Drive setup required. Please connect your Google Cloud OAuth Client.',
    voice_dialog_title: 'Live Voice Session',
    voice_tap_to_listen: 'Tap microphone to speak',
    voice_tap_to_stop: 'Tap to stop',

    // Offline & System Feedback
    offline_banner: 'You are currently offline. Local cache and records are available.',
    network_restored: 'Network connection restored. Syncing latest data...',

    // Friends Space & Chat
    friends_title: 'Friends Space',
    friends_search_placeholder: 'Search by name or email...',
    friends_tab_chats: 'Chats',
    friends_tab_friends: 'Friends',
    friends_tab_requests: 'Requests',
    friends_tab_groups: 'Groups',
    friends_empty_friends: 'No friends yet — search by name or email to connect.',
    friends_empty_requests: 'No pending friend requests.',
    friends_empty_search: 'No users found matching your search.',
    friends_empty_chats: 'No active conversations. Start a chat with a connected friend.',
    friends_send_request: 'Add Friend',
    friends_request_sent: 'Request Sent',
    friends_accept: 'Accept',
    friends_decline: 'Decline',
    friends_pending_badge: 'Pending',
    friends_msg_edit: 'Edit Message',
    friends_msg_delete_me: 'Delete for me',
    friends_msg_delete_all: 'Delete for everyone',
    friends_clear_chat: 'Clear Chat',
    friends_delete_chat: 'Delete Chat',
    friends_create_group: 'Create Group',
    friends_group_name: 'Group Name',
    friends_add_members: 'Add Members',
    friends_leave_group: 'Leave Group',
    friends_edited_badge: 'Edited',
    friends_input_placeholder: 'Type a message...',

    // Daily News
    news_title: 'News Intelligence',
    news_schedule_title: 'Scheduled Daily Briefing',
    news_custom_time: 'Delivery Time',
    news_listen_aloud: 'Listen to Briefing',
    news_play: 'Play',
    news_pause: 'Pause',
    news_stop: 'Stop',
    news_language_title: 'News Language',
    news_saving_schedule: 'Saving Schedule...',
    news_schedule_updated: 'Daily news briefing schedule updated.',

    // Memory Vault
    memory_title: 'Memory Vault',
    memory_add_title: 'Add Memory Fact',
    memory_content_placeholder: 'e.g. Prefers low-sodium breakfast options',
    memory_search_placeholder: 'Search remembered facts...',
    memory_save_btn: 'Save Memory to Vault',
    memory_empty: 'No matching memories found in your sovereign vault.',
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
    setup_dual_voice_ready: 'இரட்டை குரல் சுழற்சி: தயார்',
    setup_sovereign_memory_active: 'சுயாதீன நினைவகம்: செயலில் உள்ளது',
    setup_robot_sync: 'ரோபோ நிலை ஒத்திசைவு: 100%',
    setup_continue_home: 'முகப்புக்குத் தொடரவும்',

    // Home Screen Status & Greetings
    status_offline: 'இணைப்பற்ற தயார்நிலை',
    status_solo: 'தனிப்பட்ட ஏர்கேப்',
    status_living: 'NEX நேரலை',
    status_connected: 'இணைக்கப்பட்டது',

    greeting_morning: 'காலை வணக்கம்',
    greeting_focus: 'கவனக் குவியம்',
    greeting_evening: 'மாலை வணக்கம்',
    greeting_reflection: 'மாலை சிந்தனை',
    greeting_rest: 'சுயாதீன ஓய்வு',
    greeting_partner: 'தோழர்',
    greeting_brain_active: 'அறிவாற்றல் செயலில் உள்ளது • சுயவிவரத்தைக் காண தட்டவும்',

    tap_voice_dialog: '🎙️ குரல் உரையாடலைத் தொடங்க தட்டவும்',

    // Missed Reminder Banner
    missed_reminder_title: 'தவறிய நினைவூட்டல் எச்சரிக்கை',
    missed_reminder_scheduled_for: '"{title}" {time} மணிக்கு திட்டமிடப்பட்டிருந்தது',

    // Environment Pill
    env_context_label: '🌐 சூழல்: {context} • {desc}',

    // Intelligence Suites
    section_core_suites: 'முக்கிய நுண்ணறிவுப் பிரிவுகள்',
    suite_my_day_title: 'எனது நாள்',
    suite_my_day_sub: '5 கட்டங்கள் & கவன டைமர்',
    suite_my_life_title: 'எனது வாழ்க்கை',
    suite_my_life_sub: 'இலக்குகள் & முடிவுகள் வரைபடம்',
    suite_exam_title: 'தேர்வுத் தோழன்',
    suite_exam_sub: 'நேரக் கணிப்பு & தேர்வுப் பயிற்சி',
    suite_news_title: 'செய்தி நுண்ணறிவு',
    suite_news_sub: 'முக்கியத்துவம் வடிகட்டிய ஊட்டம்',
    suite_friends_title: 'நண்பர்கள் வெளி',
    suite_friends_sub: 'குழு உதவியாளர் & கூட்டுப்பணி',
    suite_home_title: 'வீட்டு IoT',
    suite_home_sub: 'உள்ளூர் பாவனை & IF-THEN',

    // Instant Prompts
    section_instant_actions: 'உடனடி அறிவுசார் செயல்கள்',

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
    chat_new_convo: 'புதிய உரையாடல்',
    chat_history_title: 'உரையாடல் வரலாறு',
    chat_today: 'இன்று',
    chat_yesterday: 'நேற்று',
    chat_earlier: 'முந்தையவை',
    chat_attach_title: 'கோப்பை இணைக்கவும்',
    chat_attach_images: 'படங்கள்',
    chat_attach_audio: 'ஆடியோ',
    chat_attach_documents: 'ஆவணங்கள்',
    chat_attach_pdf: 'PDF ஆவணம்',
    chat_attach_browse: 'கோப்புகளை உலாவுக',
    chat_attach_drive: 'கூகிள் டிரைவ்',
    chat_drive_auth_required: 'கூகிள் டிரைவ் அமைப்பு தேவை. தயவுசெய்து உங்கள் OAuth Client-ஐ இணைக்கவும்.',
    voice_dialog_title: 'நேரலை குரல் அமர்வு',
    voice_tap_to_listen: 'பேச மைக்ரோஃபோனைத் தட்டவும்',
    voice_tap_to_stop: 'நிறுத்த தட்டவும்',

    // Offline & System Feedback
    offline_banner: 'நீங்கள் தற்போது இணைப்பற்ற நிலையில் உள்ளீர்கள். உள்ளூர் பதிவுகள் கிடைக்கின்றன.',
    network_restored: 'இணைய இணைப்பு மீட்டமைக்கப்பட்டது. தரவு ஒத்திசைக்கப்படுகிறது...',

    // Friends Space & Chat
    friends_title: 'நண்பர்கள் வெளி',
    friends_search_placeholder: 'பெயர் அல்லது மின்னஞ்சல் மூலம் தேடவும்...',
    friends_tab_chats: 'அரட்டைகள்',
    friends_tab_friends: 'நண்பர்கள்',
    friends_tab_requests: 'கோரிக்கைகள்',
    friends_tab_groups: 'குழுக்கள்',
    friends_empty_friends: 'இன்னும் நண்பர்கள் இல்லை — இணைக்க பெயர் அல்லது மின்னஞ்சலைத் தேடுங்கள்.',
    friends_empty_requests: 'நிலுவையில் உள்ள நட்புக் கோரிக்கைகள் எதுவும் இல்லை.',
    friends_empty_search: 'உங்கள் தேடலுடன் பொருந்தும் பயனர்கள் எவரும் கிடைக்கவில்லை.',
    friends_empty_chats: 'செயலில் உள்ள உரையாடல்கள் எதுவும் இல்லை. இணைந்த நண்பருடன் அரட்டையைத் தொடங்குங்கள்.',
    friends_send_request: 'நண்பரைச் சேர்க்க',
    friends_request_sent: 'கோரிக்கை அனுப்பப்பட்டது',
    friends_accept: 'ஏற்றுக்கொள்',
    friends_decline: 'நிராகரி',
    friends_pending_badge: 'நிலுவையில்',
    friends_msg_edit: 'செய்தியைத் திருத்து',
    friends_msg_delete_me: 'எனக்காக மட்டும் நீக்கு',
    friends_msg_delete_all: 'அனைவருக்கும் நீக்கு',
    friends_clear_chat: 'அரட்டையை அழி',
    friends_delete_chat: 'அரட்டையை நீக்கு',
    friends_create_group: 'குழுவை உருவாக்கு',
    friends_group_name: 'குழுவின் பெயர்',
    friends_add_members: 'உறுப்பினர்களைச் சேர்க்க',
    friends_leave_group: 'குழுவிலிருந்து வெளியேறு',
    friends_edited_badge: 'திருத்தப்பட்டது',
    friends_input_placeholder: 'செய்தியை உள்ளிடவும்...',

    // Daily News
    news_title: 'செய்தி நுண்ணறிவு',
    news_schedule_title: 'திட்டமிடப்பட்ட தினசரி செய்தித் தொகுப்பு',
    news_custom_time: 'வழங்கும் நேரம்',
    news_listen_aloud: 'செய்தியைக் கேட்க',
    news_play: 'இயக்குக',
    news_pause: 'இடைநிறுத்து',
    news_stop: 'நிறுத்து',
    news_language_title: 'செய்தி மொழி',
    news_saving_schedule: 'திட்டம் சேமிக்கப்படுகிறது...',
    news_schedule_updated: 'தினசரி செய்தி அட்டவணை புதுப்பிக்கப்பட்டது.',

    // Memory Vault
    memory_title: 'நினைவகப் பெட்டகம்',
    memory_add_title: 'நினைவு உண்மையைச் சேர்க்க',
    memory_content_placeholder: 'எ.கா. குறைந்த சோடியம் கொண்ட காலை உணவை விரும்புகிறார்',
    memory_search_placeholder: 'நினைவு உண்மைகளைத் தேடவும்...',
    memory_save_btn: 'பெட்டகத்தில் சேமிக்க',
    memory_empty: 'உங்கள் நினைவகப் பெட்டகத்தில் தகவல்கள் எதுவும் இல்லை.',
  },

  'hi-IN': {
    // Navigation Dock
    nav_home: 'होम',
    nav_my_day: 'मेरा दिन',
    nav_chat: 'चैट',
    nav_friends: 'मित्र',
    nav_my_life: 'मेरा जीवन',

    // Common Actions
    action_save: 'सहेजें',
    action_cancel: 'रद्द करें',
    action_continue: 'जारी रखें',
    action_back: '← वापस',
    action_confirm: 'पुष्टि करें',
    action_get_started: 'शुरू करें',
    action_skip_to_home: 'सीधे होम पर जाएं →',
    action_reschedule_30m: 'समय बदलें (+30 मिनट)',
    action_view_my_day: 'मेरा दिन देखें',
    action_log_out: 'लॉग आउट',
    action_log_out_account: 'खाते से लॉग आउट करें',
    action_retry: 'पुनः प्रयास करें',
    action_close: 'बंद करें',
    action_done: 'पूर्ण',
    action_delete: 'हटाएं',
    action_edit: 'संपादित करें',

    // Splash Screen
    splash_title: 'NEX',
    splash_subtitle: 'आपका बुद्धिमान साथी',
    splash_caption: 'एलेक्सा से विकसित',

    // Welcome Screen
    welcome_title: 'NEXORA AI में\nआपका स्वागत है',
    welcome_subtitle: 'बेहतर जीवन के लिए आपका एआई साथी',

    // Language Screen
    language_header_title: 'भाषा चुनें',
    language_header_sub: 'अपनी पसंदीदा भाषा का चयन करें',
    language_avatar_prompt: '"मैं अपनी आवाज़ और भाषा शैली को आपकी मातृभाषा के अनुसार ढाल सकता हूँ।"',
    language_confirm_btn: 'भाषा की पुष्टि करें',
    language_current: 'सक्रिय भाषा',

    // Setup Complete Screen
    setup_complete_title: 'सब कुछ तैयार है!',
    setup_complete_subtitle: 'आपका बुद्धिमान साथी पूरी तरह से विन्यस्त और तैयार है।',
    setup_system_readiness: 'सिस्टम तत्परता',
    setup_dual_voice_ready: 'ड्यूल वॉयस लूप: तैयार',
    setup_sovereign_memory_active: 'संप्रभु मेमोरी: सक्रिय',
    setup_robot_sync: 'रोबोट स्थिति सिंक: 100%',
    setup_continue_home: 'होम पर जारी रखें',

    // Home Screen Status & Greetings
    status_offline: 'ऑफ़लाइन स्टैंडबाय',
    status_solo: 'सोलो एयरगैप',
    status_living: 'NEX लाइव',
    status_connected: 'कनेक्टेड',

    greeting_morning: 'शुभ प्रभात',
    greeting_focus: 'फोकस स्प्रिंट्स',
    greeting_evening: 'शुभ संध्या',
    greeting_reflection: 'शाम का चिंतन',
    greeting_rest: 'संप्रभु विश्राम',
    greeting_partner: 'साथी',
    greeting_brain_active: 'कॉग्निटिव ब्रेन सक्रिय • प्रोफ़ाइल और खाता देखने के लिए टैप करें',

    tap_voice_dialog: '🎙️ वॉयस संवाद शुरू करने के लिए टैप करें',

    // Missed Reminder Banner
    missed_reminder_title: 'छूटा हुआ रिमाइंडर अलर्ट',
    missed_reminder_scheduled_for: '"{title}" का समय {time} निर्धारित था',

    // Environment Pill
    env_context_label: '🌐 संदर्भ: {context} • {desc}',

    // Intelligence Suites
    section_core_suites: 'प्रमुख इंटेलिजेंस सुइट्स',
    suite_my_day_title: 'मेरा दिन',
    suite_my_day_sub: '5 चरण और फोकस टाइमर',
    suite_my_life_title: 'मेरा जीवन',
    suite_my_life_sub: 'लक्ष्य और निर्णय मैट्रिक्स',
    suite_exam_title: 'परीक्षा साथी',
    suite_exam_sub: 'उलटी गिनती और अनुकूली प्रश्नोत्तरी',
    suite_news_title: 'समाचार इंटेलिजेंस',
    suite_news_sub: 'महत्वपूर्ण चयनित समाचार',
    suite_friends_title: 'मित्र स्पेस',
    suite_friends_sub: 'समूह सहायक और सहयोग',
    suite_home_title: 'स्मार्ट होम IoT',
    suite_home_sub: 'स्थानीय सिमुलेशन और IF-THEN',

    // Instant Prompts
    section_instant_actions: 'त्वरित बुद्धिमत्ता क्रियाएं',

    // Profile & Account Screen
    profile_header: 'खाता प्रोफ़ाइल',
    profile_default_user: 'संप्रभु उपयोगकर्ता',
    profile_no_email: 'कोई ईमेल पंजीकृत नहीं',
    profile_badge_vault: 'संप्रभु वॉल्ट',
    profile_badge_airgap: 'लोकल एयरगैप तैयार',
    profile_section_identity: 'उपयोगकर्ता पहचान और सुरक्षा',
    profile_label_fullname: 'पूरा नाम',
    profile_label_email: 'ईमेल पता',
    profile_label_user_id: 'सुपाबेस यूजर आईडी',
    profile_label_unauthenticated: 'अनधिकृत',
    profile_label_member_since: 'सदस्यता तिथि',
    profile_label_active_session: 'सक्रिय सत्र',
    profile_label_app_language: 'ऐप इंटरफ़ेस भाषा',
    profile_label_ai_language: 'एआई वॉयस और चैट भाषा',
    profile_label_timezone: 'समय क्षेत्र',
    profile_privacy_title: '🔒 संप्रभु डेटा पृथक्करण',
    profile_privacy_body: 'आपकी यादें, लक्ष्य, कार्य और बातचीत विशेष रूप से आपकी प्रमाणित सुपाबेस आईडी से संबंधित हैं। जब आप लॉग आउट करते हैं, तो स्थानीय कैश सुरक्षित रूप से साफ़ कर दिया जाता है। पुनः लॉग इन करने पर केवल आपका डेटा सुरक्षित रूप से पुनर्स्थापित होगा।',
    profile_logout_dialog_title: 'NEXORA से लॉग आउट करें',
    profile_logout_dialog_desc: 'क्या आप वास्तव में लॉग आउट करना चाहते हैं? आपका रिमोट डेटाबेस इतिहास और मेमोरी वॉल्ट आपके निजी खाते में सुरक्षित रहेगा।',
    profile_replay_onboarding_title: 'ऑनबोर्डिंग और परिचय गाइड',
    profile_replay_onboarding_btn: 'गाइड फिर से देखें',
    profile_switch_language: 'भाषा बदलें',

    // Voice & Audio Screen
    voice_header_title: 'ध्वनि और ऑडियो',
    voice_header_sub: 'ध्वनिक संश्लेषण प्रोफ़ाइल',
    voice_section_model: 'न्यूरल वॉयस इंजन',
    voice_section_speed: 'प्लेबैक गति',
    voice_section_pitch: 'आवाज़ की पिच',
    voice_section_auto_speak: 'उत्तर स्वतः बोलें',
    voice_auto_speak_desc: 'एआई उत्तरों को स्वचालित रूप से ज़ोर से बोलें',
    voice_test_btn: 'आवाज़ का परीक्षण करें',
    voice_test_stop: 'परीक्षण रोकें',
    voice_save_btn: 'सेटिंग्स सहेजें',
    voice_saved_toast: 'ध्वनि पैरामीटर सफलतापूर्वक सहेजे गए।',
    voice_test_sample: 'नमस्ते! मैं NEX हूँ। यह आपकी व्यक्तिगत साथी के लिए विन्यस्त आवाज़ है।',

    // Sign In & Auth Screens
    auth_signin_title: 'पुनः स्वागत है',
    auth_signin_sub: 'अपने साथी वॉल्ट को सिंक करने के लिए साइन इन करें',
    auth_email_label: 'ईमेल पता',
    auth_email_placeholder: 'अपना ईमेल दर्ज करें',
    auth_password_label: 'पासवर्ड',
    auth_password_placeholder: 'अपना पासवर्ड दर्ज करें',
    auth_forgot_password: 'पासवर्ड भूल गए?',
    auth_signin_btn: 'साइन इन करें',
    auth_signing_in: 'साइन इन हो रहा है...',
    auth_resend_confirm: 'पुष्टि ईमेल पुनः भेजें',
    auth_resending_confirm: 'भेजा जा रहा है...',
    auth_no_account: 'खाता नहीं है? ',
    auth_create_account_link: 'नया खाता बनाएं',
    auth_err_email_invalid: 'कृपया एक वैध ईमेल पता दर्ज करें।',
    auth_err_password_required: 'कृपया अपना पासवर्ड दर्ज करें।',
    auth_err_email_unconfirmed: 'आपका ईमेल अभी सत्यापित नहीं हुआ है। लॉग इन करने के लिए कृपया ईमेल की पुष्टि करें।',
    auth_err_invalid_credentials: 'अमान्य ईमेल या पासवर्ड। कृपया पुनः प्रयास करें।',
    auth_verification_sent_title: 'सत्यापन ईमेल भेजा गया',
    auth_verification_sent_desc: 'अपने खाते की पुष्टि करने के लिए कृपया अपना ईमेल इनबॉक्स देखें।',

    // Create Account Screen
    auth_signup_title: 'खाता बनाएं',
    auth_signup_sub: 'अपनी संप्रभु बुद्धिमत्ता यात्रा शुरू करें',
    auth_fullname_label: 'पूरा नाम',
    auth_fullname_placeholder: 'अपना पूरा नाम दर्ज करें',
    auth_confirm_password_label: 'पासवर्ड की पुष्टि करें',
    auth_confirm_password_placeholder: 'पासवर्ड दोबारा दर्ज करें',
    auth_signup_btn: 'खाता बनाएं',
    auth_already_have_account: 'क्या पहले से खाता है? ',
    auth_signin_link: 'साइन इन करें',
    auth_err_name_required: 'कृपया अपना पूरा नाम दर्ज करें।',
    auth_err_password_length: 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।',
    auth_err_password_mismatch: 'पासवर्ड मेल नहीं खाते।',
    auth_signup_verify_email: 'लॉग इन करने से पहले कृपया अपने खाते की पुष्टि करने के लिए ईमेल देखें।',

    // Active Chat & Live Voice Screens
    chat_title: 'NEX बातचीत',
    chat_thinking: 'सोच रहा है...',
    chat_listening: 'सुन रहा है...',
    chat_speaking: 'बोल रहा है...',
    chat_input_placeholder: 'NEX से कुछ भी पूछें, या निर्देश दें...',
    chat_clear_confirm_title: 'बातचीत साफ़ करें',
    chat_clear_confirm_desc: 'क्या आप वर्तमान चैट संदेशों को साफ़ करना चाहते हैं?',
    chat_new_convo: 'नई बातचीत',
    chat_history_title: 'चैट इतिहास',
    chat_today: 'आज',
    chat_yesterday: 'कल',
    chat_earlier: 'पहले',
    chat_attach_title: 'फ़ाइल संलग्न करें',
    chat_attach_images: 'चित्र',
    chat_attach_audio: 'ऑडियो',
    chat_attach_documents: 'दस्तावेज़',
    chat_attach_pdf: 'PDF दस्तावेज़',
    chat_attach_browse: 'फ़ाइलें ब्राउज़ करें',
    chat_attach_drive: 'गूगल ड्राइव',
    chat_drive_auth_required: 'गूगल ड्राइव सेटअप आवश्यक है। कृपया अपना Google Cloud OAuth Client कनेक्ट करें।',
    voice_dialog_title: 'लाइव वॉयस सत्र',
    voice_tap_to_listen: 'बोलने के लिए माइक्रोफ़ोन टैप करें',
    voice_tap_to_stop: 'रोकने के लिए टैप करें',

    // Offline & System Feedback
    offline_banner: 'आप वर्तमान में ऑफ़लाइन हैं। स्थानीय रिकॉर्ड उपलब्ध हैं।',
    network_restored: 'इंटरनेट कनेक्शन बहाल हुआ। नवीनतम डेटा सिंक हो रहा है...',

    // Friends Space & Chat
    friends_title: 'मित्र स्पेस',
    friends_search_placeholder: 'नाम या ईमेल से खोजें...',
    friends_tab_chats: 'चैट',
    friends_tab_friends: 'मित्र',
    friends_tab_requests: 'अनुरोध',
    friends_tab_groups: 'समूह',
    friends_empty_friends: 'अभी कोई मित्र नहीं हैं — जुड़ने के लिए नाम या ईमेल से खोजें।',
    friends_empty_requests: 'कोई लंबित मित्र अनुरोध नहीं है।',
    friends_empty_search: 'आपकी खोज से मेल खाने वाला कोई उपयोगकर्ता नहीं मिला।',
    friends_empty_chats: 'कोई सक्रिय बातचीत नहीं है। किसी जुड़े मित्र के साथ चैट शुरू करें।',
    friends_send_request: 'मित्र जोड़ें',
    friends_request_sent: 'अनुरोध भेजा गया',
    friends_accept: 'स्वीकार करें',
    friends_decline: 'अस्वीकार करें',
    friends_pending_badge: 'लंबित',
    friends_msg_edit: 'संदेश संपादित करें',
    friends_msg_delete_me: 'मेरे लिए हटाएं',
    friends_msg_delete_all: 'सभी के लिए हटाएं',
    friends_clear_chat: 'चैट साफ़ करें',
    friends_delete_chat: 'चैट हटाएं',
    friends_create_group: 'समूह बनाएं',
    friends_group_name: 'समूह का नाम',
    friends_add_members: 'सदस्य जोड़ें',
    friends_leave_group: 'समूह छोड़ें',
    friends_edited_badge: 'संपादित',
    friends_input_placeholder: 'संदेश लिखें...',

    // Daily News
    news_title: 'समाचार इंटेलिजेंस',
    news_schedule_title: 'दैनिक समाचार ब्रीफिंग',
    news_custom_time: 'प्राप्ति का समय',
    news_listen_aloud: 'ब्रीफिंग सुनें',
    news_play: 'चलाएं',
    news_pause: 'रोकें',
    news_stop: 'बंद करें',
    news_language_title: 'समाचार की भाषा',
    news_saving_schedule: 'शेड्यूल सहेजा जा रहा है...',
    news_schedule_updated: 'दैनिक समाचार शेड्यूल अपडेट किया गया।',

    // Memory Vault
    memory_title: 'मेमोरी वॉल्ट',
    memory_add_title: 'मेमोरी तथ्य जोड़ें',
    memory_content_placeholder: 'उदा. नाश्ते में कम नमक वाला भोजन पसंद करते हैं',
    memory_search_placeholder: 'याद किए गए तथ्य खोजें...',
    memory_save_btn: 'वॉल्ट में सहेजें',
    memory_empty: 'आपकी मेमोरी वॉल्ट में कोई मेल खाता तथ्य नहीं मिला।',
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

/**
 * Formats date into localized locale string based on selected app language
 */
export function formatLocalizedDate(date: Date | string, language: AppLanguage = 'en-US'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const localeMap: Record<AppLanguage, string> = {
    'en-US': 'en-US',
    'ta-IN': 'ta-IN',
    'hi-IN': 'hi-IN',
  };

  try {
    return d.toLocaleDateString(localeMap[language] || 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return d.toLocaleDateString();
  }
}
