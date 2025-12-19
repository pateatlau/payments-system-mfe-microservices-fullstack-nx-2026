# Rspack Migration - Phase 1 Kickoff Prompt

**Use this prompt to start Phase 1 implementation with Cursor AI**

---

## Context for AI

You are continuing the Rspack migration for a microfrontend POC-1 project. The planning phase is complete and documented.

### Current State

- **Branch:** `poc-1-rspack` (already created, you're on it)
- **Task 1.1:** ✅ Complete (branch created)
- **Next Tasks:** 1.2 (Backup), 1.3 (Install Rspack), 1.4 (Install Jest)

### Key Documentation

- **Progress Tracking:** `docs/Rspack-Migration/task-list.md`
- **Detailed Plan:** `docs/Rspack-Migration/rspack-migration-plan.md`
- **Tech Stack Impact:** `docs/Rspack-Migration/rspack-tech-stack-impact.md`
- **Risk Mitigations:** `docs/Rspack-Migration/rspack-risks-mitigations.md`

---

## Prompt

```
I'm starting Phase 1 of the Rspack migration. Please:

1. **Read the migration documentation:**
   - `docs/Rspack-Migration/task-list.md` - Check current progress
   - `docs/Rspack-Migration/rspack-migration-plan.md` - Phase 1 detailed tasks
   - Read current `package.json` to understand existing dependencies

2. **Execute Phase 1 remaining tasks:**

   **Task 1.2: Backup Current Configuration**
   - Create `.backup/vite-configs/` directory
   - Copy all `vite.config.mts` files from apps and libs
   - Document current Vite-related dependencies from package.json
   - Create backup of nx.json (if has custom targets)

   **Task 1.3: Install Rspack Dependencies**
   - Install @nx/rspack plugin
   - Install @rspack/core and @rspack/dev-server
   - Install postcss-loader (for Tailwind CSS)
   - Install @swc/core (if not already installed)
   - Verify no dependency conflicts

   **Task 1.4: Install Jest Testing Framework**
   - Install jest, @types/jest, ts-jest
   - Install jest-environment-jsdom
   - Install @testing-library/jest-dom (if not already installed)
   - Verify React Testing Library compatibility

3. **Update documentation after each task:**
   - Mark tasks complete in `task-list.md`
   - Add any notes about deviations or issues

4. **Commit after Phase 1 completion:**
   - Ask for confirmation before committing
   - Use conventional commit format

**Important Rules:**
- Follow `.cursorrules` for project conventions
- Ask for confirmation before proceeding to Phase 2
- Document any blockers in the Blockers section of task-list.md
- Do NOT start Phase 2 (Core Bundler Migration) in this session

**Expected Deliverables:**
- Backup files created in `.backup/` directory
- All Rspack dependencies installed
- All Jest dependencies installed
- task-list.md updated with Task 1.2, 1.3, 1.4 marked complete
- Git commit with Phase 1 changes

Let's start with Task 1.2 - Backup Current Configuration.
```

---

## Success Criteria for Phase 1

- [ ] `.backup/vite-configs/` contains all Vite config files
- [ ] `@nx/rspack` installed
- [ ] `@rspack/core` and `@rspack/dev-server` installed
- [ ] `postcss-loader` installed
- [ ] `@swc/core` installed (or verified existing)
- [ ] Jest and related dependencies installed
- [ ] `task-list.md` updated (Tasks 1.2, 1.3, 1.4 complete)
- [ ] Phase 1 committed to `poc-1-rspack` branch

---

## Notes

- **Estimated Duration:** 1 day (or less)
- **Risk Level:** Low
- **Rollback:** Simply delete `.backup/` and run `pnpm install` with original package.json

---

## After Phase 1 Completion

Once Phase 1 is verified complete, use the Phase 2 kickoff prompt to continue with Core Bundler Migration.
