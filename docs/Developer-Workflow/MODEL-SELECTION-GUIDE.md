# Cursor Model Selection Guide

**Purpose:** Guide for selecting the right Cursor model when Auto mode gets stuck  
**Audience:** Developer reference

---

## Model Hierarchy (Best Capability → Fastest)

### 1. Claude Opus (Most Capable) ⭐⭐⭐⭐⭐

**Best for:** Complex problems, stuck tasks, architectural decisions

**When to use:**

- Auto mode has failed multiple times
- Complex debugging required
- Architectural decisions needed
- Multi-step reasoning required
- Large context understanding needed

**Trade-offs:**

- ✅ Highest capability
- ✅ Best reasoning
- ✅ Handles complex tasks
- ❌ Slower response time
- ❌ Higher token usage

**Use case:** "I've tried Auto 3 times, still stuck on Module Federation configuration"

---

### 2. GPT-4 / GPT-4 Turbo ⭐⭐⭐⭐

**Best for:** Complex coding tasks, debugging, problem-solving

**When to use:**

- Auto mode struggling with code generation
- Need better code understanding
- Complex TypeScript issues
- Module Federation configuration problems
- Build/compilation errors

**Trade-offs:**

- ✅ Very capable
- ✅ Good code understanding
- ✅ Fast reasoning
- ⚠️ May need more context
- ⚠️ Token usage moderate

**Use case:** "Auto can't fix this TypeScript error, need better code analysis"

---

### 3. Claude Sonnet ⭐⭐⭐⭐

**Best for:** Balanced capability and speed

**When to use:**

- Auto mode needs a boost
- Moderate complexity tasks
- Good middle ground
- When Opus is too slow

**Trade-offs:**

- ✅ Good capability
- ✅ Balanced speed
- ✅ Reliable
- ⚠️ Not as capable as Opus
- ⚠️ Not as fast as Auto

**Use case:** "Auto is close but not quite right, need slightly better reasoning"

---

### 4. Auto (Default) ⭐⭐⭐

**Best for:** Most tasks, daily work

**When to use:**

- Normal implementation tasks
- Following implementation plan
- Standard code generation
- Most POC-0 tasks

**Trade-offs:**

- ✅ Fast
- ✅ Cost-effective
- ✅ Good for most tasks
- ❌ May struggle with complex tasks
- ❌ May get stuck on difficult problems

---

## Decision Tree: When to Switch Models

```
Is Auto mode stuck?
│
├─ Yes, after 1 attempt
│  └─ Try again with Auto (might be temporary)
│
├─ Yes, after 2-3 attempts
│  └─ Switch to Claude Sonnet or GPT-4
│
├─ Yes, after 3+ attempts
│  └─ Switch to Claude Opus
│
└─ Complex task from start?
   └─ Start with Claude Opus or GPT-4
```

---

## Recommended Strategy for POC-0

### Default: Auto Mode

- **Use for:** 90% of tasks
- **Reason:** Most POC-0 tasks are straightforward
- **Switch if:** Stuck after 2-3 attempts

### When Auto Gets Stuck

**Step 1: Try Claude Sonnet or GPT-4**

- Good balance of capability and speed
- Often resolves the issue
- Use for: Module Federation config, complex TypeScript, build issues

**Step 2: If Still Stuck → Claude Opus**

- Maximum capability
- Use for: Architectural problems, complex debugging, multi-step reasoning

**Step 3: After Resolving → Switch Back to Auto**

- Continue with Auto for remaining tasks
- Save Opus for truly complex problems

---

## Specific Scenarios

### Scenario 1: Module Federation Configuration Issues

**Problem:** Auto can't configure Module Federation v2 correctly

**Solution:**

1. Switch to **Claude Opus** or **GPT-4**
2. Provide full context: vite.config.ts, error messages
3. Ask for step-by-step fix
4. Switch back to Auto after resolved

**Why:** Module Federation requires deep understanding of build systems

---

### Scenario 2: TypeScript Type Errors

**Problem:** Auto keeps suggesting `any` type or can't fix complex types

**Solution:**

1. Switch to **GPT-4** or **Claude Sonnet**
2. Show full error message
3. Provide type definitions context
4. Ask for proper type solution

**Why:** TypeScript requires good code understanding

---

### Scenario 3: Build/Compilation Errors

**Problem:** Auto can't resolve build errors

**Solution:**

1. Switch to **GPT-4** or **Claude Opus**
2. Provide full error log
3. Include relevant config files
4. Ask for systematic debugging

**Why:** Build errors need comprehensive analysis

---

### Scenario 4: Architecture Decisions

**Problem:** Auto suggests wrong approach or can't decide

**Solution:**

1. Switch to **Claude Opus**
2. Reference ADRs and architecture docs
3. Ask for architectural reasoning
4. Document decision in ADR

**Why:** Architecture needs deep reasoning

---

### Scenario 5: Complex Multi-Step Tasks

**Problem:** Auto loses track of multi-step process

