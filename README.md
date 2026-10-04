# NEXORA AI — Mobile Companion Foundation

> **Sovereign Personal AI Companion**  
> Built strictly under a **₹0 personal investment budget constraint**.

---

## 1. Project Overview

NEXORA AI is a mobile-first personal AI companion and task agent inspired by conversational intelligence capabilities and powered by validated sovereign architecture. 

This foundation establishes the core cross-platform mobile client built with **React Native**, **Expo (SDK 57)**, **TypeScript (Strict Mode)**, and **React Navigation**.

### Current Stage: Phase 0 — Foundation & Architecture
* **Visual Status:** Visual implementation of the NEXORA Robot avatar and interactive dashboard is strictly on hold pending user-provided reference images.
* **Component Status:** Modular design tokens, typography, glassmorphic layout primitives, navigation, and environment configuration have been created and type-verified.

---

## 2. Directory Structure

```text
NEXORA-AI/
├── .env.example              # Environment variables template (No real secrets)
├── .gitignore                # Git exclusions (node_modules, .env, build artifacts)
├── app.json                  # Expo application manifest
├── App.tsx                   # Main application entry point (SafeAreaProvider + Navigation)
├── index.ts                  # Expo root component registration
├── package.json              # Dependencies and lifecycle scripts
├── tsconfig.json             # TypeScript configuration (strict, path aliases @/*)
├── assets/                   # App icons and splash assets (Expo defaults)
└── src/
    ├── components/           # Reusable UI component library
    │   ├── common/
    │   │   ├── AppButton.tsx # Accessible tactile button (primary, secondary, ghost)
    │   │   ├── GlassCard.tsx # Translucent glassmorphic container with borders
    │   │   └── StatusBadge.tsx # Real-time telemetry/status badge
    │   └── index.ts
    ├── config/               # App constants and environment loader
    │   ├── constants.ts      # App metadata, avatar states, security tiers
    │   └── env.ts            # Safe typed public environment variable loader
    ├── navigation/           # Navigation routing and screen containers
    │   ├── RootNavigator.tsx # Native stack navigator with custom dark theme
    │   └── index.ts
    ├── screens/              # Application screen components
    │   ├── GatewayScreen.tsx # Phase 0 verification and diagnostics screen
    │   └── index.ts
    ├── theme/                # Centralized design tokens
    │   ├── colors.ts         # Dark obsidian, electric cyan, and glassmorphic tokens
    │   ├── spacing.ts        # 4pt/8pt grid scale and border radii
    │   ├── typography.ts     # Mobile-first scale and font weights
    │   └── index.ts
    └── types/                # TypeScript type definitions
        ├── navigation.ts     # Type-safe routing definitions
        └── index.ts
```

---

## 3. Technology Stack & Free-Tier Disclosures

| Technology / Service | Role in Architecture | Cost / Limit Disclosure |
| :--- | :--- | :--- |
| **React Native & Expo** | Mobile Client Framework | 100% Free Open Source |
| **TypeScript (Strict)** | Static Type Safety | 100% Free Open Source |
| **React Navigation** | Native Stack Routing | 100% Free Open Source |
| **Google Gemini 2.0 Flash** | Primary Reasoning & Vision | Free Tier: 15 RPM / 1M TPM via Google AI Studio |
| **Groq Cloud API** | Fallback LLM & Audio Whisper | Free Tier: Rate-limited daily token ceilings |
| **Supabase (PostgreSQL)** | Cloud Auth & Memory Vault | Free Tier: 50,000 MAU, 500MB DB (auto-pauses after 7 days inactivity) |

---

## 4. Getting Started & Development Preview

### Prerequisites
* **Node.js**: v20+ recommended (verified running on v24.19.0)
* **npm**: v10+ (verified running on v11.17.0)
* **Expo Go App**: Install from Google Play Store or Apple App Store on your physical device.

### Installation
Dependencies are already installed. To re-install if needed:
```bash
npm install
```

### Type Checking & Validation
Run TypeScript compilation verification:
```bash
npm run type-check
```

### Launch Development Server
To start the Expo development server:
```bash
npx expo start
```
* Press `a` for Android Emulator or scan the QR code with **Expo Go** on Android.
* Scan the QR code using the Camera app on iOS (requires Expo Go).
* Press `w` to open in a web browser preview.

---

## 5. Security & Data Governance

NEXORA AI categorizes all state and memory into four explicit security tiers:
* **Low**: UI theme, volume preferences, casual banter (Local storage / standard DB row).
* **Medium**: General conversation logs, task lists (Encrypted at rest).
* **High**: Personal contact details, locations, journal entries (Requires biometric re-authentication to edit/delete).
* **Critical**: API keys, OAuth tokens, credentials (Hardware Keystore / Secure Enclave; **NEVER** sent in raw LLM prompts).
