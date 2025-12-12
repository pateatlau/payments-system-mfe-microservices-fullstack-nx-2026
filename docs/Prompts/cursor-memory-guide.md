# Cursor Memory Guide - What Cursor Remembers and Doesn't Remember

**Purpose:** Understand what information Cursor AI retains across sessions and how to effectively resume work in new chats.

---

## What Cursor Remembers (Persistent)

### ✅ Always Available

1. **Repository Files**
   - All files in the workspace are accessible
   - Cursor can read any file when needed
   - File contents are the source of truth

2. **Project Structure**
   - Directory structure
   - File locations
   - Project organization

3. **Codebase Context**
   - All code files
   - Configuration files
   - Documentation files

4. **Git History**
   - Commit history
   - File changes
   - Branch information

### ✅ Explicitly Saved (Memories)

1. **Saved Memories**
   - Memories created using the `update_memory` tool
   - Key learnings and patterns
   - Important decisions and rationale
   - Cross-session knowledge

2. **Memory Examples:**
   - Technical patterns (e.g., "Dependency Injection for MF testing")
   - Configuration learnings (e.g., "Tailwind v4 in monorepos needs PostCSS")
   - Architecture decisions (e.g., "Zustand subscriptions unreliable across MF boundaries")

---

## What Cursor Doesn't Remember (Session-Specific)

### ❌ Not Available in New Chats

1. **Chat History**
   - Previous conversation context
   - Discussion details
   - Step-by-step reasoning from previous sessions
   - In-progress work context

2. **Session State**
   - What was being worked on
   - Current task progress
   - Temporary decisions made in conversation
   - Uncommitted changes context

3. **Implicit Context**
   - "We just fixed X" - Cursor won't know unless documented
   - "Let's continue with Y" - Cursor needs explicit instructions
   - "Remember when we discussed Z" - Not remembered unless in files/memories

---

## How to Bridge the Gap

### 1. Document Everything Important

**In Files:**
- Task progress → `task-list.md`
- Implementation details → `implementation-plan.md`
- Learnings → Documentation files
- Decisions → ADRs (Architecture Decision Records)

**In Memories:**
- Key patterns and solutions
- Important learnings
- Cross-cutting concerns

### 2. Use Continuation Prompts

**Standard Continuation:**
- Reference task-list.md for progress
- Reference implementation-plan.md for details
- Be explicit about what to do next

**Specific Task Continuation:**
- Mention exact task numbers
- Reference specific files
- Provide clear instructions

### 3. Provide Context in New Sessions

**What to Include:**
- Current phase (POC-0, POC-1, POC-2, etc.)
- What was completed
- What needs to be done next
- Any blockers or issues

---

## Best Practices

### ✅ DO

1. **Update Documentation Regularly**
   - Keep `task-list.md` current
   - Update `implementation-plan.md` with completion status
   - Document learnings in appropriate files

2. **Create Memories for Key Learnings**
   - Important patterns
   - Configuration solutions
   - Architecture decisions

3. **Use Explicit Prompts**
   - Reference specific files
   - Mention task numbers
   - Provide clear context

4. **Commit Frequently**
   - Document progress in commits
   - Use descriptive commit messages
   - Tag important milestones

### ❌ DON'T

1. **Don't Assume Context**
   - Cursor doesn't remember previous conversations
   - Always provide explicit context

2. **Don't Rely on Chat History**
   - Information must be in files or memories
   - Chat history is not accessible

3. **Don't Use Vague References**
   - "Continue where we left off" - too vague
   - "Do what we discussed" - not remembered
   - Be specific and explicit

---

## Example: Starting a New Session

### ❌ Bad (Vague)

```
Continue with the implementation.
```

### ✅ Good (Explicit)

```
I'm resuming POC-1 implementation. Please:

1. Read `docs/POC-1-Implementation/task-list.md` to understand current progress
2. Identify the next task that needs to be worked on
3. Reference `docs/POC-1-Implementation/implementation-plan.md` for detailed steps
4. Continue from where we left off

Follow all rules in .cursorrules.
```

---

## Memory Management

### When to Create Memories

**Create memories for:**
- ✅ Reusable patterns (e.g., "Dependency Injection for MF testing")
- ✅ Configuration solutions (e.g., "Tailwind v4 PostCSS setup")
- ✅ Important learnings (e.g., "Zustand subscriptions across MF boundaries")
- ✅ Cross-cutting concerns (e.g., "Module Federation v2 preview mode requirement")

**Don't create memories for:**
- ❌ Task-specific progress (use task-list.md)
- ❌ Implementation details (use implementation-plan.md)
- ❌ Temporary decisions (use ADRs if permanent)

### How to Access Memories

Memories are automatically available to Cursor in new sessions. They appear in the context when relevant to the query.

---

## Summary

**Cursor Remembers:**
- ✅ All repository files
- ✅ Saved memories (explicitly created)
- ✅ Git history

**Cursor Doesn't Remember:**
- ❌ Chat history
- ❌ Session-specific context
- ❌ Implicit discussions

**Solution:**
- ✅ Document everything in files
- ✅ Create memories for key learnings
- ✅ Use explicit continuation prompts
- ✅ Reference specific files and tasks

---

**Last Updated:** 2026-01-XX  
**Status:** Authoritative Guide

