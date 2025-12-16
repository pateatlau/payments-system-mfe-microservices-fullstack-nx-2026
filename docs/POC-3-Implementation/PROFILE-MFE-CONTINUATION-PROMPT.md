# Profile MFE Implementation - Phase 2 Continuation Prompt

**Use this prompt to continue Profile MFE implementation in a new chat session.**

---

## Context Summary

I'm continuing the Profile MFE implementation. **Phase 1 is 100% complete** (all 6 tasks done). Ready to start **Phase 2: API Integration & Types**.

### Phase 1 Completion Status

✅ **Task 1.1:** Create Profile MFE Project Structure - Complete  
✅ **Task 1.2:** Configure Rspack with Module Federation v2 - Complete  
✅ **Task 1.3:** Configure Nx project.json - Complete  
✅ **Task 1.4:** Set Up TypeScript Configuration - Complete  
✅ **Task 1.5:** Set Up Jest Testing Configuration - Complete  
✅ **Task 1.6:** Configure Tailwind CSS v4 - Complete

**Progress:** Phase 1: 100% (6/6 tasks) | Overall: 18% (6/34 tasks)

### Current State

- Profile MFE project structure created at `apps/profile-mfe/`
- Rspack configured with Module Federation v2 (port 4204, exposes `./ProfilePage`)
- Nx project.json configured (build, serve, test targets working)
- TypeScript configuration complete (all configs created)
- Jest configuration complete (tests passing)
- Tailwind CSS v4 configured and working
- Placeholder ProfilePage component created for Module Federation
- Build succeeds and generates `remoteEntry.js`
- All package.json commands verified and working

### Key Files Created

- `apps/profile-mfe/rspack.config.js`
- `apps/profile-mfe/project.json`
- `apps/profile-mfe/tsconfig.json`, `tsconfig.app.json`, `tsconfig.spec.json`
- `apps/profile-mfe/jest.config.cts`
- `apps/profile-mfe/postcss.config.js`, `tailwind.config.js`
- `apps/profile-mfe/src/main.tsx`, `src/app/app.tsx`, `src/styles.css`
- `apps/profile-mfe/src/components/ProfilePage.tsx` (placeholder)

### Important Context

1. **Avatar Implementation:** Adopt **Option B (Direct File Upload)** from `docs/POC-3-Implementation/AVATAR-IMPLEMENTATION-STRATEGY.md`
   - Backend: Add `POST /api/profile/avatar` endpoint with multer
   - Frontend: Implement `AvatarUpload` component with file upload
   - Store files in `uploads/avatars/{userId}/` directory
   - Return public URL: `https://localhost/api/profile/avatars/{userId}/{filename}`

2. **Documentation Updates:** After EACH task completion, update BOTH:
   - `docs/POC-3-Implementation/PROFILE-MFE-TASK-LIST.md`
   - `docs/POC-3-Implementation/PROFILE-MFE-IMPLEMENTATION-PLAN.md`
   - Mark checkboxes, set Status "Complete", add date and notes

3. **Backend Profile Service:** Already exists and functional
   - Port: 3004
   - Endpoints: `GET /api/profile`, `PUT /api/profile`, `GET /api/profile/preferences`, `PUT /api/profile/preferences`
   - API Gateway already proxies `/api/profile` routes

4. **Patterns to Follow:** Use `admin-mfe` as reference for all patterns

---

## Next Steps: Phase 2 - API Integration & Types

**Starting with Task 2.1: Create Profile API Client Functions**

### Task 2.1 Requirements

1. Create `apps/profile-mfe/src/api/profile.ts`
2. Use shared API client (`@mfe/shared-api-client`)
3. Implement functions:
   - `getProfile(): Promise<Profile>`
   - `updateProfile(data: UpdateProfileData): Promise<Profile>`
   - `getPreferences(): Promise<UserPreferences>`
   - `updatePreferences(data: UpdatePreferencesData): Promise<UserPreferences>`
4. Follow patterns from `payments-mfe` or `admin-mfe` API clients
5. Handle errors appropriately
6. Write tests (Task 2.5)

### Reference Files

- Implementation Plan: `docs/POC-3-Implementation/PROFILE-MFE-IMPLEMENTATION-PLAN.md`
- Task List: `docs/POC-3-Implementation/PROFILE-MFE-TASK-LIST.md`
- Avatar Strategy: `docs/POC-3-Implementation/AVATAR-IMPLEMENTATION-STRATEGY.md` (Option B)
- Reference API Client: `apps/payments-mfe/src/api/` or `apps/admin-mfe/src/api/`
- Shared API Client: `libs/shared-api-client/src/`

---

## Instructions for AI Assistant

1. **Read the documentation files** to understand the full context
2. **Start with Task 2.1** - Create Profile API Client Functions
3. **Follow the implementation plan** step-by-step
4. **Update documentation** after each task completion
5. **Ask for confirmation** before proceeding to next task
6. **Don't commit** until user verifies and confirms
7. **If in doubt, ask** - don't assume anything

---

## Continuation Prompt (Copy This)

```
I'm continuing the Profile MFE implementation. Phase 1 is complete (100% - all 6 tasks done).

Current state:
- Profile MFE project structure created and configured
- Rspack with Module Federation v2 working (port 4204)
- Nx project.json configured, build succeeds
- TypeScript, Jest, Tailwind CSS v4 all configured
- Placeholder ProfilePage component created
- All package.json commands verified

Ready to start Phase 2: API Integration & Types, beginning with Task 2.1: Create Profile API Client Functions.

Please:
1. Read @docs/POC-3-Implementation/PROFILE-MFE-IMPLEMENTATION-PLAN.md and @docs/POC-3-Implementation/PROFILE-MFE-TASK-LIST.md
2. Review the avatar implementation strategy (Option B from AVATAR-IMPLEMENTATION-STRATEGY.md)
3. Start with Task 2.1: Create Profile API Client Functions
4. Follow the implementation plan step-by-step
5. Update documentation after each task
6. Ask for confirmation before proceeding to next task
7. Don't commit until I verify and confirm

Reference patterns: Use admin-mfe or payments-mfe as templates for API client implementation.
```

---

**Last Updated:** 2025-12-16  
**Phase 1 Status:** Complete (100%)  
**Next Phase:** Phase 2 - API Integration & Types  
**Next Task:** Task 2.1 - Create Profile API Client Functions
