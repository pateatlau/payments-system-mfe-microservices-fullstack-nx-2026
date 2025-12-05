# Context Persistence & Multi-Session Best Practices

**Purpose:** Guide for continuing work across new tabs, sessions, and restarts

---

## What Persists Automatically

### ✅ Always Available (No Action Needed)

1. **`.cursorrules`**

   - Always included in every prompt
   - Works in new tabs, new sessions, after reboots
   - No manual action required

2. **Files in Workspace**

   - `task-list.md` - Progress tracking
   - `implementation-plan.md` - Detailed steps
   - All code files
   - All documentation

3. **Codebase Index**
   - Cursor indexes your code automatically
   - Available for code understanding
   - Updates as code changes

---

## What Doesn't Persist

### ❌ Not Automatically Available

1. **Chat History**

   - Previous conversation messages
   - Context from prior chats
   - In-memory conversation state

2. **Previous Session Context**
   - Details discussed in previous sessions
   - Decisions made in conversation
   - Workarounds or temporary solutions

---

## Best Practices

### 1. Starting a New Tab

**Use the continuation prompt:**

```
I'm resuming POC-0 implementation. Please:

1. Read `docs/POC-0-Implementation/task-list.md` to understand current progress
2. Identify the next task that needs to be worked on
3. Reference `docs/POC-0-Implementation/implementation-plan.md` for detailed steps
4. Continue from where we left off

Follow all rules in .cursorrules.
```

**Why this works:**

- Cursor reads `task-list.md` to see what's done
- Cursor reads `implementation-plan.md` for next steps
- `.cursorrules` provides all the rules
- No chat history needed

---

### 2. Starting a New Session (After Closing Cursor)

**Same as new tab:**

- Use the continuation prompt
- Cursor will read files to understand state
- Task list is the source of truth

**Additional tip:**

- Before closing Cursor, ensure `task-list.md` is up to date
- This makes resuming easier

---

### 3. After Rebooting Computer

**Same process:**

- Use the continuation prompt
- Cursor reads files (they persist on disk)
- Codebase index rebuilds automatically

**No special action needed** - files persist across reboots.

---

### 4. Switching Between Tasks

**If you want to work on a specific task:**

```
I'm resuming POC-0 implementation. Please:

1. Check `docs/POC-0-Implementation/task-list.md` for current status
2. Continue with Task [X.X]: [Task Name]
3. Reference `docs/POC-0-Implementation/implementation-plan.md` for Task [X.X] details

Let's continue with Task [X.X]!
```

---

## How Cursor Understands Context

### File-Based Context (Persists)

1. **`.cursorrules`** → Always loaded
2. **`task-list.md`** → Shows progress, next task
3. **`implementation-plan.md`** → Detailed steps
4. **Code files** → Current implementation state

### Conversation Context (Doesn't Persist)

- Previous chat messages
- Discussion details
- Temporary decisions

**Solution:** Document important decisions in:

- `task-list.md` (Notes section)
- ADRs (`docs/adr/`)
- Code comments

---

## Recommended Workflow

### During Work Session

1. **Work on tasks** following implementation plan
2. **Update task-list.md** after each task
3. **Add notes** if you deviate from plan
4. **Commit regularly** (with confirmation)

### When Resuming Work

1. **Open Cursor**
2. **Use continuation prompt** (see `docs/Prompts/POC-0/continuation-prompt.md`)
3. **Cursor reads task-list.md** to understand state
4. **Continue from next task**

### Before Closing Cursor

1. **Ensure task-list.md is updated**
2. **Commit any uncommitted work** (with confirmation)
3. **Note any blockers** in task-list.md

---

## Key Files for Context

### Primary Context Sources

1. **`task-list.md`** - Current progress, next task
2. **`implementation-plan.md`** - Detailed steps
3. **`.cursorrules`** - Rules and guidelines
4. **Code files** - Actual implementation

### Secondary Context Sources

1. **`project-rules-cursor.md`** - Detailed rules (referenced)
2. **Architecture docs** - Overall design
3. **ADRs** - Architectural decisions

---

## Troubleshooting

### Cursor Doesn't Remember Progress

**Solution:**

- Check `task-list.md` is up to date
- Use continuation prompt explicitly
- Reference specific task numbers

### Cursor Suggests Wrong Task

**Solution:**

- Verify `task-list.md` status is correct
- Explicitly state the task number
- Check implementation plan for task order

### Missing Context from Previous Session

**Solution:**

- Important decisions should be in `task-list.md` Notes
- Document in ADRs if architectural
- Add code comments for implementation details

---

## Summary

✅ **What Works:**

- `.cursorrules` always available
- Files persist (task-list.md, implementation-plan.md)
- Codebase index persists
- File-based context is reliable

❌ **What Doesn't Work:**

- Chat history across sessions
- In-memory conversation context

✅ **Best Practice:**

- Keep `task-list.md` updated
- Use continuation prompts
- Document important decisions in files
- Trust file-based context over chat history

---

**Remember:** Files are the source of truth. Keep them updated, and Cursor will always understand the current state.
