# Profile MFE Implementation Plan

**Status:** Not Started  
**Version:** 1.0  
**Date:** December 12, 2025  
**Phase:** Profile MFE Implementation

> **📊 Progress Tracking:** See [`PROFILE-MFE-TASK-LIST.md`](./PROFILE-MFE-TASK-LIST.md) to track completion status and overall progress.

---

## Executive Summary

This document provides a detailed, step-by-step implementation plan for creating the Profile MFE (Microfrontend), extending the existing MFE architecture with user profile management functionality. The Profile MFE will integrate with the existing Profile Service backend and follow the same patterns established by admin-mfe.

Each task is designed to be:

- **Clear and actionable** - Specific steps that can be executed
- **Small and testable** - Easy to verify completion
- **Production-ready** - No throw-away code
- **Incremental** - Builds on previous steps

**Timeline:** 2-3 weeks  
**Goal:** Working Profile MFE with profile information display/edit, preferences management, and avatar upload

**Key Features:**

- Profile information display and editing (phone, address, bio, avatar)
- User preferences management (theme, language, currency, timezone, notifications)
- Avatar upload with preview
- Account information display (read-only)
- Profile completion indicator
- Form validation (React Hook Form + Zod)
- Design system integration (shadcn/ui)
- Module Federation v2 integration
- Comprehensive testing (70%+ coverage)

---

## Current State Analysis

### Existing Infrastructure

**Frontend MFEs:**

- Shell app (host, port 4200)
- Auth MFE (remote, port 4201)
- Payments MFE (remote, port 4202)
- Admin MFE (remote, port 4203)

**Backend Services:**

- Profile Service (port 3004) - Already exists and functional
- API Gateway (port 3000) - Already proxies `/api/profile` routes

**Available APIs:**

- `GET /api/profile` - Get current user's profile
- `PUT /api/profile` - Update profile (phone, address, avatarUrl, bio)
- `GET /api/profile/preferences` - Get user preferences
- `PUT /api/profile/preferences` - Update preferences

**Design System:**

- shadcn/ui components available
- Tailwind CSS v4 configured
- Shared components: Button, Card, Input, Label, Alert, Badge, Loading, Skeleton

---

## Architecture Overview

### Profile MFE Structure

```
apps/profile-mfe/
├── src/
│   ├── components/
│   │   ├── ProfilePage.tsx          # Main page component (exposed via Module Federation)
│   │   ├── ProfileForm.tsx          # Profile edit form
│   │   ├── AvatarUpload.tsx         # Avatar upload component
│   │   ├── PreferencesForm.tsx      # Preferences edit form
│   │   ├── AccountInfo.tsx          # Read-only account information
│   │   └── ProfileTabs.tsx          # Tab navigation component (optional)
│   ├── api/
│   │   └── profile.ts               # Profile API client functions
│   ├── hooks/
│   │   ├── useProfile.ts            # Profile data hook (TanStack Query)
│   │   └── usePreferences.ts        # Preferences hook (TanStack Query)
│   ├── types/
│   │   └── profile.ts               # TypeScript types for profile data
│   ├── utils/
│   │   └── validation.ts            # Zod validation schemas
│   ├── app/
│   │   ├── app.tsx                  # App component
│   │   └── app.spec.tsx             # App tests
│   ├── main.tsx                     # Entry point
│   ├── index.html                   # HTML template
│   └── styles.css                   # Global styles
├── rspack.config.js                 # Rspack configuration (Module Federation v2)
├── project.json                     # Nx project configuration
├── jest.config.cts                  # Jest test configuration
└── tsconfig.json                    # TypeScript configuration
```

### Module Federation Configuration

**Profile MFE (Remote):**

- Name: `profileMfe`
- Port: 4204
- Exposes: `./ProfilePage`
- Shared dependencies: react, react-dom, shared-auth-store, shared-design-system, etc.

**Shell App (Host):**

- Consumes: `profileMfe/ProfilePage`
- Route: `/profile` (protected, all authenticated users)

---

## Phase 1: Project Setup & Configuration (Days 1-2)

### Task 1.1: Create Profile MFE Project Structure

**Objective:** Create basic project structure following admin-mfe patterns

**Steps:**

1. Create directory structure:

   ```bash
   apps/profile-mfe/
   ├── src/
   │   ├── components/
   │   ├── api/
   │   ├── hooks/
   │   ├── types/
   │   ├── utils/
   │   ├── app/
   │   ├── assets/
   │   ├── main.tsx
   │   ├── index.html
   │   └── styles.css
   ```

2. Copy and adapt base files from admin-mfe:
   - `index.html` template
   - `styles.css` with Tailwind imports
   - `main.tsx` structure
   - `app.tsx` structure

3. Create `favicon.ico` placeholder

