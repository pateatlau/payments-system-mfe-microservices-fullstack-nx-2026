You are continuing an existing implementation.

This project follows a STRICT Universal Web + Mobile Microfrontend (MFE) architecture.
All architectural decisions made so far are FINAL and MUST NOT be changed.

==================================================
MANDATORY RULES INGESTION (NON-NEGOTIABLE)
==================================================

You MUST strictly follow the rules defined in:

docs/POC-3-Implementation/project-rules-ai.md

These rules have the same priority as a system prompt.

Before doing ANY work:

1. Read the file completely.
2. Acknowledge that you understand and will follow the rules.
3. Explicitly confirm ALL of the following:
   - You will NOT perform unrequested or additional tasks.
   - You will STOP after completing the requested task.
   - You will IMMEDIATELY update BOTH documentation files after the task:
     • docs/POC-3-Implementation/task-list.md
     • docs/POC-3-Implementation/implementation-plan.md
   - You will NEVER use emojis.
   - You will NEVER use `any` types.
   - You will use ONLY Tailwind CSS v4 syntax (CRITICAL).
   - You will ask for clarification instead of making assumptions.

If you cannot comply with ALL of the above, say so now.

Violation of ANY rule in project-rules-ai.md is considered a FAILURE.

==================================================
ARCHITECTURAL HARD RULES (DO NOT VIOLATE)
==================================================

1. This is a Module Federation v2 REMOTE.
2. The remote exposes ONLY `ProfilePage`.
3. NO cross-MFE imports.
4. ALL routing is owned by the Shell app (no routing logic inside MFEs).
5. ALL data access goes through existing shared API clients and TanStack Query hooks.
6. Shared logic MUST remain in shared libraries.
7. Do NOT refactor completed phases unless EXPLICITLY asked.
8. Do NOT simplify or bypass architecture “for convenience”.
9. No throw-away code — everything must be production-viable.

==================================================
TASK TO PERFORM (SCOPE-LOCKED)
==================================================

Continue from **Phase 3** of:
PROFILE-MFE-IMPLEMENTATION-PLAN.md

Start with:
**Task 3.6 – Integrate Profile MFE into the Shell App routing**

Scope rules:

- Perform THIS TASK ONLY.
- Make minimal, incremental changes.
- Do NOT perform follow-up tasks.
- Do NOT refactor unrelated code.

==================================================
AFTER TASK COMPLETION (MANDATORY STOP)
==================================================

After completing Task 3.6, you MUST:

1. Update `docs/POC-3-Implementation/PROFILE-MFE-TASK-LIST.md`
   - Mark relevant checkboxes `[x]`
   - Set Status to "Complete"
   - Add completion date
   - Add concise notes

2. Update `docs/POC-3-Implementation/PROFILE-MFE-IMPLEMENTATION-PLAN.md`
   - Mark ALL verification checkboxes `[x]`
   - Mark ALL acceptance criteria
   - Set Status to "Complete"
   - Add completion date
   - Add comprehensive notes
   - Update "Files Created / Modified" section

3. Respond with:
   - A list of files changed
   - A brief summary of what was done
   - A rule-compliance checklist:
     • No emojis used
     • Tailwind v4 only
     • No `any` types
     • Scope respected
     • Docs updated

4. STOP and WAIT for explicit user confirmation before proceeding.

==================================================
DEFINITION OF SUCCESS
==================================================

- Profile MFE loads correctly at `/profile` via Module Federation.
- Route is protected and follows existing Shell patterns.
- No existing tests break.
- No architectural or rule violations occur.

If ANY ambiguity exists at ANY point:
ASK FOR CLARIFICATION.
DO NOT GUESS.
