# Task-Level Cursor Prompt Templates
## Ultra-Atomic Execution Prompts (MANDATORY FORMAT)

This document defines **copy-paste-safe prompt templates** for executing tasks with Cursor
using the ultra-atomic implementation plans.

These templates assume:
- `.cursorrules` is present and enforced
- Project Rules are set
- One task or sub-task is executed at a time

---

## GENERAL RULES (DO NOT REMOVE FROM PROMPTS)

Always include these instructions verbatim:

- Execute ONLY the specified task or sub-task.
- Do NOT modify files outside the allowed list.
- Do NOT refactor, optimize, or clean up.
- Do NOT proceed beyond the task.
- STOP after completion and verification.

---

# TEMPLATE 1 — Task-Level Execution (Recommended Default)

Use this template to execute a **full task** (e.g. Task 1.1).

```text
You are executing an ultra-atomic task.

SOURCE OF TRUTH:
- implementation-plan-2-phase-X-ultra.md
- Task: X.Y — <TASK NAME>

SCOPE:
- Execute ONLY Task X.Y
- Do NOT execute sub-tasks beyond this task

ALLOWED FILES:
- <explicit file list>

INSTRUCTIONS:
1. Implement ONLY what Task X.Y explicitly requires.
2. Do NOT touch unrelated files.
3. Do NOT refactor existing code.
4. Do NOT introduce new dependencies.
5. Follow the task steps exactly.

VERIFICATION:
- Execute ONLY the verification steps listed for Task X.Y.
- If verification fails, report and STOP.

STOP CONDITION:
- After verification, STOP and wait for further instructions.
```

---

# TEMPLATE 2 — Sub-Task Execution (Most Common)

Use this template for **individual sub-tasks**
(e.g. 1.1.B.2 — Redis Rate Store).

```text
You are executing an ultra-atomic sub-task.

SOURCE OF TRUTH:
- implementation-plan-2-phase-X-ultra.md
- Sub-task: X.Y.<DIMENSION>.<INDEX> — <SUB-TASK NAME>

SCOPE:
- Execute ONLY this sub-task
- Do NOT execute sibling or subsequent sub-tasks

ALLOWED FILES:
- <explicit file list>

INSTRUCTIONS:
1. Implement ONLY what this sub-task explicitly requires.
2. Make the smallest possible change to satisfy the sub-task.
3. Do NOT refactor, rename, or optimize.
4. Do NOT infer next steps.

VERIFICATION:
- Execute ONLY the verification steps for this sub-task (if any).
- If verification fails, report and STOP.

STOP CONDITION:
- STOP after reporting completion.
```

---

# TEMPLATE 3 — Verification-Only Execution

Use this when you want Cursor to **only verify**, not implement.

```text
You are executing verification ONLY.

SOURCE OF TRUTH:
- implementation-plan-2-phase-X-ultra.md
- Task/Sub-task: <REFERENCE>

SCOPE:
- DO NOT modify any code.
- DO NOT create or delete files.

INSTRUCTIONS:
1. Execute ONLY the verification steps listed.
2. Report results clearly.

STOP CONDITION:
- STOP after reporting verification results.
```

---

# TEMPLATE 4 — Investigation / Clarification (NO CODE)

Use this if something is unclear or seems inconsistent.

```text
You are performing investigation ONLY.

SOURCE OF TRUTH:
- implementation-plan-2-phase-X-ultra.md
- Task/Sub-task: <REFERENCE>

SCOPE:
- DO NOT write or modify code.

INSTRUCTIONS:
1. Identify ambiguities, conflicts, or missing information.
2. Propose clarification questions ONLY.

STOP CONDITION:
- STOP after listing questions.
```

---

# TEMPLATE 5 — Rollback / Revert Assistance

Use this if a task caused issues and must be reverted.

```text
You are assisting with rollback.

SCOPE:
- Identify changes made in the last task.
- Propose minimal rollback steps.

INSTRUCTIONS:
1. Do NOT introduce new changes.
2. Do NOT refactor.
3. Focus only on reverting.

STOP CONDITION:
- STOP after rollback plan is described.
```

---

## RECOMMENDED WORKFLOW

1. Pick a task from `tasks-list-2-phase-X-ultra.md`
2. Use TEMPLATE 2 (Sub-task Execution)
3. Verify
4. Commit
5. Repeat

---

## FINAL NOTE

These templates intentionally:
- Reduce Cursor autonomy
- Increase predictability
- Minimize debugging cost

They are designed for **correctness over speed**.
