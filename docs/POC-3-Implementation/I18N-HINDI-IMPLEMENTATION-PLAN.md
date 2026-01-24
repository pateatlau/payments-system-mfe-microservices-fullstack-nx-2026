# Internationalization (i18n) Implementation Plan - Hindi Language Support (POC-3)

**Created:** January 24, 2026
**Last Updated:** January 24, 2026
**Status:** PLANNING
**Priority:** Medium

## Implementation Summary

| Component | Status |
|-----------|--------|
| i18n Library Setup (react-i18next) | ⏳ Pending |
| Shared i18n Library Creation | ⏳ Pending |
| Translation File Structure | ⏳ Pending |
| Shell App i18n Provider | ⏳ Pending |
| Language Detection & Switching | ⏳ Pending |
| Date/Time/Number Formatting | ⏳ Pending |
| Auth MFE Translations | ⏳ Pending |
| Payments MFE Translations | ⏳ Pending |
| Admin MFE Translations | ⏳ Pending |
| Profile MFE Translations | ⏳ Pending |
| Shared Components Translations | ⏳ Pending |
| Backend API Localization | ⏳ Pending |
| Translation Extraction Tooling | ⏳ Pending |
| E2E Testing for Locales | ⏳ Pending |
| CI/CD Translation Validation | ⏳ Pending |

**Supported Languages:** English (en) [default], Hindi (hi)

> **Note on Locale Tags:** i18next uses language-only tags (`en`, `hi`) for translation file organization and `supportedLngs` configuration. The regional variants (`en-IN`, `hi-IN`) are used exclusively with Intl APIs (NumberFormat, DateTimeFormat) for India-specific formatting of dates, numbers, and currency.

---

## Revision History

| Date       | Changes                                                                    |
| ---------- | -------------------------------------------------------------------------- |
| 2026-01-24 | Initial plan created based on codebase analysis                            |

---

## Executive Summary

This document outlines the implementation plan for adding Hindi language support to the MFE Payments System. Hindi is the second most spoken language in India after English, and supporting it will significantly improve accessibility for a large portion of the target user base.

**Current State:**
- ✅ Application uses `en-IN` locale for date/number formatting
- ✅ INR currency formatting with `Intl.NumberFormat('en-IN', ...)`
- ✅ Date formatting with `Intl.DateTimeFormat('en-IN', ...)`
- ✅ India-centric defaults (phone, address, timezone)
- ✅ HTML `lang="en"` attribute set
- ❌ No i18n library installed
- ❌ No translation files
- ❌ No language switching UI
- ❌ Hardcoded English strings throughout codebase
- ❌ Backend error messages in English only

**Key Technical Decisions:**
- **Library:** react-i18next (industry standard, well-maintained, Module Federation compatible)
- **Translation Format:** JSON namespace files per MFE
- **Loading Strategy:** Lazy loading with Module Federation consideration
- **Hindi Script:** Devanagari (standard Hindi script)
- **Text Direction:** LTR (Hindi is left-to-right like English)
- **Fallback:** English (en-IN) when Hindi translation missing

**Hindi Language Considerations:**
- Hindi uses Devanagari script (Unicode block U+0900–U+097F)
- Hindi is LTR (left-to-right), same as English
- Hindi text often requires ~20-30% more space than English
- Hindi has complex pluralization rules (different from English)
- Hindi numerals: Option to use ०१२३४५६७८९ (Devanagari) or 0123456789 (Western Arabic)

---

## Architecture Overview

### i18n Layer Structure

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                         I18N ARCHITECTURE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                     SHARED I18N LIBRARY                                  ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ ││
│  │  │  i18next    │  │  Language   │  │   Format    │  │  Translation    │ ││
│  │  │  Instance   │  │   Context   │  │   Utils     │  │   Loader        │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘ ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ ││
│  │  │   useT()    │  │  useLocale  │  │  useDateFmt │  │  useCurrencyFmt │ ││
│  │  │   Hook      │  │    Hook     │  │    Hook     │  │      Hook       │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                     TRANSLATION FILES                                    ││
│  │                                                                          ││
│  │  libs/shared-i18n/                                                       ││
│  │  └── src/                                                                ││
│  │      ├── translations/                                                   ││
│  │      │   ├── en/                      # English (en-IN)                 ││
│  │      │   │   ├── common.json          # Shared strings (buttons, nav)   ││
│  │      │   │   ├── auth.json            # Auth MFE strings                ││
│  │      │   │   ├── payments.json        # Payments MFE strings            ││
│  │      │   │   ├── admin.json           # Admin MFE strings               ││
│  │      │   │   ├── profile.json         # Profile MFE strings             ││
│  │      │   │   └── validation.json      # Form validation messages        ││
│  │      │   └── hi/                      # Hindi (hi-IN)                   ││
│  │      │       ├── common.json                                             ││
│  │      │       ├── auth.json                                               ││
│  │      │       ├── payments.json                                           ││
│  │      │       ├── admin.json                                              ││
│  │      │       ├── profile.json                                            ││
│  │      │       └── validation.json                                         ││
│  │      └── index.ts                     # i18n configuration & exports    ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        APPLICATION LAYER                                 ││
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ││
│  │  │   Shell   │ │ Auth MFE  │ │ Payments  │ │  Admin    │ │  Profile  │ ││
│  │  │  (Host)   │ │           │ │   MFE     │ │   MFE     │ │   MFE     │ ││
│  │  │           │ │           │ │           │ │           │ │           │ ││
│  │  │ I18nProv. │ │  useT()   │ │  useT()   │ │  useT()   │ │  useT()   │ ││
│  │  │ LangSwit. │ │           │ │           │ │           │ │           │ ││
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘ ││
│  │       │             │             │             │             │         ││
│  │       └─────────────┴─────────────┴─────────────┴─────────────┘         ││
│  │                              │                                           ││
│  │                    Shared i18n Instance (Singleton)                      ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        BACKEND API LAYER                                 ││
│  │                                                                          ││
│  │  Accept-Language Header → Localized Error Messages                       ││
│  │  User Preference (DB)   → Persistent Language Setting                    ││
│  │                                                                          ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ ││
│  │  │ API Gateway │  │ Auth Svc    │  │ Payments    │  │ Profile Svc     │ ││
│  │  │ i18n MW     │  │ Messages    │  │ Svc Msgs    │  │ Messages        │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

### Module Federation Considerations

In a Module Federation architecture, i18n requires special attention:

1. **Singleton i18next Instance:** The i18next instance MUST be shared as a singleton across all MFEs to ensure consistent language state.

2. **Shared Dependencies Configuration:**
```javascript
// In all rspack.config.js files
const sharedDependencies = {
  // ... existing shared deps
  'i18next': { singleton: true, requiredVersion: '^23.0.0', eager: false },
  'react-i18next': { singleton: true, requiredVersion: '^14.0.0', eager: false },
  'shared-i18n': { singleton: true, eager: true }, // Eager for singleton initialization
};
```

3. **Translation Loading Strategy:**
   - **Eager:** Common namespace loaded with shell (critical UI strings)
   - **Lazy:** MFE-specific namespaces loaded when MFE mounts
   - **Caching:** Translations cached in localStorage for offline/performance

4. **Namespace Isolation:** Each MFE uses its own namespace(s) to avoid conflicts

---

## Phase 1: Foundation & Infrastructure

### Priority 1.1: Create Shared i18n Library

**Effort:** 4 hours
**Impact:** Foundation for all i18n functionality

**Tasks:**

- [ ] Generate new shared library: `pnpm nx g @nx/react:library shared-i18n --directory=libs --unitTestRunner=jest`
- [ ] Install i18n dependencies
- [ ] Configure i18next with react-i18next
- [ ] Set up translation file structure
- [ ] Create i18n initialization function
- [ ] Export hooks and utilities
- [ ] Add to Module Federation shared dependencies

**Dependencies to Install:**

```bash
# Core i18n libraries
pnpm add i18next react-i18next i18next-browser-languagedetector i18next-http-backend

# Development tools
pnpm add -D i18next-parser @types/i18next
```

**i18n Configuration:**