4. Create `assets/` directory with `.gitkeep`

**Verification:**

- [ ] Directory structure created
- [ ] Base files created
- [ ] Structure matches admin-mfe pattern

**Acceptance Criteria:**

- Profile MFE directory structure exists
- All base files created
- Ready for configuration

---

### Task 1.2: Configure Rspack with Module Federation v2

**Objective:** Set up Rspack bundler with Module Federation v2, matching admin-mfe configuration

**Steps:**

1. Copy `admin-mfe/rspack.config.js` as template
2. Update configuration:
   - Name: `profileMfe`
   - Port: 4204
   - Exposes: `./ProfilePage: ./src/components/ProfilePage.tsx`
   - uniqueName: `profileMfe`
3. Configure shared dependencies (same as admin-mfe):
   - react, react-dom (singleton, eager)
   - @tanstack/react-query (singleton, eager)
   - zustand (singleton, eager)
   - shared-auth-store (singleton, eager)
   - @mfe/shared-design-system (singleton)
   - All other shared libraries
4. Configure PostCSS loader for Tailwind CSS v4
5. Configure aliases for shared libraries
6. Test build: `nx build profile-mfe`

**Verification:**

- [ ] rspack.config.js created
- [ ] Module Federation plugin configured
- [ ] Shared dependencies configured
- [ ] Tailwind CSS v4 loader configured
- [ ] Aliases configured
- [ ] Build succeeds

**Acceptance Criteria:**

- Rspack configuration complete
- Module Federation v2 working
- Build succeeds without errors
- Configuration matches admin-mfe patterns

**Status:** Not Started  
**Files Created:**

- `apps/profile-mfe/rspack.config.js`

---

### Task 1.3: Configure Nx project.json

**Objective:** Set up Nx project configuration for Profile MFE

**Steps:**

1. Create `apps/profile-mfe/project.json`
2. Configure project metadata:
   - name: `profile-mfe`
   - projectType: `application`
   - tags: `["frontend", "profile-mfe", "mfe"]`
3. Configure build target:
   - executor: `@nx/rspack:rspack`
   - outputPath: `dist/apps/profile-mfe`
   - main: `apps/profile-mfe/src/main.tsx`
   - rspackConfig: `apps/profile-mfe/rspack.config.js`
   - isolatedConfig: true
4. Configure serve target:
   - executor: `@nx/rspack:dev-server`
   - buildTarget: `profile-mfe:build`
   - hmr: true
   - port: 4204
5. Configure test target:
   - executor: `@nx/jest:jest`
   - jestConfig: `apps/profile-mfe/jest.config.cts`
6. Test: `nx serve profile-mfe`

**Verification:**

- [ ] project.json created
- [ ] Build target configured
- [ ] Serve target configured
- [ ] Test target configured
- [ ] Port 4204 configured
- [ ] Serve works

**Acceptance Criteria:**

- Nx project configuration complete
- All targets working
- Dev server starts on port 4204

**Status:** Not Started  
**Files Created:**

- `apps/profile-mfe/project.json`

---

### Task 1.4: Set Up TypeScript Configuration

**Objective:** Configure TypeScript for Profile MFE

**Steps:**

1. Copy `admin-mfe/tsconfig.json` as template
2. Update paths and references if needed
3. Create `tsconfig.app.json`:
   - Extends base tsconfig.json
   - Includes: `src/**/*.ts`, `src/**/*.tsx`
   - Excludes: `src/**/*.spec.ts`, `src/**/*.spec.tsx`
4. Create `tsconfig.spec.json`:
   - Extends base tsconfig.json
   - Includes: `src/**/*.spec.ts`, `src/**/*.spec.tsx`
   - Types: jest, @testing-library/jest-dom
5. Verify type checking: `nx typecheck profile-mfe`

**Verification:**

- [ ] tsconfig.json created
- [ ] tsconfig.app.json created
- [ ] tsconfig.spec.json created
- [ ] Type checking works
- [ ] No type errors

**Acceptance Criteria:**

- TypeScript configuration complete
- Type checking passes
- Configuration matches admin-mfe

**Status:** Not Started  
**Files Created:**

- `apps/profile-mfe/tsconfig.json`
- `apps/profile-mfe/tsconfig.app.json`
- `apps/profile-mfe/tsconfig.spec.json`

---

### Task 1.5: Set Up Jest Testing Configuration

**Objective:** Configure Jest for testing Profile MFE

**Steps:**

1. Copy `admin-mfe/jest.config.cts` as template
2. Update configuration:
   - displayName: `profile-mfe`
   - testMatch: `**/*.spec.ts`, `**/*.spec.tsx`
   - setupFilesAfterEnv: `src/test/setup.ts`