**Solution:**

1. Switch to **Claude Opus**
2. Break down into smaller steps
3. Reference implementation plan explicitly
4. Ask for step-by-step execution

**Why:** Complex tasks need better context management

---

## Best Practices

### 1. Start with Auto

- Use Auto for most tasks
- It's fast and cost-effective
- Only switch when stuck

### 2. Give Auto 2-3 Chances

- First failure might be temporary
- Second attempt often works
- Third attempt confirms if stuck

### 3. Switch Strategically

- Don't switch too early (waste tokens)
- Don't wait too long (waste time)
- Switch after 2-3 failed attempts

### 4. Provide Full Context When Switching

- Include error messages
- Show relevant code
- Reference documentation
- Explain what was tried

### 5. Switch Back to Auto After Resolving

- Don't stay on expensive models
- Auto is fine for most tasks
- Save powerful models for complex problems

### 6. Document Complex Solutions

- If Opus solved it, document in task-list.md
- Add notes about the solution
- Help future sessions understand

---

## Model Selection Cheat Sheet

| Situation                | Recommended Model     | Reason               |
| ------------------------ | --------------------- | -------------------- |
| Normal task              | Auto                  | Fast, cost-effective |
| Stuck after 2 attempts   | Claude Sonnet / GPT-4 | Better reasoning     |
| Stuck after 3+ attempts  | Claude Opus           | Maximum capability   |
| Module Federation issues | Claude Opus / GPT-4   | Complex build config |
| TypeScript errors        | GPT-4 / Claude Sonnet | Code understanding   |
| Build errors             | GPT-4 / Claude Opus   | Systematic debugging |
| Architecture decisions   | Claude Opus           | Deep reasoning       |
| Multi-step tasks         | Claude Opus           | Context management   |

---

## Cost vs Capability Trade-off

### Auto Mode

- **Cost:** Lowest
- **Speed:** Fastest
- **Capability:** Good for 90% of tasks
- **Best for:** Daily work, standard tasks

### Claude Sonnet / GPT-4

- **Cost:** Moderate
- **Speed:** Moderate
- **Capability:** Very good
- **Best for:** When Auto struggles

### Claude Opus

- **Cost:** Highest
- **Speed:** Slower
- **Capability:** Best
- **Best for:** Complex problems, stuck tasks

---

## Example Workflow

### Normal Task Flow

```
1. Start with Auto
   ↓
2. Task completes successfully
   ✅ Done
```

### Stuck Task Flow

```
1. Start with Auto
   ↓
2. Task fails
   ↓
3. Try Auto again (2nd attempt)
   ↓
4. Still fails
   ↓
5. Switch to Claude Sonnet / GPT-4
   ↓
6. Task completes
   ↓
7. Switch back to Auto for next task
   ✅ Continue with Auto
```

### Complex Task Flow

```
1. Start with Auto
   ↓
2. Task fails (complex issue detected)
   ↓
3. Switch directly to Claude Opus
   ↓
4. Task completes
   ↓
5. Document solution in task-list.md
   ↓
6. Switch back to Auto
   ✅ Continue with Auto
```

---

## When NOT to Switch Models

### Don't Switch If:

1. **First attempt failed** - Try Auto again first
2. **Simple syntax error** - Auto can usually fix these
3. **Missing context** - Provide more context to Auto first
4. **Unclear requirements** - Clarify requirements before switching
5. **Just started task** - Give Auto a fair chance

### Switch If:

1. **Multiple attempts failed** - 2-3 attempts with Auto
2. **Complex problem** - Architecture, build config, etc.
3. **Time-sensitive** - Need solution quickly
4. **Critical blocker** - Blocking other work

---

## Tips for Better Results

### When Switching to More Capable Model:

1. **Provide full context:**

   - Error messages
   - Relevant code files
   - What was tried
   - Expected outcome

2. **Reference documentation:**

   - Implementation plan
   - Architecture docs
   - Task list
   - Project rules

3. **Be specific:**

   - What exactly is the problem?
   - What have you tried?
   - What should happen?

4. **Ask for explanation:**
   - Why the solution works
   - What was wrong
   - How to prevent in future

---

## Summary

### Quick Reference

**Default:** Auto mode (90% of tasks)

**When Auto gets stuck:**

1. **2-3 attempts failed** → Switch to Claude Sonnet / GPT-4
2. **Still stuck** → Switch to Claude Opus
3. **Resolved** → Switch back to Auto

**Complex tasks from start:**

- Module Federation → Claude Opus / GPT-4
- Architecture decisions → Claude Opus
- Complex debugging → GPT-4 / Claude Opus

### Remember

- ✅ Start with Auto
- ✅ Give Auto 2-3 chances
- ✅ Switch strategically
- ✅ Provide full context when switching
- ✅ Switch back to Auto after resolving
- ✅ Document complex solutions

---

**Last Updated:** 2026-01-XX  
**Status:** Active Reference Guide