```typescript
// libs/shared-i18n/src/lib/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
// Note: i18next-http-backend is NOT used here because we bundle translations
// directly for Module Federation reliability. Use HttpBackend only if you need
// to load translations dynamically from a server.

// Import translations (bundled for reliability in Module Federation)
import enCommon from '../translations/en/common.json';
import enAuth from '../translations/en/auth.json';
import enPayments from '../translations/en/payments.json';
import enAdmin from '../translations/en/admin.json';
import enProfile from '../translations/en/profile.json';
import enValidation from '../translations/en/validation.json';

import hiCommon from '../translations/hi/common.json';
import hiAuth from '../translations/hi/auth.json';
import hiPayments from '../translations/hi/payments.json';
import hiAdmin from '../translations/hi/admin.json';
import hiProfile from '../translations/hi/profile.json';
import hiValidation from '../translations/hi/validation.json';

// Bundled resources for Module Federation reliability
const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    payments: enPayments,
    admin: enAdmin,
    profile: enProfile,
    validation: enValidation,
  },
  hi: {
    common: hiCommon,
    auth: hiAuth,
    payments: hiPayments,
    admin: hiAdmin,
    profile: hiProfile,
    validation: hiValidation,
  },
};

// Supported locales
export const SUPPORTED_LOCALES = ['en', 'hi'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

// Locale metadata
export const LOCALE_METADATA: Record<SupportedLocale, {
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
  dateLocale: string;
  numberLocale: string;
}> = {
  en: {
    name: 'English',
    nativeName: 'English',
    dir: 'ltr',
    dateLocale: 'en-IN',
    numberLocale: 'en-IN',
  },
  hi: {
    name: 'Hindi',
    nativeName: 'हिन्दी',
    dir: 'ltr',
    dateLocale: 'hi-IN',
    numberLocale: 'hi-IN',
  },
};

// Initialize i18next
export async function initI18n(): Promise<typeof i18n> {
  await i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'en',
      supportedLngs: SUPPORTED_LOCALES,

      // Default namespace
      defaultNS: 'common',
      ns: ['common', 'auth', 'payments', 'admin', 'profile', 'validation'],

      // Language detection
      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        caches: ['localStorage'],
        lookupLocalStorage: 'i18nextLng',
      },

      // Interpolation
      interpolation: {
        escapeValue: false, // React already escapes
        format: (value, format, lng) => {
          if (format === 'currency' && typeof value === 'number') {
            return new Intl.NumberFormat(LOCALE_METADATA[lng as SupportedLocale]?.numberLocale || 'en-IN', {
              style: 'currency',
              currency: 'INR',
            }).format(value);
          }
          if (format === 'date' && value instanceof Date) {
            return new Intl.DateTimeFormat(LOCALE_METADATA[lng as SupportedLocale]?.dateLocale || 'en-IN').format(value);
          }
          return String(value);
        },
      },

      // React-specific
      react: {
        useSuspense: true,
        bindI18n: 'languageChanged',
        bindI18nStore: 'added removed',
      },

      // Debug mode in development
      debug: process.env.NODE_ENV === 'development',
    });

  return i18n;
}

export { i18n };
export default i18n;
```

**Hooks Export:**

```typescript
// libs/shared-i18n/src/lib/hooks.ts
import { useTranslation, Trans } from 'react-i18next';
import { useCallback, useMemo } from 'react';
import { i18n, LOCALE_METADATA, SupportedLocale, SUPPORTED_LOCALES } from './i18n';

/**
 * Main translation hook - wrapper around useTranslation
 * @param ns - Namespace(s) to use
 */
export function useT(ns?: string | string[]) {
  return useTranslation(ns);
}

/**
 * Hook for getting current locale information
 */
export function useLocale() {
  const { i18n } = useTranslation();

  const currentLocale = useMemo(() => {
    const lng = i18n.language as SupportedLocale;
    return SUPPORTED_LOCALES.includes(lng) ? lng : 'en';
  }, [i18n.language]);

  const localeMetadata = useMemo(() => {
    return LOCALE_METADATA[currentLocale];
  }, [currentLocale]);

  const changeLocale = useCallback(async (locale: SupportedLocale) => {
    await i18n.changeLanguage(locale);
    // Update HTML lang attribute
    document.documentElement.lang = locale;
    // Update HTML dir attribute for RTL support (future-proofing)
    document.documentElement.dir = LOCALE_METADATA[locale].dir;
    // Store preference
    localStorage.setItem('i18nextLng', locale);
  }, [i18n]);

  return {
    locale: currentLocale,
    ...localeMetadata,
    supportedLocales: SUPPORTED_LOCALES,
    changeLocale,
  };
}

/**
 * Hook for date formatting with current locale
 */
export function useDateFormatter(options?: Intl.DateTimeFormatOptions) {
  const { locale } = useLocale();
  const dateLocale = LOCALE_METADATA[locale].dateLocale;

  return useCallback((date: Date | number) => {
    const dateObj = typeof date === 'number' ? new Date(date) : date;
    return new Intl.DateTimeFormat(dateLocale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    }).format(dateObj);
  }, [dateLocale, options]);
}

/**
 * Hook for currency formatting with current locale
 */
export function useCurrencyFormatter(currency = 'INR') {
  const { locale } = useLocale();
  const numberLocale = LOCALE_METADATA[locale].numberLocale;

  return useCallback((amount: number) => {
    return new Intl.NumberFormat(numberLocale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }, [numberLocale, currency]);
}

/**
 * Hook for number formatting with current locale
 */
export function useNumberFormatter(options?: Intl.NumberFormatOptions) {
  const { locale } = useLocale();
  const numberLocale = LOCALE_METADATA[locale].numberLocale;

  return useCallback((value: number) => {
    return new Intl.NumberFormat(numberLocale, options).format(value);
  }, [numberLocale, options]);
}

// Re-export Trans component for JSX interpolation
export { Trans };
```

**Library Index Export:**

```typescript
// libs/shared-i18n/src/index.ts
export { initI18n, i18n, SUPPORTED_LOCALES, LOCALE_METADATA } from './lib/i18n';
export type { SupportedLocale } from './lib/i18n';

export {
  useT,
  useLocale,
  useDateFormatter,
  useCurrencyFormatter,
  useNumberFormatter,
  Trans,
} from './lib/hooks';

// Re-export react-i18next for advanced usage
export { useTranslation, I18nextProvider } from 'react-i18next';
```

**Success Criteria:**

- [ ] shared-i18n library created with proper exports
- [ ] i18next configured with language detection
- [ ] Hooks created for common i18n operations
- [ ] TypeScript types exported
- [ ] Unit tests for hooks

---

### Priority 1.2: Translation File Structure

**Effort:** 3 hours
**Impact:** Establishes translation organization

**Tasks:**

- [ ] Create English (en) translation files with all existing strings
- [ ] Create Hindi (hi) translation files with translations
- [ ] Define namespace conventions
- [ ] Set up translation key naming conventions
- [ ] Document translation guidelines

**Translation File Structure:**

```text
libs/shared-i18n/src/translations/
├── en/
│   ├── common.json      # Shared UI strings (buttons, navigation, errors)
│   ├── auth.json        # Auth MFE (signin, signup, mfa, etc.)
│   ├── payments.json    # Payments MFE (transactions, dashboard)
│   ├── admin.json       # Admin MFE (user management, settings)
│   ├── profile.json     # Profile MFE (preferences, security)
│   └── validation.json  # Form validation messages
└── hi/
    ├── common.json
    ├── auth.json
    ├── payments.json
    ├── admin.json
    ├── profile.json
    └── validation.json
```

**Common Namespace (English):**

```json
{
  "app": {
    "name": "MFE Payments System",
    "tagline": "Secure Payment Processing"
  },
  "navigation": {
    "home": "Home",
    "payments": "Payments",
    "profile": "Profile",
    "admin": "Admin",
    "signIn": "Sign In",
    "signUp": "Sign Up",
    "signOut": "Sign Out"
  },
  "buttons": {
    "submit": "Submit",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "back": "Back",
    "next": "Next",
    "loading": "Loading...",
    "retry": "Retry",
    "confirm": "Confirm",
    "close": "Close"
  },
  "status": {
    "pending": "Pending",
    "processing": "Processing",
    "completed": "Completed",
    "failed": "Failed",
    "cancelled": "Cancelled"
  },
  "errors": {
    "generic": "Something went wrong. Please try again.",
    "network": "Network error. Please check your connection.",
    "notFound": "Page not found",
    "unauthorized": "You are not authorized to access this page",
    "sessionExpired": "Your session has expired. Please sign in again."
  },
  "table": {
    "noData": "No data available",
    "loading": "Loading data...",
    "showingOf": "Showing {{from}}-{{to}} of {{total}}",
    "rowsPerPage": "Rows per page",
    "page": "Page {{current}} of {{total}}"
  },
  "form": {
    "required": "Required",
    "optional": "Optional"
  },
  "time": {
    "justNow": "Just now",
    "minutesAgo": "{{count}} minute ago",
    "minutesAgo_other": "{{count}} minutes ago",
    "hoursAgo": "{{count}} hour ago",
    "hoursAgo_other": "{{count}} hours ago",
    "daysAgo": "{{count}} day ago",
    "daysAgo_other": "{{count}} days ago"
  },
  "currency": {
    "inr": "Indian Rupee",
    "usd": "US Dollar",
    "eur": "Euro",
    "gbp": "British Pound"
  }
}
```

**Common Namespace (Hindi):**

```json
{
  "app": {
    "name": "MFE भुगतान प्रणाली",
    "tagline": "सुरक्षित भुगतान प्रसंस्करण"
  },
  "navigation": {
    "home": "होम",
    "payments": "भुगतान",
    "profile": "प्रोफ़ाइल",
    "admin": "एडमिन",
    "signIn": "साइन इन करें",
    "signUp": "साइन अप करें",
    "signOut": "साइन आउट करें"
  },
  "buttons": {
    "submit": "जमा करें",
    "cancel": "रद्द करें",
    "save": "सहेजें",
    "delete": "हटाएं",
    "edit": "संपादित करें",
    "back": "पीछे",
    "next": "अगला",
    "loading": "लोड हो रहा है...",
    "retry": "पुनः प्रयास करें",
    "confirm": "पुष्टि करें",
    "close": "बंद करें"
  },
  "status": {
    "pending": "लंबित",
    "processing": "प्रक्रियाधीन",
    "completed": "पूर्ण",
    "failed": "विफल",
    "cancelled": "रद्द"
  },
  "errors": {
    "generic": "कुछ गलत हो गया। कृपया पुनः प्रयास करें।",
    "network": "नेटवर्क त्रुटि। कृपया अपना कनेक्शन जांचें।",
    "notFound": "पृष्ठ नहीं मिला",
    "unauthorized": "आप इस पृष्ठ तक पहुंचने के लिए अधिकृत नहीं हैं",
    "sessionExpired": "आपका सत्र समाप्त हो गया है। कृपया पुनः साइन इन करें।"
  },
  "table": {
    "noData": "कोई डेटा उपलब्ध नहीं है",
    "loading": "डेटा लोड हो रहा है...",
    "showingOf": "{{total}} में से {{from}}-{{to}} दिखाया जा रहा है",
    "rowsPerPage": "प्रति पृष्ठ पंक्तियां",
    "page": "पृष्ठ {{current}} का {{total}}"
  },
  "form": {
    "required": "आवश्यक",
    "optional": "वैकल्पिक"
  },
  "time": {
    "justNow": "अभी",
    "minutesAgo": "{{count}} मिनट पहले",
    "minutesAgo_other": "{{count}} मिनट पहले",
    "hoursAgo": "{{count}} घंटा पहले",
    "hoursAgo_other": "{{count}} घंटे पहले",
    "daysAgo": "{{count}} दिन पहले",
    "daysAgo_other": "{{count}} दिन पहले"
  },
  "currency": {
    "inr": "भारतीय रुपया",
    "usd": "अमेरिकी डॉलर",
    "eur": "यूरो",
    "gbp": "ब्रिटिश पाउंड"
  }
}
```