3. Create `src/test/setup.ts`:
   - Import `@testing-library/jest-dom`
   - Mock setup if needed
4. Test: `nx test profile-mfe`

**Verification:**

- [ ] jest.config.cts created
- [ ] test/setup.ts created
- [ ] Tests can run
- [ ] No configuration errors

**Acceptance Criteria:**

- Jest configuration complete
- Tests can run
- Configuration matches admin-mfe

**Status:** Not Started  
**Files Created:**

- `apps/profile-mfe/jest.config.cts`
- `apps/profile-mfe/src/test/setup.ts`

---

### Task 1.6: Configure Tailwind CSS v4

**Objective:** Set up Tailwind CSS v4 for Profile MFE

**Steps:**

1. Verify Tailwind CSS v4 is configured at workspace root
2. Import Tailwind in `src/styles.css`:
   ```css
   @import 'tailwindcss';
   ```
3. Import styles in `main.tsx`
4. Verify Tailwind classes work in a test component
5. Test build with Tailwind: `nx build profile-mfe`

**Verification:**

- [ ] styles.css configured
- [ ] Tailwind imported
- [ ] Styles imported in main.tsx
- [ ] Tailwind classes work
- [ ] Build includes CSS

**Acceptance Criteria:**

- Tailwind CSS v4 working
- Styles compile correctly
- Configuration matches other MFEs

**Status:** Not Started  
**Files Modified:**

- `apps/profile-mfe/src/styles.css`
- `apps/profile-mfe/src/main.tsx`

---

## Phase 2: API Integration & Types (Days 3-4)

### Task 2.1: Create Profile API Client Functions

**Objective:** Create API client functions for Profile Service integration

**Steps:**

1. Create `src/api/profile.ts`
2. Import shared API client:
   ```typescript
   import { ApiClient, type TokenProvider } from '@mfe/shared-api-client';
   import { useAuthStore } from 'shared-auth-store';
   ```
3. Create API client instance with token provider:
   ```typescript
   const profileApiClient = new ApiClient({
     baseURL: process.env.NX_API_BASE_URL || 'https://localhost/api',
     tokenProvider: {
       /* ... */
     },
   });
   ```
4. Implement API functions:
   - `getProfile(): Promise<Profile>`
   - `updateProfile(data: UpdateProfileData): Promise<Profile>`
   - `getPreferences(): Promise<UserPreferences>`
   - `updatePreferences(data: UpdatePreferencesData): Promise<UserPreferences>`
5. Handle errors appropriately
6. Export functions

**Verification:**

- [ ] profile.ts created
- [ ] API client configured
- [ ] All API functions implemented
- [ ] Error handling implemented
- [ ] Functions exported

**Acceptance Criteria:**

- Profile API client complete
- All endpoints integrated
- Error handling works
- Matches payments-mfe/admin-mfe patterns

**Status:** Not Started  
**Files Created:**

- `apps/profile-mfe/src/api/profile.ts`

---

### Task 2.2: Define TypeScript Types and Interfaces

**Objective:** Create TypeScript types for profile data

**Steps:**

1. Create `src/types/profile.ts`
2. Define types based on Profile Service API:

   ```typescript
   export interface Profile {
     id: string;
     userId: string;
     phone: string | null;
     address: string | null;
     avatarUrl: string | null;
     bio: string | null;
     preferences: UserPreferences | null;
     createdAt: string;
     updatedAt: string;
   }

   export interface UserPreferences {
     theme?: 'light' | 'dark' | 'system';
     language?: string;
     currency?: string;
     timezone?: string;
     notifications?: {
       email?: boolean;
       push?: boolean;
       sms?: boolean;
     };
   }

   export interface UpdateProfileData {
     phoneNumber?: string;
     address?: string;
     avatarUrl?: string;
     bio?: string;
   }

   export interface UpdatePreferencesData {
     theme?: 'light' | 'dark' | 'system';
     language?: string;
     currency?: string;
     timezone?: string;
     notifications?: {
       email?: boolean;
       push?: boolean;
       sms?: boolean;
     };
   }
   ```

3. Export all types

**Verification:**

- [ ] profile.ts created
- [ ] All types defined
- [ ] Types match API responses
- [ ] Types exported

**Acceptance Criteria:**

- All TypeScript types defined
- Types match backend API
- No `any` types used

**Status:** Not Started  
**Files Created:**

- `apps/profile-mfe/src/types/profile.ts`

---

### Task 2.3: Create Zod Validation Schemas

**Objective:** Create Zod schemas for form validation

**Steps:**

