# POC-0 Quick Start Guide

**Purpose:** Get started with POC-0 implementation quickly  
**Time:** 10-15 minutes  
**Prerequisites:** Node.js 24.11.x LTS, pnpm 9.x

---

## Prerequisites Checklist

Before starting, verify you have:

- [ ] **Node.js 24.11.x LTS** - Check with `node --version`
- [ ] **pnpm 9.x** - Check with `pnpm --version` (install: `npm install -g pnpm@9`)
- [ ] **Git** - Check with `git --version`
- [ ] **Code Editor** - Cursor IDE (recommended) or VS Code

### Quick Verification

Run the environment verification script:

```bash
./scripts/verify-environment.sh
```

Or manually check:

```bash
node --version    # Should be v24.11.x or higher
pnpm --version    # Should be 9.x or higher
git --version     # Should be installed
```

---

## First-Time Setup (5 minutes)

### Step 1: Verify Environment

```bash
# Run verification script
./scripts/verify-environment.sh
```

**Expected output:** All checks should pass ✅

### Step 2: Review Documentation (Optional but Recommended)

- [ ] Read `docs/POC-0-Implementation/README.md` - Understand the workflow
- [ ] Review `docs/POC-0-Implementation/implementation-plan.md` - See what you'll build
- [ ] Check `docs/POC-0-Implementation/task-list.md` - Understand current state

### Step 3: Verify Git Repository

```bash
# Check git status
git status

# Verify remote is set (if applicable)
git remote -v
```

---

## Starting Implementation (2 minutes)

### Step 1: Open Cursor

1. Open Cursor IDE
2. Open this project folder
3. Verify workspace loads correctly

### Step 2: Start New Chat

**Option A: First Time Starting**

Copy and paste this prompt:

```
I'm ready to start implementing POC-0. Please:

1. Check `docs/POC-0-Implementation/task-list.md` to see the current progress and identify the first task
2. Reference `docs/POC-0-Implementation/implementation-plan.md` for detailed step-by-step instructions
3. Start with Task 1.1: Initialize Nx Workspace

Follow the implementation plan exactly, and update the task-list.md as you complete each task. Remember:

- POC-0 scope only (no backend, routing, state management, auth, Tailwind)
- Production-ready code only (no throw-away code)
- Write tests alongside code
- Follow all rules in .cursorrules

Let's begin!
```

**Option B: Resuming Work**

Copy and paste this prompt:

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

### Step 3: Verify Cursor Understands Context

Cursor should:

- ✅ Reference `task-list.md`
- ✅ Identify next task
- ✅ Reference `implementation-plan.md`
- ✅ Understand POC-0 scope

---

## What Happens Next

### During Implementation

1. **Cursor follows the plan** - Step-by-step from implementation-plan.md
2. **You review changes** - Before approving next task
3. **Cursor updates task-list.md** - After each task completion
4. **Cursor asks for confirmation** - Before proceeding to next task
5. **You approve or request changes** - Control the pace

### Expected Timeline

- **Phase 1:** Workspace Setup (1-2 days)
- **Phase 2:** Shell Application (1 day)
- **Phase 3:** Hello Remote (1 day)
- **Phase 4:** Module Federation (1-2 days)
- **Phase 5:** Shared Libraries (1 day)
- **Phase 6:** Testing Setup (1 day)
- **Phase 7:** Production Builds (1 day)
- **Phase 8:** Documentation (1 day)

**Total:** 1-2 weeks for POC-0

---

## Common Commands

### Nx Commands (After Workspace Setup)

```bash
# Serve applications
nx serve shell              # Start shell app (Port 4200)
nx serve hello-remote      # Start hello remote (Port 4201)

# Run both in parallel
nx run-many --target=serve --projects=shell,hello-remote --parallel

# Build
nx build shell
nx build hello-remote

# Test
nx test shell
nx test hello-remote

# Lint
nx lint shell
nx lint hello-remote
```

### Git Commands

```bash
# Check status
git status

# View changes
git diff

# Commit (Cursor will ask for confirmation)
git add .
git commit -m "feat(poc-0): [Task X.X] - Description"
```

---

## Troubleshooting

### Issue: Environment Verification Fails

**Solution:**

1. Check Node.js version: `node --version`
2. Install/update pnpm: `npm install -g pnpm@9`
3. Verify all tools are in PATH

### Issue: Cursor Doesn't Understand Context

**Solution:**

1. Explicitly reference `task-list.md` in your prompt
2. Mention specific task number
3. Verify `.cursorrules` is in project root

### Issue: Wrong Task Suggested

**Solution:**

1. Check `task-list.md` status is correct
2. Explicitly state the task number you want
3. Review implementation plan for task order

### Issue: Cursor Goes Out of Scope

**Solution:**

1. Remind Cursor: "Remember POC-0 scope only"
2. Reference `.cursorrules` scope section
3. Stop and redirect to correct task

---

## Key Files Reference

### Must Read Before Starting

- **`.cursorrules`** - Always included, contains all rules
- **`docs/POC-0-Implementation/task-list.md`** - Current progress
- **`docs/POC-0-Implementation/implementation-plan.md`** - Detailed steps

### Reference When Needed

- **`docs/POC-0-Implementation/project-rules-cursor.md`** - Detailed rules
- **`docs/mfe-poc0-architecture.md`** - Overall architecture
- **`docs/mfe-poc0-tech-stack.md`** - Technology stack

### Workflow Guides

- **`docs/Developer-Workflow/README-FIRST.md`** - Complete workflow guide
- **`docs/Prompts/POC-0/first-prompt.md`** - Starting prompt
- **`docs/Prompts/POC-0/continuation-prompt.md`** - Resuming prompt

---

## Success Criteria

You'll know POC-0 is complete when:

- ✅ Shell app runs on http://localhost:4200
- ✅ Hello Remote app runs on http://localhost:4201
- ✅ Module Federation v2 works (shell loads remote)
- ✅ Shared dependencies work (no duplicates)
- ✅ HMR works (fast updates)
- ✅ Production builds work
- ✅ TypeScript types work across boundaries
- ✅ Tests pass (60% coverage minimum)
- ✅ All tasks in task-list.md are complete

---

## Next Steps After POC-0

Once POC-0 is complete:

1. **Review deliverables** - Verify all success criteria met
2. **Update documentation** - Document any deviations
3. **Prepare for POC-1** - Review POC-1 architecture docs
4. **Update `.cursorrules`** - Add POC-1 scope when ready

---

## Getting Help

### Documentation

- **Workflow Guide:** `docs/Developer-Workflow/README-FIRST.md`
- **Context Persistence:** `docs/Developer-Workflow/CONTEXT-PERSISTENCE.md`
- **Project Evaluation:** `docs/Developer-Workflow/PROJECT-SETUP-EVALUATION.md`

### Key Sections

- **Task List:** `docs/POC-0-Implementation/task-list.md` → "Overall Progress Summary"
- **Implementation Plan:** `docs/POC-0-Implementation/implementation-plan.md` → Find task by number

---

**Ready to start?** Run `./scripts/verify-environment.sh` and then use the first prompt above!

**Last Updated:** 2026-01-XX  
**Status:** Ready for Implementation