**Auth Namespace (English):**

```json
{
  "signIn": {
    "title": "Sign In",
    "subtitle": "Welcome back! Please sign in to continue.",
    "email": "Email Address",
    "emailPlaceholder": "you@example.com",
    "password": "Password",
    "passwordPlaceholder": "Enter your password",
    "rememberMe": "Remember me",
    "forgotPassword": "Forgot password?",
    "submitButton": "Sign In",
    "noAccount": "Don't have an account?",
    "signUpLink": "Sign up",
    "socialDivider": "Or continue with",
    "errors": {
      "invalidCredentials": "Invalid email or password",
      "accountLocked": "Your account has been locked. Please contact support.",
      "emailNotVerified": "Please verify your email before signing in."
    }
  },
  "signUp": {
    "title": "Create Account",
    "subtitle": "Sign up to get started with secure payments.",
    "name": "Full Name",
    "namePlaceholder": "Enter your full name",
    "email": "Email Address",
    "emailPlaceholder": "you@example.com",
    "phone": "Phone Number",
    "phonePlaceholder": "+91 98765 43210",
    "password": "Password",
    "passwordPlaceholder": "Create a strong password",
    "confirmPassword": "Confirm Password",
    "confirmPasswordPlaceholder": "Re-enter your password",
    "termsAgree": "I agree to the",
    "termsLink": "Terms of Service",
    "privacyLink": "Privacy Policy",
    "submitButton": "Create Account",
    "hasAccount": "Already have an account?",
    "signInLink": "Sign in",
    "socialDivider": "Or continue with",
    "errors": {
      "emailExists": "An account with this email already exists",
      "passwordMismatch": "Passwords do not match",
      "weakPassword": "Password is too weak"
    }
  },
  "mfa": {
    "title": "Two-Factor Authentication",
    "subtitle": "Enter the 6-digit code from your authenticator app.",
    "code": "Verification Code",
    "codePlaceholder": "Enter 6-digit code",
    "submitButton": "Verify",
    "useBackupCode": "Use backup code",
    "backupCodeTitle": "Enter Backup Code",
    "backupCodePlaceholder": "Enter your backup code",
    "errors": {
      "invalidCode": "Invalid verification code",
      "codeExpired": "Code has expired. Please try again."
    }
  },
  "forgotPassword": {
    "title": "Reset Password",
    "subtitle": "Enter your email address and we'll send you a link to reset your password.",
    "email": "Email Address",
    "emailPlaceholder": "you@example.com",
    "submitButton": "Send Reset Link",
    "backToSignIn": "Back to sign in",
    "successTitle": "Check Your Email",
    "successMessage": "We've sent a password reset link to {{email}}"
  },
  "resetPassword": {
    "title": "Create New Password",
    "subtitle": "Enter your new password below.",
    "password": "New Password",
    "passwordPlaceholder": "Enter new password",
    "confirmPassword": "Confirm New Password",
    "confirmPasswordPlaceholder": "Re-enter new password",
    "submitButton": "Reset Password",
    "success": "Password reset successfully. You can now sign in."
  },
  "verifyEmail": {
    "title": "Verify Your Email",
    "verifying": "Verifying your email...",
    "success": "Email verified successfully!",
    "error": "Email verification failed",
    "signInPrompt": "You can now sign in to your account."
  },
  "social": {
    "continueWith": "Continue with {{provider}}",
    "google": "Google",
    "github": "GitHub",
    "facebook": "Facebook",
    "linkedin": "LinkedIn",
    "twitter": "X"
  }
}
```

**Auth Namespace (Hindi):**

```json
{
  "signIn": {
    "title": "साइन इन करें",
    "subtitle": "वापस स्वागत है! कृपया जारी रखने के लिए साइन इन करें।",
    "email": "ईमेल पता",
    "emailPlaceholder": "you@example.com",
    "password": "पासवर्ड",
    "passwordPlaceholder": "अपना पासवर्ड दर्ज करें",
    "rememberMe": "मुझे याद रखें",
    "forgotPassword": "पासवर्ड भूल गए?",
    "submitButton": "साइन इन करें",
    "noAccount": "खाता नहीं है?",
    "signUpLink": "साइन अप करें",
    "socialDivider": "या इसके साथ जारी रखें",
    "errors": {
      "invalidCredentials": "अमान्य ईमेल या पासवर्ड",
      "accountLocked": "आपका खाता लॉक कर दिया गया है। कृपया सहायता से संपर्क करें।",
      "emailNotVerified": "साइन इन करने से पहले कृपया अपना ईमेल सत्यापित करें।"
    }
  },
  "signUp": {
    "title": "खाता बनाएं",
    "subtitle": "सुरक्षित भुगतान शुरू करने के लिए साइन अप करें।",
    "name": "पूरा नाम",
    "namePlaceholder": "अपना पूरा नाम दर्ज करें",
    "email": "ईमेल पता",
    "emailPlaceholder": "you@example.com",
    "phone": "फ़ोन नंबर",
    "phonePlaceholder": "+91 98765 43210",
    "password": "पासवर्ड",
    "passwordPlaceholder": "एक मजबूत पासवर्ड बनाएं",
    "confirmPassword": "पासवर्ड की पुष्टि करें",
    "confirmPasswordPlaceholder": "अपना पासवर्ड पुनः दर्ज करें",
    "termsAgree": "मैं सहमत हूं",
    "termsLink": "सेवा की शर्तें",
    "privacyLink": "गोपनीयता नीति",
    "submitButton": "खाता बनाएं",
    "hasAccount": "पहले से खाता है?",
    "signInLink": "साइन इन करें",
    "socialDivider": "या इसके साथ जारी रखें",
    "errors": {
      "emailExists": "इस ईमेल के साथ पहले से एक खाता मौजूद है",
      "passwordMismatch": "पासवर्ड मेल नहीं खाते",
      "weakPassword": "पासवर्ड बहुत कमजोर है"
    }
  },
  "mfa": {
    "title": "द्वि-कारक प्रमाणीकरण",
    "subtitle": "अपने प्रमाणक ऐप से 6-अंकों का कोड दर्ज करें।",
    "code": "सत्यापन कोड",
    "codePlaceholder": "6-अंकों का कोड दर्ज करें",
    "submitButton": "सत्यापित करें",
    "useBackupCode": "बैकअप कोड का उपयोग करें",
    "backupCodeTitle": "बैकअप कोड दर्ज करें",
    "backupCodePlaceholder": "अपना बैकअप कोड दर्ज करें",
    "errors": {
      "invalidCode": "अमान्य सत्यापन कोड",
      "codeExpired": "कोड समाप्त हो गया है। कृपया पुनः प्रयास करें।"
    }
  },
  "forgotPassword": {
    "title": "पासवर्ड रीसेट करें",
    "subtitle": "अपना ईमेल पता दर्ज करें और हम आपको पासवर्ड रीसेट लिंक भेजेंगे।",
    "email": "ईमेल पता",
    "emailPlaceholder": "you@example.com",
    "submitButton": "रीसेट लिंक भेजें",
    "backToSignIn": "साइन इन पर वापस जाएं",
    "successTitle": "अपना ईमेल जांचें",
    "successMessage": "हमने {{email}} पर पासवर्ड रीसेट लिंक भेजा है"
  },
  "resetPassword": {
    "title": "नया पासवर्ड बनाएं",
    "subtitle": "नीचे अपना नया पासवर्ड दर्ज करें।",
    "password": "नया पासवर्ड",
    "passwordPlaceholder": "नया पासवर्ड दर्ज करें",
    "confirmPassword": "नए पासवर्ड की पुष्टि करें",
    "confirmPasswordPlaceholder": "नया पासवर्ड पुनः दर्ज करें",
    "submitButton": "पासवर्ड रीसेट करें",
    "success": "पासवर्ड सफलतापूर्वक रीसेट हो गया। अब आप साइन इन कर सकते हैं।"
  },
  "verifyEmail": {
    "title": "अपना ईमेल सत्यापित करें",
    "verifying": "आपका ईमेल सत्यापित हो रहा है...",
    "success": "ईमेल सफलतापूर्वक सत्यापित!",
    "error": "ईमेल सत्यापन विफल",
    "signInPrompt": "अब आप अपने खाते में साइन इन कर सकते हैं।"
  },
  "social": {
    "continueWith": "{{provider}} के साथ जारी रखें",
    "google": "Google",
    "github": "GitHub",
    "facebook": "Facebook",
    "linkedin": "LinkedIn",
    "twitter": "X"
  }
}
```

**Validation Namespace (English):**