1. Create `src/utils/validation.ts`
2. Import Zod: `import { z } from 'zod';`
3. Create validation schemas:

   ```typescript
   export const updateProfileSchema = z.object({
     phoneNumber: z.string().optional(),
     address: z.string().optional(),
     avatarUrl: z.string().url().optional().or(z.literal('')),
     bio: z.string().max(500).optional(),
   });

   export const updatePreferencesSchema = z.object({
     theme: z.enum(['light', 'dark', 'system']).optional(),
     language: z.string().optional(),
     currency: z.string().optional(),
     timezone: z.string().optional(),
     notifications: z
       .object({
         email: z.boolean().optional(),
         push: z.boolean().optional(),
         sms: z.boolean().optional(),
       })
       .optional(),
   });
   ```

4. Export schemas and inferred types

**Verification:**

- [ ] validation.ts created
- [ ] All schemas defined
- [ ] Schemas match API requirements
- [ ] Types exported

**Acceptance Criteria:**

- Validation schemas complete
- Schemas validate correctly
- Types inferred from schemas

**Status:** Not Started  
**Files Created:**

- `apps/profile-mfe/src/utils/validation.ts`

---

### Task 2.4: Set Up TanStack Query Hooks

**Objective:** Create TanStack Query hooks for profile data fetching

**Steps:**

1. Create `src/hooks/useProfile.ts`
2. Import TanStack Query and API client
3. Create `useProfile` hook:

   ```typescript
   export function useProfile() {
     return useQuery({
       queryKey: ['profile'],
       queryFn: getProfile,
       staleTime: 5 * 60 * 1000, // 5 minutes
     });
   }

   export function useUpdateProfile() {
     const queryClient = useQueryClient();
     return useMutation({
       mutationFn: updateProfile,
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['profile'] });
       },
     });
   }
   ```

4. Create `src/hooks/usePreferences.ts`:
   ```typescript
   export function usePreferences() {
     /* ... */
   }
   export function useUpdatePreferences() {
     /* ... */
   }
   ```
5. Export all hooks

**Verification:**

- [ ] useProfile.ts created
- [ ] usePreferences.ts created
- [ ] All hooks implemented
- [ ] Cache invalidation configured
- [ ] Hooks exported

**Acceptance Criteria:**

- TanStack Query hooks complete
- Cache invalidation working
- Hooks follow patterns from other MFEs

**Status:** Not Started  
**Files Created:**

- `apps/profile-mfe/src/hooks/useProfile.ts`
- `apps/profile-mfe/src/hooks/usePreferences.ts`

---

### Task 2.5: Write API Client Tests

**Objective:** Write comprehensive tests for API client functions

**Steps:**

1. Create `src/api/profile.test.ts`
2. Mock API client and token provider
3. Write tests for:
   - `getProfile()` - success case
   - `getProfile()` - error case
   - `updateProfile()` - success case
   - `updateProfile()` - error case
   - `getPreferences()` - success case
   - `getPreferences()` - error case
   - `updatePreferences()` - success case
   - `updatePreferences()` - error case
4. Test error handling
5. Run tests: `nx test profile-mfe --testPathPattern=profile.test`

**Verification:**

- [ ] profile.test.ts created
- [ ] All API functions tested
- [ ] Error cases tested
- [ ] Tests passing
- [ ] Coverage > 80%

**Acceptance Criteria:**

- API tests complete
- All functions tested
- Error handling tested
- Tests passing

**Status:** Not Started  
**Files Created:**

- `apps/profile-mfe/src/api/profile.test.ts`

---

## Phase 3: Core Components Development (Days 5-10)

### Task 3.1: Create ProfilePage Component (Main Entry Point)

**Objective:** Create main ProfilePage component exposed via Module Federation

**Steps:**

1. Create `src/components/ProfilePage.tsx`
2. Import design system components
3. Create component structure:
   - Header section
   - Tab navigation (ProfileForm, PreferencesForm, AccountInfo)
   - Error handling
   - Loading states
4. Use `useProfile` hook for data fetching
5. Implement tab state management
6. Export component as default
7. Write tests: `src/components/ProfilePage.test.tsx`

**Verification:**

- [ ] ProfilePage.tsx created
- [ ] Component structure complete
- [ ] Tabs working
- [ ] Loading states implemented
- [ ] Error handling implemented
- [ ] Tests written and passing

**Acceptance Criteria:**

- ProfilePage component complete
- Tabs functional
- Loading/error states working
- Tests passing
- Uses design system components

**Status:** Not Started  
**Files Created:**

- `apps/profile-mfe/src/components/ProfilePage.tsx`
- `apps/profile-mfe/src/components/ProfilePage.test.tsx`

---

### Task 3.2: Create ProfileForm Component

**Objective:** Create form component for editing profile information

**Steps:**

1. Create `src/components/ProfileForm.tsx`
2. Import React Hook Form and Zod resolver:
   ```typescript
   import { useForm } from 'react-hook-form';
   import { zodResolver } from '@hookform/resolvers/zod';
   ```
