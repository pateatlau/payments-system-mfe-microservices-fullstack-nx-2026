# Continuation Prompt for Resuming Work

Use this prompt when resuming work in a new tab, new session, or after restarting Cursor.

---

## Standard Continuation Prompt

```
I'm resuming POC-0 implementation. Please:

1. Read `docs/POC-0-Implementation/task-list.md` to understand current progress
2. Identify the next task that needs to be worked on
3. Reference `docs/POC-0-Implementation/implementation-plan.md` for detailed steps
4. Continue from where we left off

Follow all rules in .cursorrules, especially:
- Ask for confirmation before proceeding to next task
- Update task-list.md after completing each task
- Stay within POC-0 scope

Let's continue!
```

---

## Alternative: Specific Task Continuation

If you know the specific task number:

```
I'm resuming POC-0 implementation. Please:

1. Check `docs/POC-0-Implementation/task-list.md` for current status
2. Continue with Task [X.X]: [Task Name]
3. Reference `docs/POC-0-Implementation/implementation-plan.md` for Task [X.X] details
4. Follow all rules in .cursorrules

Let's continue with Task [X.X]!
```

---

## Alternative: After Interruption

If work was interrupted mid-task:

```
I'm resuming POC-0 implementation. Please:

1. Check `docs/POC-0-Implementation/task-list.md` for current status
2. Review what was completed in the current task
3. Continue from where we left off
4. Reference `docs/POC-0-Implementation/implementation-plan.md` for remaining steps

Let's continue!
```

---

## What Cursor Will Do

When you use these prompts, Cursor will:

- ✅ Read `.cursorrules` (always available)
- ✅ Read `task-list.md` to see progress
- ✅ Read `implementation-plan.md` for task details
- ✅ Understand current state from files
- ✅ Continue from the right place

---

## Tips

1. **Always reference task-list.md** - It's the source of truth for progress
2. **Be specific** - Mention task numbers if you know them
3. **Trust the files** - Cursor reads files, not chat history
4. **Update task-list.md** - Keep it current so resuming is easy