```json
{
  "required": "This field is required",
  "email": {
    "invalid": "Please enter a valid email address",
    "required": "Email is required"
  },
  "password": {
    "required": "Password is required",
    "minLength": "Password must be at least {{min}} characters",
    "maxLength": "Password cannot exceed {{max}} characters",
    "uppercase": "Password must contain at least one uppercase letter",
    "lowercase": "Password must contain at least one lowercase letter",
    "number": "Password must contain at least one number",
    "special": "Password must contain at least one special character",
    "mismatch": "Passwords do not match"
  },
  "phone": {
    "invalid": "Please enter a valid phone number",
    "required": "Phone number is required",
    "format": "Phone number must be in format +91 XXXXX XXXXX"
  },
  "amount": {
    "required": "Amount is required",
    "positive": "Amount must be greater than zero",
    "min": "Amount must be at least {{min}}",
    "max": "Amount cannot exceed {{max}}"
  },
  "name": {
    "required": "Name is required",
    "minLength": "Name must be at least {{min}} characters",
    "maxLength": "Name cannot exceed {{max}} characters"
  },
  "upi": {
    "invalid": "Please enter a valid UPI ID",
    "format": "UPI ID must be in format username@bank"
  }
}
```

**Validation Namespace (Hindi):**

```json
{
  "required": "यह फ़ील्ड आवश्यक है",
  "email": {
    "invalid": "कृपया एक वैध ईमेल पता दर्ज करें",
    "required": "ईमेल आवश्यक है"
  },
  "password": {
    "required": "पासवर्ड आवश्यक है",
    "minLength": "पासवर्ड कम से कम {{min}} वर्णों का होना चाहिए",
    "maxLength": "पासवर्ड {{max}} वर्णों से अधिक नहीं हो सकता",
    "uppercase": "पासवर्ड में कम से कम एक बड़ा अक्षर होना चाहिए",
    "lowercase": "पासवर्ड में कम से कम एक छोटा अक्षर होना चाहिए",
    "number": "पासवर्ड में कम से कम एक नंबर होना चाहिए",
    "special": "पासवर्ड में कम से कम एक विशेष वर्ण होना चाहिए",
    "mismatch": "पासवर्ड मेल नहीं खाते"
  },
  "phone": {
    "invalid": "कृपया एक वैध फ़ोन नंबर दर्ज करें",
    "required": "फ़ोन नंबर आवश्यक है",
    "format": "फ़ोन नंबर +91 XXXXX XXXXX प्रारूप में होना चाहिए"
  },
  "amount": {
    "required": "राशि आवश्यक है",
    "positive": "राशि शून्य से अधिक होनी चाहिए",
    "min": "राशि कम से कम {{min}} होनी चाहिए",
    "max": "राशि {{max}} से अधिक नहीं हो सकती"
  },
  "name": {
    "required": "नाम आवश्यक है",
    "minLength": "नाम कम से कम {{min}} वर्णों का होना चाहिए",
    "maxLength": "नाम {{max}} वर्णों से अधिक नहीं हो सकता"
  },
  "upi": {
    "invalid": "कृपया एक वैध UPI ID दर्ज करें",
    "format": "UPI ID username@bank प्रारूप में होनी चाहिए"
  }
}
```

**Translation Key Naming Conventions:**

```markdown
## Translation Key Naming Conventions

1. **Namespace Prefixes:**
   - common: Shared across all MFEs
   - auth: Authentication-related
   - payments: Payment processing
   - admin: Administration
   - profile: User profile
   - validation: Form validation

2. **Key Structure:**
   - Use camelCase for keys
   - Group related keys under objects
   - Use descriptive hierarchy: `section.subsection.key`

3. **Examples:**
   - `auth.signIn.title` - Sign In page title
   - `common.buttons.submit` - Generic submit button
   - `payments.dashboard.recentTransactions` - Payments dashboard section

4. **Interpolation:**
   - Use double curly braces: `{{variable}}`
   - Name variables descriptively: `{{count}}`, `{{name}}`, `{{amount}}`

5. **Pluralization:**
   - Use `_one` and `_other` suffixes (ICU format)
   - Example: `minutesAgo` and `minutesAgo_other`
```

**Success Criteria:**

- [ ] All translation files created for en and hi
- [ ] Naming conventions documented
- [ ] TypeScript types generated for translation keys
- [ ] Translation completeness > 95%

---

### Priority 1.3: Shell App i18n Provider Integration

**Effort:** 2 hours
**Impact:** Enables i18n across all MFEs

**Tasks:**

- [ ] Initialize i18n before app render
- [ ] Wrap app in I18nextProvider
- [ ] Update Module Federation shared dependencies
- [ ] Add i18n to shell bootstrap
- [ ] Update HTML lang attribute on language change

**Files to Modify:**

```typescript
// apps/shell/src/main.tsx
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { initI18n } from '@mfe/shared-i18n';

// Initialize i18n before rendering
initI18n().then(() => {
  // Dynamic import to ensure i18n is ready
  import('./bootstrap').then(({ default: bootstrap }) => {
    const root = ReactDOM.createRoot(
      document.getElementById('root') as HTMLElement
    );
    root.render(
      <StrictMode>
        {bootstrap()}
      </StrictMode>
    );
  });
});
```

```typescript
// apps/shell/src/bootstrap.tsx
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from '@mfe/shared-i18n';
import { i18n } from '@mfe/shared-i18n';
import App from './app/app';

const queryClient = new QueryClient();

export default function bootstrap() {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </I18nextProvider>
  );
}
```

**Module Federation Update (all rspack.config.js files):**

```javascript
const sharedDependencies = {
  // ... existing dependencies
  'i18next': { singleton: true, requiredVersion: '^23.0.0', eager: false },
  'react-i18next': { singleton: true, requiredVersion: '^14.0.0', eager: false },
  'shared-i18n': { singleton: true, eager: true }, // Eager for singleton
};
```

**Success Criteria:**

- [ ] i18n initializes before app render
- [ ] I18nextProvider wraps entire app
- [ ] All MFEs share same i18n instance
- [ ] Language detection works

---

### Priority 1.4: Language Switcher Component

**Effort:** 2 hours
**Impact:** Users can switch languages

**Tasks:**

- [ ] Create LanguageSwitcher component in shared-design-system
- [ ] Add to Header component
- [ ] Persist language preference
- [ ] Update HTML lang attribute
- [ ] Handle dropdown/modal UI

**Component:**

```typescript
// libs/shared-design-system/src/lib/components/LanguageSwitcher.tsx
import * as React from 'react';
import { useLocale, LOCALE_METADATA, SupportedLocale } from '@mfe/shared-i18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './Select';
import { cn } from '../utils';

export interface LanguageSwitcherProps {
  /** Additional CSS classes */
  className?: string;
  /** Variant style */
  variant?: 'dropdown' | 'inline';
}

/**
 * Language switcher component for changing application language.
 *
 * Features:
 * - Shows current language with native name
 * - Dropdown with all supported languages
 * - Persists preference to localStorage
 * - Updates HTML lang attribute
 */
export function LanguageSwitcher({
  className,
  variant = 'dropdown',
}: LanguageSwitcherProps) {
  const { locale, changeLocale, supportedLocales } = useLocale();

  const handleLanguageChange = async (newLocale: string) => {
    await changeLocale(newLocale as SupportedLocale);
  };

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2', className)} data-testid="language-switcher">
        {supportedLocales.map((loc) => (
          <button
            key={loc}
            onClick={() => handleLanguageChange(loc)}
            className={cn(
              'px-2 py-1 text-sm rounded transition-colors',
              locale === loc
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
            aria-current={locale === loc ? 'true' : undefined}
            aria-label={`Switch to ${LOCALE_METADATA[loc].name}`}
            data-testid={`language-option-${loc}`}
          >
            {LOCALE_METADATA[loc].nativeName}
          </button>
        ))}
      </div>
    );
  }

  return (
    <Select value={locale} onValueChange={handleLanguageChange}>
      <SelectTrigger
        className={cn('w-[140px]', className)}
        aria-label="Select language"
        data-testid="language-switcher"
      >
        <SelectValue>
          <span className="flex items-center gap-2">
            <LanguageIcon className="h-4 w-4" />
            {LOCALE_METADATA[locale].nativeName}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {supportedLocales.map((loc) => (
          <SelectItem key={loc} value={loc} data-testid={`language-option-${loc}`}>
            <span className="flex items-center justify-between w-full">
              <span>{LOCALE_METADATA[loc].nativeName}</span>
              <span className="text-muted-foreground text-xs ml-2">
                {LOCALE_METADATA[loc].name}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Language icon component
function LanguageIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
      />
    </svg>
  );
}
```

**Header Integration:**

```typescript
// libs/shared-header-ui/src/lib/Header.tsx (modification)
import { LanguageSwitcher } from '@mfe/shared-design-system';

// Add to header nav items, before user menu
<LanguageSwitcher className="mr-2" />
```

**Success Criteria:**

- [ ] LanguageSwitcher component created
- [ ] Integrated into Header
- [ ] Language persists across sessions
- [ ] HTML lang attribute updates
- [ ] Accessible to screen readers

---

## Phase 2: MFE Translations

### Priority 2.1: Auth MFE Translation

**Effort:** 4 hours
**Impact:** Localized authentication flows

**Tasks:**

- [ ] Update SignIn component with translations
- [ ] Update SignUp component with translations
- [ ] Update ForgotPassword component with translations
- [ ] Update ResetPassword component with translations
- [ ] Update MFA components with translations
- [ ] Update VerifyEmail component with translations
- [ ] Update form validation messages