3. Use `updateProfileSchema` for validation
4. Create form fields:
   - Phone number (Input)
   - Address (Input/Textarea)
   - Bio (Textarea, max 500 chars)
   - Avatar (AvatarUpload component - will create in next task)
5. Use `useUpdateProfile` mutation
6. Implement form submission
7. Show success/error messages
8. Handle loading states
9. Write tests

**Verification:**

- [ ] ProfileForm.tsx created
- [ ] React Hook Form integrated
- [ ] Zod validation working
- [ ] All form fields implemented
- [ ] Submit handler working
- [ ] Success/error feedback working
- [ ] Tests written and passing

**Acceptance Criteria:**

- ProfileForm component complete
- Form validation working
- Submit updates profile
- User feedback implemented
- Tests passing

**Status:** Not Started  
**Files Created:**

- `apps/profile-mfe/src/components/ProfileForm.tsx`
- `apps/profile-mfe/src/components/ProfileForm.test.tsx`

---

### Task 3.3: Create AvatarUpload Component

**Objective:** Create component for uploading and previewing avatar images

**Steps:**

1. Create `src/components/AvatarUpload.tsx`
2. Implement file input (hidden)
3. Implement image preview
4. Handle file selection
5. Validate file type (image/\*)
6. Validate file size (max 5MB)
7. Generate preview URL (URL.createObjectURL)
8. Handle image removal
9. Integrate with ProfileForm
10. Write tests

**Verification:**

- [ ] AvatarUpload.tsx created
- [ ] File input working
- [ ] Image preview working
- [ ] File validation working
- [ ] File size validation working
- [ ] Remove functionality working
- [ ] Tests written and passing

**Acceptance Criteria:**

- AvatarUpload component complete
- File upload working
- Preview working
- Validation working
- Tests passing

**Status:** Not Started  
**Files Created:**

- `apps/profile-mfe/src/components/AvatarUpload.tsx`
- `apps/profile-mfe/src/components/AvatarUpload.test.tsx`

---

### Task 3.4: Create PreferencesForm Component

**Objective:** Create form component for editing user preferences

**Steps:**

1. Create `src/components/PreferencesForm.tsx`
2. Use React Hook Form with `updatePreferencesSchema`
3. Create form fields:
   - Theme (Select: light/dark/system)
   - Language (Select)
   - Currency (Select)
   - Timezone (Select)
   - Notifications (Checkboxes: email, push, sms)
4. Use `useUpdatePreferences` mutation
5. Implement form submission
6. Show success/error messages
7. Handle loading states
8. Write tests

**Verification:**

- [ ] PreferencesForm.tsx created
- [ ] React Hook Form integrated
- [ ] All preference fields implemented
- [ ] Submit handler working
- [ ] Success/error feedback working
- [ ] Tests written and passing

**Acceptance Criteria:**

- PreferencesForm component complete
- All preferences editable
- Form validation working
- Submit updates preferences
- Tests passing

**Status:** Not Started  
**Files Created:**

- `apps/profile-mfe/src/components/PreferencesForm.tsx`
- `apps/profile-mfe/src/components/PreferencesForm.test.tsx`

---

### Task 3.5: Create AccountInfo Component

**Objective:** Create read-only component displaying account information

**Steps:**

1. Create `src/components/AccountInfo.tsx`
2. Display read-only information:
   - User ID
   - Email (from auth store)
   - Role (from auth store)
   - Account created date
   - Last updated date
   - Email verification status
3. Use design system components (Card, Badge)
4. Format dates appropriately
5. Write tests

**Verification:**

- [ ] AccountInfo.tsx created
- [ ] All account info displayed
- [ ] Dates formatted correctly
- [ ] Uses design system
- [ ] Tests written and passing

**Acceptance Criteria:**

- AccountInfo component complete
- All information displayed
- Read-only (no edit functionality)
- Tests passing

**Status:** Not Started  
**Files Created:**

- `apps/profile-mfe/src/components/AccountInfo.tsx`
- `apps/profile-mfe/src/components/AccountInfo.test.tsx`

---

### Task 3.6: Create ProfileTabs Component (Optional)

**Objective:** Create tab navigation component for ProfilePage

**Steps:**

1. Check if design system has Tabs component
2. If yes, use design system Tabs component
3. If no, create `src/components/ProfileTabs.tsx`
4. Define tab structure:
   - Profile (ProfileForm)
   - Preferences (PreferencesForm)
   - Account (AccountInfo)
5. Handle tab switching
6. Write tests (if custom component)

**Verification:**

- [ ] Tab navigation working
- [ ] All tabs functional
- [ ] Active tab highlighted
- [ ] Tests written and passing (if custom)

**Acceptance Criteria:**

