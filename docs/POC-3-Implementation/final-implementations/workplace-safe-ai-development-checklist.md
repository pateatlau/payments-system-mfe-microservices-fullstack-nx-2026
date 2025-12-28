# Workplace-Safe AI Development Checklist
## Ultra-Atomic Execution Without Agentic AI

This checklist is designed for **workplace projects** where:
- Cursor / Windsurf / Claude Code are NOT allowed
- Copilot / Amazon Q (autocomplete-style AI) IS allowed
- You want to preserve discipline, safety, and predictability

Use this **privately** as your execution guardrail.

---

## SECTION 1 — Pre-Coding Checklist (MOST IMPORTANT)

Complete **all items** before touching the codebase.

### Task Definition
- [ ] I am working on **exactly one task**
- [ ] The task has a **clear start and end**
- [ ] I can describe the task in one sentence

### Scope Control
- [ ] I know **exactly which files** I expect to modify
- [ ] I know which files are **explicitly out of scope**
- [ ] I am not mixing infra + code + tests unless required

### Risk Awareness
- [ ] I understand what could break if this task is wrong
- [ ] I know how to **revert** this task if needed
- [ ] I know how to **verify** correctness

🚫 If any box is unchecked → STOP and clarify.

---

## SECTION 2 — Coding Checklist (While Writing Code)

Use Copilot / Amazon Q **only as an assistant**, never as a driver.

### AI Usage Rules
- [ ] I write the function signature and intent myself
- [ ] AI suggestions are reviewed line-by-line
- [ ] I reject suggestions that touch unrelated files
- [ ] I reject suggestions that refactor existing logic
- [ ] I reject suggestions that “clean up” code

### Change Discipline
- [ ] Each change maps directly to the task
- [ ] No speculative improvements
- [ ] No dependency changes
- [ ] No stylistic rewrites

Rule of thumb:
> If I wouldn’t accept this blindly from a junior dev, I don’t accept it from AI.

---

## SECTION 3 — Verification Checklist (NON-NEGOTIABLE)

### Automated Verification
- [ ] Unit tests run and pass
- [ ] Integration tests run (if applicable)
- [ ] No unrelated tests were modified

### Manual Verification
- [ ] I manually exercised the changed behavior
- [ ] Edge cases considered
- [ ] Failure paths tested (where applicable)

🚫 Never rely on “looks correct”.

---

## SECTION 4 — PR Preparation Checklist

Before opening a pull request:

### PR Scope
- [ ] PR implements **one task only**
- [ ] No unrelated changes included
- [ ] No refactors hidden in the diff

### PR Description Template (Recommended)

Use something like:

```
Scope:
- Implements Task <X> only

Changes:
- <file>: <what changed>

Out of Scope:
- No refactors
- No dependency changes

Verification:
- Tests run: <list>
- Manual checks: <list>
```

---

## SECTION 5 — Review-Time Discipline

During code review:

- [ ] I can explain every line I changed
- [ ] I can explain why no other files were touched
- [ ] I can explain rollback steps
- [ ] I resist scope creep requests politely

If review feedback expands scope:
- [ ] Create a FOLLOW-UP task instead of expanding this PR

---

## SECTION 6 — Post-Merge Reflection (Optional but Powerful)

After merge:

- [ ] Did the task behave as expected?
- [ ] Was verification sufficient?
- [ ] Did AI help or hinder?
- [ ] What would I do differently next time?

This improves future execution quality.

---

## FINAL PRINCIPLES (MEMORIZE THESE)

- Small changes beat fast changes
- Predictability beats cleverness
- Discipline beats heroics
- Debugging is more expensive than planning
- AI amplifies habits — good or bad

---

## ONE-SENTENCE RULE

> “I control scope; AI helps with keystrokes.”

Keep this checklist nearby. It replaces `.cursorrules` when tools are restricted.
