# Development Workflow Guide - Cursor Implementation

**Purpose:** High-level step-by-step workflow for implementing projects in Cursor  
**Audience:** Developer reference (not for Cursor AI)  
**Version:** 1.0

---

## Table of Contents

1. [Pre-Implementation Setup](#pre-implementation-setup)
2. [Starting Implementation](#starting-implementation)
3. [During Implementation](#during-implementation)
4. [Resuming Work](#resuming-work)
5. [Task Management](#task-management)
6. [Code Review & Commits](#code-review--commits)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## Pre-Implementation Setup

### Step 1: Verify Project Structure

- [ ] Check that all documentation exists:
  - [ ] Architecture documents
  - [ ] Implementation plan
  - [ ] Task list
  - [ ] Project rules
- [ ] Verify `.cursorrules` is configured correctly
- [ ] Ensure all reference documents are in place

### Step 2: Initialize Git Repository

```bash
# Navigate to project root
cd /path/to/project

# Initialize git (if not already done)
git init

# Create .gitignore if needed
# (Check if it exists, create if missing)

# Initial commit
git add .
git commit -m "Initial commit: POC-0 documentation and setup"
```

### Step 3: Create Remote Repository (Optional but Recommended)

```bash
# Create repository on GitHub/GitLab
# Then connect:
git remote add origin <your-repo-url>
git branch -M main  # or poc-0
git push -u origin main
```

### Step 4: Review Implementation Plan

- [ ] Read `docs/POC-0-Implementation/implementation-plan.md`
- [ ] Review `docs/POC-0-Implementation/task-list.md`
- [ ] Understand the scope and phases
- [ ] Note any prerequisites or dependencies

### Step 5: Verify Environment

- [ ] Check Node.js version (24.11.x LTS)
- [ ] Check pnpm version (9.x)
- [ ] Verify required tools are installed
- [ ] Test basic commands work

---

## Starting Implementation

### Step 1: Open Cursor

- [ ] Open Cursor IDE
- [ ] Open project folder
- [ ] Verify workspace is loaded correctly

### Step 2: Start New Chat Session

**Option A: First Time Starting**

- Use prompt from: `docs/Prompts/POC-0/first-prompt.md`

**Option B: Resuming Work**

- Use prompt from: `docs/Prompts/POC-0/continuation-prompt.md`

### Step 3: Verify Cursor Understands Context

- [ ] Cursor should reference `task-list.md`
- [ ] Cursor should identify next task
- [ ] Cursor should reference `implementation-plan.md`
- [ ] Confirm Cursor understands POC-0 scope

### Step 4: Begin First Task

- [ ] Let Cursor start with Task 1.1 (or current task)
- [ ] Monitor progress
- [ ] Review changes as they're made
- [ ] Verify each step before proceeding

---

## During Implementation

### Step 1: Monitor Task Progress

**For Each Task:**

- [ ] Cursor follows implementation plan steps
- [ ] Cursor updates task-list.md after completion
- [ ] Cursor asks for confirmation before next task
- [ ] Review completed work before approving next task

### Step 2: Review Code Changes

**Before Approving Next Task:**

- [ ] Review all code changes
- [ ] Verify tests are written
- [ ] Check TypeScript compiles
- [ ] Ensure no `any` types
- [ ] Verify follows project structure
- [ ] Check naming conventions

### Step 3: Verify Task Completion

**Checklist:**

- [ ] All verification items completed
- [ ] Acceptance criteria met
- [ ] Tests pass
- [ ] Build works
- [ ] Task-list.md updated
- [ ] No errors or warnings

### Step 4: Approve Next Task

- [ ] Review completed task summary
- [ ] Review next task details
- [ ] Confirm you're ready to proceed
- [ ] Give approval to Cursor

### Step 5: Handle Blockers

**If Blocker Encountered:**

- [ ] Document blocker in task-list.md
- [ ] Note what was attempted
- [ ] Ask Cursor for alternative approach
- [ ] Or pause and research solution
- [ ] Update task-list.md with resolution

---

## Resuming Work

### Step 1: Open Cursor

- [ ] Open Cursor IDE
- [ ] Open project folder
- [ ] Check git status (see what changed)

### Step 2: Review Current State

- [ ] Read `docs/POC-0-Implementation/task-list.md`
- [ ] Check "Current Focus" section
- [ ] Review "Overall Progress Summary"
- [ ] Check for any blockers or notes

### Step 3: Start New Chat

- [ ] Open new chat tab
- [ ] Use continuation prompt from `docs/Prompts/POC-0/continuation-prompt.md`
- [ ] Or use specific task prompt if you know the task number

### Step 4: Verify Cursor Understands State

- [ ] Cursor should read task-list.md
- [ ] Cursor should identify next task correctly
- [ ] Cursor should reference implementation plan
- [ ] Confirm Cursor is on the right track

### Step 5: Continue Implementation

- [ ] Let Cursor continue from identified task
- [ ] Monitor progress
- [ ] Review changes
- [ ] Follow "During Implementation" workflow

---

## Task Management

### Updating Task List

**After Each Task Completion:**

- [ ] Cursor updates task-list.md (automatic)
- [ ] Verify status is correct
- [ ] Check completion percentage
- [ ] Review notes section

**Manual Updates (If Needed):**

- [ ] Add notes about deviations
- [ ] Document blockers
- [ ] Update completion dates
- [ ] Adjust status if needed

### Tracking Progress

**Regular Checks:**

- [ ] Review "Overall Progress Summary" in task-list.md
- [ ] Check phase completion percentages
- [ ] Verify deliverables checklist
- [ ] Review blockers section

### Phase Completion

**When Phase Completes:**

- [ ] Verify all phase tasks are complete
- [ ] Review phase completion percentage
- [ ] Check all deliverables
- [ ] Update overall progress
- [ ] Prepare for next phase

---

## Code Review & Commits

### Before Committing

**Verification Checklist:**

- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] Tests pass
- [ ] Production build works
- [ ] No `any` types (unless documented)
- [ ] No throw-away code
- [ ] Tests written alongside code
- [ ] Follows naming conventions
- [ ] Follows project structure

### Commit Process

**When Cursor Proposes Commit:**

1. [ ] Review commit message
2. [ ] Review changed files
3. [ ] Verify changes are correct
4. [ ] Approve or request changes
5. [ ] Cursor executes commit (with approval)

### Commit Strategy

**Recommended:**

- Commit after each major task completion
- Commit after each phase completion
- Commit when reaching milestones
- Commit before closing Cursor (if work done)

**Commit Messages:**

- Follow conventional commits format
- Reference task number
- Be descriptive
- Example: `feat(poc-0): complete task 1.1 - initialize nx workspace`

---

## Troubleshooting

### Cursor Doesn't Remember Progress

**Solution:**

1. Check `task-list.md` is up to date
2. Use continuation prompt explicitly
3. Reference specific task numbers
4. Verify files are saved

### Cursor Suggests Wrong Task

**Solution:**

1. Verify `task-list.md` status is correct
2. Explicitly state the task number
3. Check implementation plan for task order
4. Review "Current Focus" in task-list.md

### Cursor Goes Out of Scope

**Solution:**

1. Remind Cursor of POC-0 scope
2. Reference `.cursorrules` scope section
3. Stop and redirect to correct task
4. Update task-list.md with note

### Build/Test Failures

**Solution:**

1. Review error messages
2. Check Cursor's suggested fixes
3. Verify dependencies are installed
4. Check configuration files
5. Document in task-list.md if blocker

### Type Errors

**Solution:**

1. Don't use `any` type
2. Fix type errors immediately
3. Use proper TypeScript types
4. Reference shared-types library
5. Ask Cursor to fix types properly

---

## Best Practices

### Daily Workflow

1. **Start of Day:**

   - [ ] Open Cursor
   - [ ] Review task-list.md
   - [ ] Use continuation prompt
   - [ ] Verify current state

2. **During Work:**

   - [ ] Monitor Cursor's progress
   - [ ] Review changes before approval
   - [ ] Keep task-list.md updated
   - [ ] Document important decisions

3. **End of Day:**
   - [ ] Ensure task-list.md is updated
   - [ ] Commit any uncommitted work
   - [ ] Note any blockers
   - [ ] Review progress

### Code Quality

- [ ] Follow all rules in `.cursorrules`
- [ ] Write tests alongside code
- [ ] Fix type errors immediately
- [ ] No throw-away code
- [ ] Production-ready code only

### Documentation

- [ ] Keep task-list.md current
- [ ] Document deviations in notes
- [ ] Update ADRs for architectural decisions
- [ ] Add code comments for "why" not "what"

### Communication with Cursor

- [ ] Be explicit about task numbers
- [ ] Reference files explicitly
- [ ] Confirm before proceeding
- [ ] Review before approving
- [ ] Ask questions if unclear

### Git Workflow

- [ ] Commit regularly
- [ ] Use descriptive commit messages
- [ ] Reference task numbers
- [ ] Push to remote regularly
- [ ] Create branches for features (if needed)

---

## Workflow Summary

### Quick Reference

**Starting Work:**

1. Open Cursor
2. Use first-prompt.md or continuation-prompt.md
3. Verify Cursor understands context
4. Begin implementation

**During Work:**

1. Monitor progress
2. Review changes
3. Verify completion
4. Approve next task

**Resuming Work:**

1. Open Cursor
2. Review task-list.md
3. Use continuation prompt
4. Continue implementation

**Before Committing:**

1. Verify all checks pass
2. Review changes
3. Approve commit
4. Push to remote

---

## Key Files Reference

### Primary Files

- **`.cursorrules`** - Always included, contains all rules
- **`task-list.md`** - Source of truth for progress
- **`implementation-plan.md`** - Detailed task steps
- **`project-rules-cursor.md`** - Detailed rules reference

### Prompt Files

- **`first-prompt.md`** - Starting implementation
- **`continuation-prompt.md`** - Resuming work

### Documentation

- **Architecture docs** - Overall design
- **Tech stack docs** - Technology choices
- **ADRs** - Architectural decisions

---

## Checklist Template

### Pre-Implementation Checklist

- [ ] Git repository initialized
- [ ] Remote repository connected (optional)
- [ ] Documentation reviewed
- [ ] Environment verified
- [ ] Ready to start

### Daily Checklist

- [ ] Reviewed task-list.md
- [ ] Used appropriate prompt
- [ ] Verified Cursor understands context
- [ ] Monitored progress
- [ ] Reviewed changes
- [ ] Updated task-list.md (if needed)
- [ ] Committed work (if needed)

### Task Completion Checklist

- [ ] Task completed
- [ ] Verification items checked
- [ ] Acceptance criteria met
- [ ] Tests pass
- [ ] Build works
- [ ] Task-list.md updated
- [ ] Ready for next task

---

## Remember

1. **Files are source of truth** - Keep task-list.md updated
2. **Review before approving** - Don't auto-approve everything
3. **Stay in scope** - POC-0 only, no future features
4. **Production-ready code** - No throw-away code
5. **Test alongside code** - Write tests as you go
6. **Document decisions** - In task-list.md or ADRs
7. **Commit regularly** - With proper messages
8. **Trust but verify** - Review Cursor's work

---

**Last Updated:** 2026-01-XX  
**Status:** Active Reference Guide