- Tab navigation complete
- All tabs working
- Uses design system if available
- Tests passing

**Status:** Not Started  
**Files Created:**

- `apps/profile-mfe/src/components/ProfileTabs.tsx` (if needed)
- `apps/profile-mfe/src/components/ProfileTabs.test.tsx` (if needed)

---

## Phase 4: Integration & Testing (Days 11-12)

### Task 4.1: Add Profile MFE to Shell App Routes

**Objective:** Integrate Profile MFE into shell app routing

**Steps:**

1. Update `apps/shell/src/routes/AppRoutes.tsx`
2. Add Profile MFE remote import:
   ```typescript
   const ProfilePage = React.lazy(() => import('profileMfe/ProfilePage'));
   ```
3. Add route:
   ```typescript
   <Route
     path="/profile"
     element={
       <ProtectedRoute>
         <ProfilePage />
       </ProtectedRoute>
     }
   />
   ```
4. Update Module Federation configuration in shell app `rspack.config.js`:
   - Add `profileMfe` to remotes
   - Configure remote URL: `http://localhost:4204/remoteEntry.js`
5. Test route: Navigate to `/profile`

**Verification:**

- [ ] ProfilePage imported
- [ ] Route added
- [ ] Route protected
- [ ] Module Federation remote configured
- [ ] Route accessible
- [ ] Remote loads correctly

**Acceptance Criteria:**

- Profile MFE route working
- Module Federation loading correctly
- Route protection working

**Status:** Not Started  
**Files Modified:**

- `apps/shell/src/routes/AppRoutes.tsx`
- `apps/shell/rspack.config.js`

---

### Task 4.2: Add Navigation Link in Header

**Objective:** Add Profile link to header navigation

**Steps:**

1. Update `libs/shared-header-ui/src/lib/shared-header-ui.tsx`
2. Add Profile link (all authenticated users):
   ```typescript
   <Link
     to="/profile"
     className="text-slate-300 hover:text-white transition-colors px-3 py-2 rounded-md text-sm font-medium"
   >
     Profile
   </Link>
   ```
3. Position link appropriately (after Payments, before Admin)
4. Test navigation: Click Profile link

**Verification:**

- [ ] Profile link added
- [ ] Link visible when authenticated
- [ ] Navigation works
- [ ] Link styled correctly
- [ ] Link positioned correctly

**Acceptance Criteria:**

- Profile link in header
- Navigation working
- Styling matches other links

**Status:** Not Started  
**Files Modified:**

- `libs/shared-header-ui/src/lib/shared-header-ui.tsx`

---

### Task 4.3: Update nginx Configuration

**Objective:** Add Profile MFE upstream to nginx configuration

**Steps:**

1. Update `nginx/nginx.conf`
2. Add Profile MFE upstream:
   ```nginx
   upstream profile_mfe {
       server host.docker.internal:4204;
       keepalive 32;
   }
   ```
3. Add location block for Profile MFE:
   ```nginx
   location /profile-mfe/ {
       proxy_pass http://profile_mfe/;
       # ... proxy settings
   }
   ```
4. Test nginx configuration: `nginx -t`
5. Restart nginx if needed

**Verification:**

- [ ] Upstream added
- [ ] Location block added
- [ ] nginx configuration valid
- [ ] Proxy routing works

**Acceptance Criteria:**

- nginx configuration updated
- Profile MFE accessible via proxy
- Configuration validated

**Status:** Not Started  
**Files Modified:**

- `nginx/nginx.conf`

---

### Task 4.4: Integration Testing

**Objective:** Write integration tests for Profile MFE

**Steps:**

1. Create `src/components/ProfilePage.integration.test.tsx`
2. Test full flow:
   - Load profile page
   - Display profile data
   - Edit profile form
   - Submit profile update
   - Edit preferences
   - Submit preferences update
3. Mock API calls appropriately
4. Test error scenarios
5. Run tests: `nx test profile-mfe`

**Verification:**

- [ ] Integration tests created
- [ ] Full flow tested
- [ ] Error scenarios tested
- [ ] Tests passing

**Acceptance Criteria:**

- Integration tests complete
- All flows tested
- Tests passing

**Status:** Not Started  
**Files Created:**

- `apps/profile-mfe/src/components/ProfilePage.integration.test.tsx`

---

### Task 4.5: E2E Testing

**Objective:** Write E2E tests for Profile MFE

**Steps:**

1. Check if E2E setup exists for shell app
2. If yes, create E2E test file
3. Test user journey:
   - Sign in
   - Navigate to profile
   - View profile information
   - Edit profile
   - Save changes
   - Edit preferences
   - Save preferences
4. Run E2E tests

**Verification:**

- [ ] E2E tests created
- [ ] User journey tested
- [ ] Tests passing

**Acceptance Criteria:**