**Example Component Update:**

```typescript
// apps/auth-mfe/src/components/SignIn.tsx
import { useT, Trans } from '@mfe/shared-i18n';

export function SignIn() {
  const { t } = useT(['auth', 'common', 'validation']);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('auth:signIn.title')}</CardTitle>
        <CardDescription>{t('auth:signIn.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <FormField
            name="email"
            label={t('auth:signIn.email')}
            error={errors.email?.message && t(`validation:${errors.email.message}`)}
            required
          >
            <Input
              type="email"
              placeholder={t('auth:signIn.emailPlaceholder')}
            />
          </FormField>

          <FormField
            name="password"
            label={t('auth:signIn.password')}
            error={errors.password?.message && t(`validation:${errors.password.message}`)}
            required
          >
            <PasswordInput
              placeholder={t('auth:signIn.passwordPlaceholder')}
            />
          </FormField>

          <Button type="submit">
            {isLoading ? t('common:buttons.loading') : t('auth:signIn.submitButton')}
          </Button>

          <p className="text-center">
            <Trans i18nKey="auth:signIn.noAccount" t={t}>
              Don't have an account? <Link to="/signup">Sign up</Link>
            </Trans>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
```

**Success Criteria:**

- [ ] All Auth MFE components translated
- [ ] Form validation messages localized
- [ ] Social login buttons translated
- [ ] Error messages localized

---

### Priority 2.2: Payments MFE Translation

**Effort:** 4 hours
**Impact:** Localized payment processing

**Tasks:**

- [ ] Create payments.json translation files
- [ ] Update PaymentsDashboard with translations
- [ ] Update PaymentsList with translations
- [ ] Update PaymentDetails with translations
- [ ] Update CreatePayment form with translations
- [ ] Localize currency and amount display
- [ ] Localize date/time display

**Payments Namespace (English):**

```json
{
  "dashboard": {
    "title": "Payments Dashboard",
    "subtitle": "Manage your payments and transactions",
    "totalBalance": "Total Balance",
    "pendingPayments": "Pending Payments",
    "completedToday": "Completed Today",
    "recentTransactions": "Recent Transactions"
  },
  "list": {
    "title": "Payments",
    "search": "Search payments...",
    "filter": "Filter",
    "export": "Export",
    "createNew": "Create Payment",
    "columns": {
      "id": "Payment ID",
      "amount": "Amount",
      "status": "Status",
      "date": "Date",
      "recipient": "Recipient",
      "method": "Payment Method",
      "actions": "Actions"
    }
  },
  "details": {
    "title": "Payment Details",
    "paymentId": "Payment ID",
    "amount": "Amount",
    "status": "Status",
    "createdAt": "Created",
    "updatedAt": "Last Updated",
    "recipient": "Recipient",
    "description": "Description",
    "method": "Payment Method",
    "timeline": "Timeline"
  },
  "create": {
    "title": "Create Payment",
    "subtitle": "Send money securely",
    "amount": "Amount",
    "amountPlaceholder": "Enter amount in ₹",
    "recipient": "Recipient",
    "recipientPlaceholder": "Enter recipient details",
    "upiId": "UPI ID",
    "upiIdPlaceholder": "username@bank",
    "description": "Description",
    "descriptionPlaceholder": "Payment for...",
    "paymentMethod": "Payment Method",
    "methods": {
      "upi": "UPI",
      "netbanking": "Net Banking",
      "card": "Debit/Credit Card",
      "wallet": "Wallet"
    },
    "submitButton": "Send Payment",
    "confirmTitle": "Confirm Payment",
    "confirmMessage": "You are about to send {{amount}} to {{recipient}}. Continue?"
  },
  "status": {
    "pending": "Pending",
    "processing": "Processing",
    "completed": "Completed",
    "failed": "Failed",
    "cancelled": "Cancelled",
    "refunded": "Refunded"
  },
  "errors": {
    "insufficientBalance": "Insufficient balance",
    "invalidRecipient": "Invalid recipient details",
    "paymentFailed": "Payment failed. Please try again.",
    "dailyLimitExceeded": "Daily transaction limit exceeded"
  }
}
```

**Payments Namespace (Hindi):**

```json
{
  "dashboard": {
    "title": "भुगतान डैशबोर्ड",
    "subtitle": "अपने भुगतान और लेनदेन प्रबंधित करें",
    "totalBalance": "कुल शेष राशि",
    "pendingPayments": "लंबित भुगतान",
    "completedToday": "आज पूर्ण हुए",
    "recentTransactions": "हाल के लेनदेन"
  },
  "list": {
    "title": "भुगतान",
    "search": "भुगतान खोजें...",
    "filter": "फ़िल्टर",
    "export": "निर्यात करें",
    "createNew": "भुगतान बनाएं",
    "columns": {
      "id": "भुगतान ID",
      "amount": "राशि",
      "status": "स्थिति",
      "date": "तारीख",
      "recipient": "प्राप्तकर्ता",
      "method": "भुगतान विधि",
      "actions": "क्रियाएं"
    }
  },
  "details": {
    "title": "भुगतान विवरण",
    "paymentId": "भुगतान ID",
    "amount": "राशि",
    "status": "स्थिति",
    "createdAt": "बनाया गया",
    "updatedAt": "अंतिम अपडेट",
    "recipient": "प्राप्तकर्ता",
    "description": "विवरण",
    "method": "भुगतान विधि",
    "timeline": "समयरेखा"
  },
  "create": {
    "title": "भुगतान बनाएं",
    "subtitle": "सुरक्षित रूप से पैसे भेजें",
    "amount": "राशि",
    "amountPlaceholder": "₹ में राशि दर्ज करें",
    "recipient": "प्राप्तकर्ता",
    "recipientPlaceholder": "प्राप्तकर्ता विवरण दर्ज करें",
    "upiId": "UPI ID",
    "upiIdPlaceholder": "username@bank",
    "description": "विवरण",
    "descriptionPlaceholder": "भुगतान के लिए...",
    "paymentMethod": "भुगतान विधि",
    "methods": {
      "upi": "UPI",
      "netbanking": "नेट बैंकिंग",
      "card": "डेबिट/क्रेडिट कार्ड",
      "wallet": "वॉलेट"
    },
    "submitButton": "भुगतान भेजें",
    "confirmTitle": "भुगतान की पुष्टि करें",
    "confirmMessage": "आप {{recipient}} को {{amount}} भेजने वाले हैं। जारी रखें?"
  },
  "status": {
    "pending": "लंबित",
    "processing": "प्रक्रियाधीन",
    "completed": "पूर्ण",
    "failed": "विफल",
    "cancelled": "रद्द",
    "refunded": "वापसी"
  },
  "errors": {
    "insufficientBalance": "अपर्याप्त शेष राशि",
    "invalidRecipient": "अमान्य प्राप्तकर्ता विवरण",
    "paymentFailed": "भुगतान विफल। कृपया पुनः प्रयास करें।",
    "dailyLimitExceeded": "दैनिक लेनदेन सीमा पार"
  }
}
```

**Success Criteria:**

- [ ] All Payments MFE components translated
- [ ] Currency amounts formatted per locale
- [ ] Dates formatted per locale
- [ ] Payment status badges localized

---

### Priority 2.3: Admin MFE Translation

**Effort:** 3 hours
**Impact:** Localized administration UI

**Tasks:**

- [ ] Create admin.json translation files
- [ ] Update AdminDashboard with translations
- [ ] Update UserManagement with translations
- [ ] Update Settings with translations
- [ ] Update AuditLog with translations

**Success Criteria:**

- [ ] All Admin MFE components translated
- [ ] Data tables localized
- [ ] Admin actions localized

---

### Priority 2.4: Profile MFE Translation

**Effort:** 3 hours
**Impact:** Localized profile management

**Tasks:**

- [ ] Create profile.json translation files
- [ ] Update ProfilePage with translations
- [ ] Update SecuritySettings with translations
- [ ] Update NotificationPreferences with translations
- [ ] Update LinkedAccounts with translations

**Profile Namespace (English):**

```json
{
  "page": {
    "title": "Profile",
    "subtitle": "Manage your account settings and preferences"
  },
  "tabs": {
    "profile": "Profile",
    "security": "Security",
    "notifications": "Notifications",
    "preferences": "Preferences"
  },
  "profile": {
    "personalInfo": "Personal Information",
    "name": "Full Name",
    "email": "Email Address",
    "phone": "Phone Number",
    "address": "Address",
    "avatar": "Profile Photo",
    "changeAvatar": "Change Photo",
    "removeAvatar": "Remove Photo"
  },
  "security": {
    "title": "Security Settings",
    "password": {
      "title": "Password",
      "description": "Change your password to keep your account secure",
      "currentPassword": "Current Password",
      "newPassword": "New Password",
      "confirmPassword": "Confirm New Password",
      "changeButton": "Change Password",
      "lastChanged": "Last changed {{date}}"
    },
    "mfa": {
      "title": "Two-Factor Authentication",
      "description": "Add an extra layer of security to your account",
      "enabled": "Enabled",
      "disabled": "Disabled",
      "enableButton": "Enable 2FA",
      "disableButton": "Disable 2FA",
      "backupCodes": "Backup Codes",
      "viewBackupCodes": "View Backup Codes",
      "regenerateCodes": "Regenerate Codes"
    },
    "linkedAccounts": {
      "title": "Linked Accounts",
      "description": "Manage your connected social accounts",
      "linked": "Linked",
      "notLinked": "Not Linked",
      "linkButton": "Link",
      "unlinkButton": "Unlink",
      "confirmUnlink": "Are you sure you want to unlink your {{provider}} account?"
    },
    "sessions": {
      "title": "Active Sessions",
      "description": "Manage your logged in devices",
      "currentSession": "Current Session",
      "lastActive": "Last active {{date}}",
      "signOutAll": "Sign Out All Devices"
    }
  },
  "notifications": {
    "title": "Notification Preferences",
    "email": {
      "title": "Email Notifications",
      "paymentAlerts": "Payment Alerts",
      "securityAlerts": "Security Alerts",
      "marketing": "Marketing & Promotions"
    },
    "push": {
      "title": "Push Notifications",
      "enabled": "Push notifications enabled",
      "disabled": "Push notifications disabled",
      "enableButton": "Enable Push Notifications"
    }
  },
  "preferences": {
    "title": "Preferences",
    "language": "Language",
    "theme": {
      "title": "Theme",
      "light": "Light",
      "dark": "Dark",
      "system": "System"
    },
    "currency": "Default Currency",
    "timezone": "Timezone"
  }
}
```

