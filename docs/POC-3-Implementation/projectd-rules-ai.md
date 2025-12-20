You are continuing an existing implementation.

Context:

- This project follows a strict Universal Web + Mobile Microfrontend architecture.
- The Profile MFE is already implemented up to Phase 3 (Core Components).
- All architectural decisions are FINAL and must NOT be changed.

Hard rules (do not violate):

1. This is a Module Federation v2 remote.
2. The remote exposes ONLY ProfilePage.
3. No cross-MFE imports.
4. No shell routing logic inside the MFE.
5. All data access goes through existing API clients and TanStack Query hooks.
6. Shared logic must remain in shared libraries.
7. Do NOT refactor completed phases unless explicitly asked.
8. Do NOT simplify architecture “for convenience”.

Your task:

- Continue from Phase 4 of PROFILE-MFE-IMPLEMENTATION-PLAN.md.
- Start with Task 4.1: Integrating Profile MFE into the shell app routing.
- Make minimal, incremental changes.
- After completing each task, STOP and summarize what was changed.

Definition of success:

- The Profile MFE loads correctly at /profile via Module Federation.
- No existing tests break.
- No architectural rules are violated.

If any ambiguity exists:

- Ask for clarification instead of making assumptions.