- E2E tests complete
- User journey tested
- Tests passing

**Status:** Not Started  
**Files Created:**

- `apps/shell-e2e/src/profile.spec.ts` (if E2E setup exists)

---

### Task 4.6: Performance Testing

**Objective:** Verify Profile MFE performance

**Steps:**

1. Check bundle size: `nx build profile-mfe`
2. Verify bundle size < 500KB (gzipped)
3. Test page load time
4. Test form interaction performance
5. Optimize if needed (code splitting, lazy loading)

**Verification:**

- [ ] Bundle size acceptable
- [ ] Page load time acceptable
- [ ] Form interactions smooth
- [ ] No performance issues

**Acceptance Criteria:**

- Bundle size optimized
- Performance acceptable
- No major performance issues

**Status:** Not Started

---

### Task 4.7: Accessibility Testing

**Objective:** Verify Profile MFE accessibility

**Steps:**

1. Test keyboard navigation
2. Test screen reader compatibility
3. Test ARIA labels
4. Test color contrast
5. Fix any accessibility issues

**Verification:**

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] ARIA labels present
- [ ] Color contrast sufficient
- [ ] Accessibility issues fixed

**Acceptance Criteria:**

- Accessibility standards met
- Keyboard navigation working
- Screen reader compatible

**Status:** Not Started

---

## Phase 5: Polish & Documentation (Days 13-14)

### Task 5.1: Error Handling Improvements

**Objective:** Improve error handling throughout Profile MFE

**Steps:**

1. Review all error cases
2. Add proper error messages
3. Add error boundaries
4. Handle network errors gracefully
5. Handle validation errors
6. Test error scenarios

**Verification:**

- [ ] Error handling comprehensive
- [ ] Error messages user-friendly
- [ ] Error boundaries implemented
- [ ] All error cases handled

**Acceptance Criteria:**

- Error handling complete
- User-friendly error messages
- Error boundaries working

**Status:** Not Started

---

### Task 5.2: Loading States

**Objective:** Ensure all loading states are properly implemented

**Steps:**

1. Review all async operations
2. Add loading indicators
3. Use Loading component from design system
4. Test loading states
5. Ensure no flickering

**Verification:**

- [ ] All loading states implemented
- [ ] Loading indicators visible
- [ ] Loading states tested
- [ ] No flickering

**Acceptance Criteria:**

- Loading states complete
- Users see feedback during loading
- Loading components used correctly

**Status:** Not Started

---

### Task 5.3: Success/Error Feedback (Toasts)

**Objective:** Implement toast notifications for user feedback

**Steps:**

1. Check if toast component exists in design system
2. If yes, use design system Toast component
3. If no, create simple toast notification
4. Add toast notifications for:
   - Profile update success
   - Profile update error
   - Preferences update success
   - Preferences update error
5. Test toast notifications

**Verification:**

- [ ] Toast notifications implemented
- [ ] Success toasts working
- [ ] Error toasts working
- [ ] Toasts tested

**Acceptance Criteria:**

- Toast notifications working
- User feedback clear
- Toasts tested

**Status:** Not Started

---

### Task 5.4: Documentation

**Objective:** Create documentation for Profile MFE

**Steps:**

1. Update README.md with Profile MFE information
2. Document component usage
3. Document API integration
4. Document testing approach
5. Add JSDoc comments to components
6. Document Module Federation configuration

**Verification:**

- [ ] README updated
- [ ] Components documented
- [ ] API integration documented
- [ ] Code comments added

**Acceptance Criteria:**

- Documentation complete
- Components documented
- Usage examples provided

**Status:** Not Started  
**Files Modified:**

- `README.md`
- Component files (add JSDoc comments)

---

### Task 5.5: Code Review and Refactoring

**Objective:** Final code review and refactoring

**Steps:**

1. Run linter: `nx lint profile-mfe`
2. Fix linting errors
3. Run type checker: `nx typecheck profile-mfe`
4. Fix type errors
5. Review code quality
6. Refactor as needed
7. Run all tests: `nx test profile-mfe`
8. Verify test coverage > 70%
9. Check for `any` types
10. Verify no throw-away code

**Verification:**

- [ ] Linting passes
- [ ] Type checking passes
- [ ] Code quality good
- [ ] All tests passing
- [ ] Coverage > 70%
- [ ] No `any` types
- [ ] Production-ready code

**Acceptance Criteria:**

- Code quality verified
- All checks passing
- Tests passing
- Coverage sufficient

**Status:** Not Started

---

## Success Criteria

### Functional Requirements

- ✅ Profile MFE accessible at `/profile` route
- ✅ Profile information display working
- ✅ Profile editing working (phone, address, bio, avatar)
- ✅ Avatar upload working with preview
- ✅ Preferences editing working (theme, language, currency, timezone, notifications)
- ✅ Account information display working (read-only)
- ✅ Form validation working
- ✅ Success/error feedback working