**Profile Namespace (Hindi):**

```json
{
  "page": {
    "title": "प्रोफ़ाइल",
    "subtitle": "अपनी खाता सेटिंग्स और प्राथमिकताएं प्रबंधित करें"
  },
  "tabs": {
    "profile": "प्रोफ़ाइल",
    "security": "सुरक्षा",
    "notifications": "सूचनाएं",
    "preferences": "प्राथमिकताएं"
  },
  "profile": {
    "personalInfo": "व्यक्तिगत जानकारी",
    "name": "पूरा नाम",
    "email": "ईमेल पता",
    "phone": "फ़ोन नंबर",
    "address": "पता",
    "avatar": "प्रोफ़ाइल फ़ोटो",
    "changeAvatar": "फ़ोटो बदलें",
    "removeAvatar": "फ़ोटो हटाएं"
  },
  "security": {
    "title": "सुरक्षा सेटिंग्स",
    "password": {
      "title": "पासवर्ड",
      "description": "अपने खाते को सुरक्षित रखने के लिए पासवर्ड बदलें",
      "currentPassword": "वर्तमान पासवर्ड",
      "newPassword": "नया पासवर्ड",
      "confirmPassword": "नए पासवर्ड की पुष्टि करें",
      "changeButton": "पासवर्ड बदलें",
      "lastChanged": "अंतिम बार {{date}} को बदला गया"
    },
    "mfa": {
      "title": "द्वि-कारक प्रमाणीकरण",
      "description": "अपने खाते में सुरक्षा की एक अतिरिक्त परत जोड़ें",
      "enabled": "सक्षम",
      "disabled": "अक्षम",
      "enableButton": "2FA सक्षम करें",
      "disableButton": "2FA अक्षम करें",
      "backupCodes": "बैकअप कोड",
      "viewBackupCodes": "बैकअप कोड देखें",
      "regenerateCodes": "कोड पुनः उत्पन्न करें"
    },
    "linkedAccounts": {
      "title": "लिंक किए गए खाते",
      "description": "अपने जुड़े सोशल खातों को प्रबंधित करें",
      "linked": "लिंक किया गया",
      "notLinked": "लिंक नहीं किया गया",
      "linkButton": "लिंक करें",
      "unlinkButton": "अनलिंक करें",
      "confirmUnlink": "क्या आप वाकई अपने {{provider}} खाते को अनलिंक करना चाहते हैं?"
    },
    "sessions": {
      "title": "सक्रिय सत्र",
      "description": "अपने लॉग इन किए गए उपकरणों को प्रबंधित करें",
      "currentSession": "वर्तमान सत्र",
      "lastActive": "अंतिम सक्रिय {{date}}",
      "signOutAll": "सभी उपकरणों से साइन आउट करें"
    }
  },
  "notifications": {
    "title": "सूचना प्राथमिकताएं",
    "email": {
      "title": "ईमेल सूचनाएं",
      "paymentAlerts": "भुगतान अलर्ट",
      "securityAlerts": "सुरक्षा अलर्ट",
      "marketing": "मार्केटिंग और प्रमोशन"
    },
    "push": {
      "title": "पुश सूचनाएं",
      "enabled": "पुश सूचनाएं सक्षम",
      "disabled": "पुश सूचनाएं अक्षम",
      "enableButton": "पुश सूचनाएं सक्षम करें"
    }
  },
  "preferences": {
    "title": "प्राथमिकताएं",
    "language": "भाषा",
    "theme": {
      "title": "थीम",
      "light": "लाइट",
      "dark": "डार्क",
      "system": "सिस्टम"
    },
    "currency": "डिफ़ॉल्ट मुद्रा",
    "timezone": "समय क्षेत्र"
  }
}
```

**Success Criteria:**

- [ ] All Profile MFE components translated
- [ ] Security settings localized
- [ ] Notification preferences localized

---

### Priority 2.5: Shared Components Translation

**Effort:** 2 hours
**Impact:** Localized design system components

**Tasks:**

- [ ] Update Header with translations
- [ ] Update Footer with translations
- [ ] Update Error boundaries with translations
- [ ] Update Loading states with translations
- [ ] Update Toast notifications with translations

**Success Criteria:**

- [ ] All shared components use translations
- [ ] No hardcoded strings in design system

---

## Phase 3: Backend & API Localization

### Priority 3.1: Backend i18n Infrastructure

**Effort:** 3 hours
**Impact:** Localized API error messages

**Tasks:**

- [ ] Create backend i18n library
- [ ] Set up translation files for backend messages
- [ ] Create middleware to detect Accept-Language header
- [ ] Create utility functions for message translation
- [ ] Update error response format to include localized messages

**Backend i18n Library:**

```typescript
// libs/backend/i18n/src/lib/i18n.ts
import { readFileSync } from 'fs';
import { join } from 'path';

// Load translations
const translations: Record<string, Record<string, string>> = {
  en: JSON.parse(readFileSync(join(__dirname, '../translations/en.json'), 'utf-8')),
  hi: JSON.parse(readFileSync(join(__dirname, '../translations/hi.json'), 'utf-8')),
};

export type SupportedLocale = 'en' | 'hi';

/**
 * Get translation for a key
 */
export function t(locale: SupportedLocale, key: string, params?: Record<string, string | number>): string {
  const messages = translations[locale] || translations['en'];
  let message = messages[key] || translations['en'][key] || key;

  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      message = message.replace(new RegExp(`{{${param}}}`, 'g'), String(value));
    });
  }

  return message;
}

/**
 * Parse Accept-Language header and return best supported locale
 */
export function parseAcceptLanguage(header: string | undefined): SupportedLocale {
  if (!header) return 'en';

  const languages = header.split(',').map(lang => {
    const [code, qValue] = lang.trim().split(';q=');
    return {
      code: code.split('-')[0].toLowerCase(),
      q: qValue ? parseFloat(qValue) : 1,
    };
  });

  languages.sort((a, b) => b.q - a.q);

  for (const { code } of languages) {
    if (code === 'hi' || code === 'en') {
      return code as SupportedLocale;
    }
  }

  return 'en';
}
```

**Express Middleware:**

```typescript
// libs/backend/i18n/src/lib/middleware.ts
import { Request, Response, NextFunction } from 'express';
import { parseAcceptLanguage, SupportedLocale } from './i18n';

declare global {
  namespace Express {
    interface Request {
      locale: SupportedLocale;
    }
  }
}

/**
 * Middleware to detect and set locale from Accept-Language header
 */
export function localeMiddleware(req: Request, res: Response, next: NextFunction) {
  req.locale = parseAcceptLanguage(req.headers['accept-language']);
  res.setHeader('Content-Language', req.locale);
  next();
}
```

**Backend Translation Files:**

```json
// libs/backend/i18n/translations/en.json
{
  "auth.invalidCredentials": "Invalid email or password",
  "auth.accountLocked": "Your account has been locked. Please contact support.",
  "auth.emailNotVerified": "Please verify your email before signing in",
  "auth.sessionExpired": "Your session has expired. Please sign in again",
  "auth.mfaRequired": "Two-factor authentication required",
  "auth.invalidMfaCode": "Invalid verification code",

  "payment.created": "Payment created successfully",
  "payment.failed": "Payment failed",
  "payment.insufficientBalance": "Insufficient balance",
  "payment.invalidRecipient": "Invalid recipient",
  "payment.dailyLimitExceeded": "Daily transaction limit exceeded",

  "validation.required": "{{field}} is required",
  "validation.email": "Please enter a valid email address",
  "validation.minLength": "{{field}} must be at least {{min}} characters",
  "validation.maxLength": "{{field}} cannot exceed {{max}} characters",

  "errors.notFound": "Resource not found",
  "errors.unauthorized": "Unauthorized access",
  "errors.forbidden": "Access forbidden",
  "errors.serverError": "An unexpected error occurred. Please try again later."
}
```