### Technical Requirements

- ✅ Module Federation v2 integration working
- ✅ Rspack build working
- ✅ TypeScript strict mode passing
- ✅ All tests passing (70%+ coverage)
- ✅ Linting passes
- ✅ Design system components used
- ✅ Tailwind CSS v4 working
- ✅ TanStack Query hooks working
- ✅ React Hook Form + Zod validation working

### Quality Requirements

- ✅ No `any` types
- ✅ Error handling comprehensive
- ✅ Loading states implemented
- ✅ Accessibility standards met
- ✅ Performance acceptable
- ✅ Code follows project patterns

---

## Timeline Estimate

| Phase       | Duration                | Tasks                                   |
| ----------- | ----------------------- | --------------------------------------- |
| **Phase 1** | 2 days                  | Project setup & configuration (6 tasks) |
| **Phase 2** | 2 days                  | API integration & types (5 tasks)       |
| **Phase 3** | 6 days                  | Core components (6 tasks)               |
| **Phase 4** | 3 days                  | Integration & testing (7 tasks)         |
| **Phase 5** | 2 days                  | Polish & documentation (5 tasks)        |
| **Total**   | **15 days (2-3 weeks)** | **29 tasks**                            |

---

## Dependencies

### External Dependencies

- Profile Service backend (already exists - port 3004)
- API Gateway (already exists - port 3000)
- Shared design system (already exists)
- Shared API client (already exists)
- Shared auth store (already exists)

### Internal Dependencies

- Shell app (for routing)
- Shared header UI (for navigation link)
- Module Federation v2 setup
- nginx reverse proxy (for production routing)

---

## Risk Assessment

### Low Risk

- Profile Service API already exists and tested
- Patterns established by admin-mfe
- Design system components available
- API Gateway already proxies Profile Service

### Medium Risk

- Avatar upload file handling (needs proper validation and backend integration)
- Module Federation integration (follow existing patterns carefully)
- File upload to backend (may need image upload endpoint)

### Mitigation

- Follow admin-mfe patterns closely
- Test avatar upload thoroughly
- Review Module Federation configuration carefully
- Verify backend supports avatar URL or implement upload endpoint

---

## Files Created Summary

### Configuration Files (Phase 1)

- `apps/profile-mfe/rspack.config.js`
- `apps/profile-mfe/project.json`
- `apps/profile-mfe/tsconfig.json`
- `apps/profile-mfe/tsconfig.app.json`
- `apps/profile-mfe/tsconfig.spec.json`
- `apps/profile-mfe/jest.config.cts`

### Source Files (Phase 2-3)

- `apps/profile-mfe/src/main.tsx`
- `apps/profile-mfe/src/index.html`
- `apps/profile-mfe/src/styles.css`
- `apps/profile-mfe/src/app/app.tsx`
- `apps/profile-mfe/src/app/app.spec.tsx`
- `apps/profile-mfe/src/api/profile.ts`
- `apps/profile-mfe/src/api/profile.test.ts`
- `apps/profile-mfe/src/types/profile.ts`
- `apps/profile-mfe/src/utils/validation.ts`
- `apps/profile-mfe/src/hooks/useProfile.ts`
- `apps/profile-mfe/src/hooks/usePreferences.ts`
- `apps/profile-mfe/src/components/ProfilePage.tsx`
- `apps/profile-mfe/src/components/ProfilePage.test.tsx`
- `apps/profile-mfe/src/components/ProfileForm.tsx`
- `apps/profile-mfe/src/components/ProfileForm.test.tsx`
- `apps/profile-mfe/src/components/AvatarUpload.tsx`
- `apps/profile-mfe/src/components/AvatarUpload.test.tsx`
- `apps/profile-mfe/src/components/PreferencesForm.tsx`
- `apps/profile-mfe/src/components/PreferencesForm.test.tsx`
- `apps/profile-mfe/src/components/AccountInfo.tsx`
- `apps/profile-mfe/src/components/AccountInfo.test.tsx`
- `apps/profile-mfe/src/components/ProfileTabs.tsx` (if needed)
- `apps/profile-mfe/src/test/setup.ts`

### Integration Files (Phase 4)

- `apps/shell/src/routes/AppRoutes.tsx` (modified)
- `apps/shell/rspack.config.js` (modified)
- `libs/shared-header-ui/src/lib/shared-header-ui.tsx` (modified)
- `nginx/nginx.conf` (modified)
- `apps/profile-mfe/src/components/ProfilePage.integration.test.tsx`
- `apps/shell-e2e/src/profile.spec.ts` (if E2E setup exists)

---

**End of Implementation Plan**