```json
// libs/backend/i18n/translations/hi.json
{
  "auth.invalidCredentials": "अमान्य ईमेल या पासवर्ड",
  "auth.accountLocked": "आपका खाता लॉक कर दिया गया है। कृपया सहायता से संपर्क करें।",
  "auth.emailNotVerified": "साइन इन करने से पहले कृपया अपना ईमेल सत्यापित करें",
  "auth.sessionExpired": "आपका सत्र समाप्त हो गया है। कृपया पुनः साइन इन करें",
  "auth.mfaRequired": "द्वि-कारक प्रमाणीकरण आवश्यक है",
  "auth.invalidMfaCode": "अमान्य सत्यापन कोड",

  "payment.created": "भुगतान सफलतापूर्वक बनाया गया",
  "payment.failed": "भुगतान विफल",
  "payment.insufficientBalance": "अपर्याप्त शेष राशि",
  "payment.invalidRecipient": "अमान्य प्राप्तकर्ता",
  "payment.dailyLimitExceeded": "दैनिक लेनदेन सीमा पार",

  "validation.required": "{{field}} आवश्यक है",
  "validation.email": "कृपया एक वैध ईमेल पता दर्ज करें",
  "validation.minLength": "{{field}} कम से कम {{min}} वर्णों का होना चाहिए",
  "validation.maxLength": "{{field}} {{max}} वर्णों से अधिक नहीं हो सकता",

  "errors.notFound": "संसाधन नहीं मिला",
  "errors.unauthorized": "अनधिकृत पहुंच",
  "errors.forbidden": "पहुंच वर्जित",
  "errors.serverError": "एक अप्रत्याशित त्रुटि हुई। कृपया बाद में पुनः प्रयास करें।"
}
```

**Success Criteria:**

- [ ] Backend i18n library created
- [ ] Locale detection middleware working
- [ ] All backend services use localized messages
- [ ] Accept-Language header respected

---

### Priority 3.2: API Response Localization

**Effort:** 2 hours
**Impact:** Consistent localized API responses

**Tasks:**

- [ ] Update ApiError class to support localization
- [ ] Update all controllers to use localized messages
- [ ] Add locale to API response format
- [ ] Document API localization for frontend

**API Response Format:**

```typescript
// Localized error response format
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;          // Machine-readable error code
    message: string;       // Localized human-readable message
    locale: string;        // Locale used for message
    details?: unknown;     // Additional error details
  };
}

// Example response
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "अमान्य ईमेल या पासवर्ड", // Hindi
    "locale": "hi",
    "details": null
  }
}
```

**Success Criteria:**

- [ ] All API errors return localized messages
- [ ] Locale included in response
- [ ] Error codes remain consistent across locales

---

### Priority 3.3: User Language Preference Storage

**Effort:** 2 hours
**Impact:** Persistent language preference

**Tasks:**

- [ ] Add language preference field to User model
- [ ] Create migration for language field
- [ ] Add API endpoint to update language preference
- [ ] Use stored preference over Accept-Language header

**Database Schema Update:**

```prisma
// apps/auth-service/prisma/schema.prisma
model User {
  // ... existing fields

  // Language preference (ISO 639-1 code)
  language String @default("en") @map("language")
}
```

**API Endpoint:**

```typescript
// PATCH /api/profile/preferences
{
  "language": "hi"
}
```

**Success Criteria:**

- [ ] Language preference stored in database
- [ ] Preference synced to frontend on login
- [ ] Backend uses stored preference when available

---

## Phase 4: Testing & Quality Assurance

### Priority 4.1: Translation Extraction Tooling

**Effort:** 2 hours
**Impact:** Prevents missing translations

**Tasks:**

- [ ] Install and configure i18next-parser
- [ ] Create extraction script
- [ ] Add to pre-commit hook
- [ ] Document translation workflow

**i18next-parser Configuration:**

```javascript
// i18next-parser.config.js
module.exports = {
  locales: ['en', 'hi'],
  output: 'libs/shared-i18n/src/translations/$LOCALE/$NAMESPACE.json',
  input: [
    'apps/**/*.{ts,tsx}',
    'libs/**/*.{ts,tsx}',
    '!**/node_modules/**',
    '!**/*.spec.{ts,tsx}',
    '!**/*.test.{ts,tsx}',
  ],
  defaultNamespace: 'common',
  namespaceSeparator: ':',
  keySeparator: '.',
  createOldCatalogs: false,
  keepRemoved: false,
  sort: true,
  useKeysAsDefaultValue: true,
  verbose: true,
  failOnWarnings: false,
  failOnUpdate: false,
};
```

**Package.json Scripts:**

```json
{
  "scripts": {
    "i18n:extract": "i18next-parser",
    "i18n:check": "i18next-parser --fail-on-update",
    "i18n:report": "node scripts/i18n-report.js"
  }
}
```

**Translation Report Script:**

```typescript
// scripts/i18n-report.js
const fs = require('fs');
const path = require('path');

const locales = ['en', 'hi'];
const namespaces = ['common', 'auth', 'payments', 'admin', 'profile', 'validation'];

const report = { total: 0, translated: 0, missing: [] };

for (const ns of namespaces) {
  const enPath = path.join(__dirname, `../libs/shared-i18n/src/translations/en/${ns}.json`);
  const hiPath = path.join(__dirname, `../libs/shared-i18n/src/translations/hi/${ns}.json`);

  if (!fs.existsSync(enPath)) continue;

  const enKeys = getAllKeys(JSON.parse(fs.readFileSync(enPath, 'utf-8')));
  const hiKeys = fs.existsSync(hiPath)
    ? getAllKeys(JSON.parse(fs.readFileSync(hiPath, 'utf-8')))
    : [];

  report.total += enKeys.length;

  for (const key of enKeys) {
    if (hiKeys.includes(key)) {
      report.translated++;
    } else {
      report.missing.push(`${ns}:${key}`);
    }
  }
}

console.log('\n=== i18n Translation Report ===\n');
console.log(`Total keys: ${report.total}`);
console.log(`Translated (hi): ${report.translated}`);
console.log(`Missing (hi): ${report.missing.length}`);
console.log(`Coverage: ${((report.translated / report.total) * 100).toFixed(1)}%\n`);

if (report.missing.length > 0) {
  console.log('Missing translations:');
  report.missing.slice(0, 20).forEach(key => console.log(`  - ${key}`));
  if (report.missing.length > 20) {
    console.log(`  ... and ${report.missing.length - 20} more`);
  }
}

function getAllKeys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      return getAllKeys(value, fullKey);
    }
    return [fullKey];
  });
}
```

**Success Criteria:**

- [ ] i18next-parser configured
- [ ] Extraction script works
- [ ] Translation report shows coverage
- [ ] CI fails on missing translations

---

### Priority 4.2: E2E Testing for Multiple Locales

**Effort:** 4 hours
**Impact:** Validates i18n across app

**Tasks:**

- [ ] Create E2E tests for language switching
- [ ] Test critical flows in both languages
- [ ] Verify date/currency formatting
- [ ] Test RTL readiness (for future)
- [ ] Add locale to Playwright fixtures

**Playwright Fixtures:**

```typescript
// apps/shell-e2e/src/fixtures/i18n.fixture.ts
import { test as base, expect, Page } from '@playwright/test';

type Locale = 'en' | 'hi';

interface I18nFixtures {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
}

export const test = base.extend<I18nFixtures>({
  locale: ['en', { option: true }],

  setLocale: async ({ page }, use) => {
    const setLocale = async (locale: Locale) => {
      await page.evaluate((loc) => {
        localStorage.setItem('i18nextLng', loc);
      }, locale);
      await page.reload();
      await page.waitForLoadState('networkidle');
    };
    await use(setLocale);
  },
});

export { expect };
```

**E2E Tests:**

```typescript
// apps/shell-e2e/src/i18n.spec.ts
import { test, expect } from './fixtures/i18n.fixture';

test.describe('Internationalization', () => {

  test.describe('Language Switching', () => {

    test('should display UI in English by default', async ({ page }) => {
      await page.goto('/signin');

      // Check English text
      await expect(page.locator('h1')).toContainText('Sign In');
      await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    });

    test('should switch to Hindi when language is changed', async ({ page, setLocale }) => {
      await page.goto('/signin');
      await setLocale('hi');

      // Check Hindi text
      await expect(page.locator('h1')).toContainText('साइन इन करें');
      await expect(page.getByRole('button', { name: 'साइन इन करें' })).toBeVisible();
    });

    test('should persist language preference across sessions', async ({ page }) => {
      await page.goto('/signin');

      // Switch to Hindi via UI
      await page.click('[data-testid="language-switcher"]');
      await page.click('[data-testid="language-option-hi"]');

      // Reload and verify
      await page.reload();
      await expect(page.locator('h1')).toContainText('साइन इन करें');
    });

    test('should switch language via language switcher dropdown', async ({ page }) => {
      await page.goto('/signin');

      // Open language switcher
      await page.click('[data-testid="language-switcher"]');

      // Verify options
      await expect(page.getByText('English')).toBeVisible();
      await expect(page.getByText('हिन्दी')).toBeVisible();

      // Select Hindi
      await page.click('[data-testid="language-option-hi"]');

      // Verify UI updated
      await expect(page.locator('h1')).toContainText('साइन इन करें');
    });
  });

  test.describe('Date Formatting', () => {

    test('should format dates in English locale', async ({ page }) => {
      await page.goto('/payments');
      // Login first...

      // Check date format (e.g., "24 January 2026")
      const dateElement = page.locator('[data-testid="payment-date"]').first();
      await expect(dateElement).toHaveText(/\d{1,2} [A-Z][a-z]+ \d{4}/);
    });

    test('should format dates in Hindi locale', async ({ page, setLocale }) => {
      await page.goto('/payments');
      await setLocale('hi');
      // Login first...

      // Check Hindi date format
      const dateElement = page.locator('[data-testid="payment-date"]').first();
      await expect(dateElement).toBeVisible();
    });
  });

  test.describe('Currency Formatting', () => {

    test('should format currency in INR format', async ({ page }) => {
      await page.goto('/payments');
      // Login first...

      // Check currency format (₹1,000.00)
      const amountElement = page.locator('[data-testid="payment-amount"]').first();
      await expect(amountElement).toHaveText(/₹[\d,]+\.\d{2}/);
    });
  });

  test.describe('Form Validation Messages', () => {

    test('should show validation errors in Hindi', async ({ page, setLocale }) => {
      await page.goto('/signin');
      await setLocale('hi');

      // Submit empty form
      await page.click('button[type="submit"]');

      // Check Hindi validation message
      await expect(page.locator('[role="alert"]')).toContainText('ईमेल आवश्यक है');
    });
  });

  test.describe('HTML Lang Attribute', () => {

    test('should set lang="en" for English', async ({ page }) => {
      await page.goto('/signin');

      const lang = await page.evaluate(() => document.documentElement.lang);
      expect(lang).toBe('en');
    });

    test('should set lang="hi" for Hindi', async ({ page, setLocale }) => {
      await page.goto('/signin');
      await setLocale('hi');

      const lang = await page.evaluate(() => document.documentElement.lang);
      expect(lang).toBe('hi');
    });
  });
});
```

**Success Criteria:**

- [ ] Language switching tests pass
- [ ] Date/currency formatting tests pass
- [ ] Form validation message tests pass
- [ ] HTML lang attribute tests pass

---

### Priority 4.3: Unit Tests for i18n Hooks

**Effort:** 2 hours
**Impact:** Ensures i18n hooks work correctly

**Tasks:**

- [ ] Test useT hook
- [ ] Test useLocale hook
- [ ] Test useDateFormatter hook
- [ ] Test useCurrencyFormatter hook
- [ ] Test translation interpolation

**Success Criteria:**

- [ ] All i18n hooks have unit tests
- [ ] Coverage > 80% for i18n library

---

### Priority 4.4: CI/CD Translation Validation

**Effort:** 2 hours
**Impact:** Prevents deployment with missing translations

**Tasks:**

- [ ] Add translation check to CI pipeline
- [ ] Add translation coverage report
- [ ] Configure minimum coverage threshold
- [ ] Add translation validation GitHub Action

**GitHub Action:**

```yaml
# .github/workflows/i18n-check.yml
name: i18n Translation Check

on:
  pull_request:
    paths:
      - 'apps/**/*.tsx'
      - 'apps/**/*.ts'
      - 'libs/**/*.tsx'
      - 'libs/**/*.ts'
      - 'libs/shared-i18n/src/translations/**'

jobs:
  check-translations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Extract translations
        run: pnpm i18n:extract

      - name: Check for missing translations
        run: pnpm i18n:check

      - name: Generate translation report
        run: pnpm i18n:report

      - name: Check translation coverage
        run: |
          # Extract coverage percentage from i18n-report.js output
          COVERAGE=$(node scripts/i18n-report.js | grep -oP 'Coverage: \K[\d.]+')
          if (( $(echo "$COVERAGE < 95" | bc -l) )); then
            echo "Translation coverage is below 95%: $COVERAGE%"
            exit 1
          fi
          echo "Translation coverage: $COVERAGE%"
```

**Success Criteria:**

- [ ] CI checks for missing translations
- [ ] PR blocked if coverage < 95%
- [ ] Translation report generated on PR

---

## Dependencies

### npm Packages to Add

```bash
# Frontend i18n
pnpm add i18next react-i18next i18next-browser-languagedetector

# Development tools
pnpm add -D i18next-parser

# Backend i18n (if needed beyond simple JSON loading)
# Note: Backend uses simple JSON file loading, no additional packages needed
```

### Shared Dependencies Configuration

Update all `rspack.config.js` files:

```javascript
const sharedDependencies = {
  // ... existing dependencies
  'i18next': {
    singleton: true,
    requiredVersion: '^23.0.0',
    eager: false,
  },
  'react-i18next': {
    singleton: true,
    requiredVersion: '^14.0.0',
    eager: false,
  },
  'shared-i18n': {
    singleton: true,
    eager: true, // Eager for singleton initialization
  },
};
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Translation Coverage | ≥95% | i18next-parser |
| Hindi User Adoption | 15%+ | Analytics |
| UI Consistency | 100% | Manual review |
| E2E Tests Pass Rate | 100% | Playwright |
| Date/Currency Format Errors | 0 | Error tracking |
| Language Switch Latency | <100ms | Performance monitoring |

---

## Timeline Estimate

| Phase | Priorities | Estimated Effort |
|-------|------------|------------------|
| Phase 1 | 1.1 - 1.4 | 11 hours |
| Phase 2 | 2.1 - 2.5 | 16 hours |
| Phase 3 | 3.1 - 3.3 | 7 hours |
| Phase 4 | 4.1 - 4.4 | 10 hours |
| **Total** | | **~44 hours** |

---

## References

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [Hindi Unicode Block](https://unicode.org/charts/PDF/U0900.pdf)
- [ICU Message Format](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
- [Intl API (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
- [Hindi Pluralization Rules](https://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html#hi)

---

## Appendix A: Hindi Pluralization Rules

Hindi uses different pluralization rules than English. While English has "one" and "other" forms, Hindi generally doesn't change nouns for plural (context determines plurality). However, for counting purposes:

```javascript
// i18next pluralization for Hindi
{
  "item": "{{count}} आइटम",
  "item_0": "कोई आइटम नहीं",
  "item_one": "{{count}} आइटम",
  "item_other": "{{count}} आइटम"
}

// Usage
t('item', { count: 0 })   // → "कोई आइटम नहीं"
t('item', { count: 1 })   // → "1 आइटम"
t('item', { count: 5 })   // → "5 आइटम"
```

**Note:** Hindi plural forms are often the same, but the `_0` suffix can be used for "zero" cases which are often expressed differently (e.g., "कोई नहीं" - "none").

---

## Appendix B: Hindi Font Considerations

### Recommended System Fonts

```css
/* Hindi-optimized font stack */
.hindi-text {
  font-family:
    'Noto Sans Devanagari',  /* Google's comprehensive Devanagari font */
    'Mangal',                 /* Windows default Hindi font */
    'Kohinoor Devanagari',    /* Apple's Hindi font */
    'Devanagari MT',          /* macOS fallback */
    system-ui,
    sans-serif;
}
```

### Web Font Option (Optional Enhancement)

If consistent rendering is required, consider adding Google Fonts:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**Note:** System fonts are recommended for performance. Web fonts should only be added if rendering inconsistencies are observed.

---

## Appendix C: Common Hindi Translations Reference

| English | Hindi | Romanization |
|---------|-------|--------------|
| Sign In | साइन इन करें | Sign in karein |
| Sign Up | साइन अप करें | Sign up karein |
| Email | ईमेल | Email |
| Password | पासवर्ड | Password |
| Submit | जमा करें | Jama karein |
| Cancel | रद्द करें | Radd karein |
| Save | सहेजें | Sahejein |
| Delete | हटाएं | Hataaein |
| Edit | संपादित करें | Sampadit karein |
| Loading | लोड हो रहा है | Load ho raha hai |
| Error | त्रुटि | Truti |
| Success | सफल | Safal |
| Payment | भुगतान | Bhugtan |
| Amount | राशि | Rashi |
| Transaction | लेनदेन | Lenden |
| Balance | शेष राशि | Shesh rashi |
| Account | खाता | Khata |
| Profile | प्रोफ़ाइल | Profile |
| Settings | सेटिंग्स | Settings |
| Help | सहायता | Sahayata |

---

## Appendix D: Translation Workflow

### For Developers

1. **Adding New Strings:**
   - Add English string to appropriate namespace file
   - Use `t('namespace:key.path')` in component
   - Run `pnpm i18n:extract` to update files
   - Request Hindi translation from translator

2. **Updating Existing Strings:**
   - Update English string in translation file
   - Update Hindi translation (or flag for translator)
   - Run `pnpm i18n:check` to verify consistency

3. **Testing Translations:**
   - Run `pnpm dev:all`
   - Switch language using LanguageSwitcher
   - Verify all UI elements update correctly
   - Check date/currency formatting

### For Translators

1. **Translation Files Location:**
   - English: `libs/shared-i18n/src/translations/en/`
   - Hindi: `libs/shared-i18n/src/translations/hi/`

2. **Translation Guidelines:**
   - Maintain consistent terminology
   - Use formal Hindi (avoid regional dialects)
   - Keep interpolation placeholders unchanged: `{{variable}}`
   - Test translations in context when possible

3. **Quality Checklist:**
   - [ ] All keys translated
   - [ ] Interpolation placeholders preserved
   - [ ] Consistent terminology across namespaces
   - [ ] Appropriate formality level
   - [ ] No truncation issues in UI

---

## Appendix E: Future RTL Language Support

While Hindi is LTR (left-to-right), the architecture is designed to support future RTL languages (Arabic, Hebrew, Urdu). Key considerations:

1. **CSS Logical Properties:**
   Use logical properties instead of directional:
   ```css
   /* Instead of */
   margin-left: 1rem;

   /* Use */
   margin-inline-start: 1rem;
   ```

2. **Direction Attribute:**
   The `useLocale` hook provides `dir` property and `changeLocale` updates the HTML dir attribute:
   ```typescript
   const { dir, changeLocale } = useLocale();
   // dir is 'ltr' or 'rtl' based on current locale
   // changeLocale() automatically updates document.documentElement.dir
   ```

3. **Icon Mirroring:**
   Directional icons (arrows, navigation) should flip in RTL:
   ```css
   [dir="rtl"] .icon-arrow {
     transform: scaleX(-1);
   }
   ```

**Note:** Full RTL support is out of scope for this implementation but the foundation is prepared.
