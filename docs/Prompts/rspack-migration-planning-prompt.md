# Rspack Migration Planning - New Session Prompt

Use this prompt when starting a new chat session to plan the Vite to Rspack migration.

---

## Context

**Current State:**
- POC-1 is complete with Vite 6.x + Module Federation v2
- Module Federation v2 works in preview mode (not dev mode)
- HMR not available during development (requires rebuild + refresh)
- All MFEs (shell, auth-mfe, payments-mfe) working correctly

**Goal:**
- Plan migration from Vite to Rspack
- Evaluate Rspack for better HMR support with Module Federation
- Create implementation plan for migration
- Document migration strategy and considerations

---

## Standard Rspack Migration Planning Prompt

```
I'm starting a new session to plan the Vite to Rspack migration. Please:

1. **Read Context:**
   - Read `docs/POC-1-Implementation/post-poc-1.md` - Section "Decision Points for POC-2" → "Rspack Migration"
   - Read `docs/POC-1-Implementation/poc-1-completion-summary.md` - Section "Known Limitations" → "HMR Not Available"
   - Read `docs/POC-1-Implementation/developer-workflow.md` - Understand current Vite workflow
   - Review memories about Rspack migration learnings from POC-1

2. **Understand Current State:**
   - Current bundler: Vite 6.x with @module-federation/vite
   - Module Federation v2 working in preview mode
   - HMR limitation: Not available (requires build → preview → refresh)
   - All MFEs working: shell (4200), auth-mfe (4201), payments-mfe (4202)

3. **Research Rspack:**
   - Research Rspack compatibility with Module Federation v2
   - Research Rspack HMR support with Module Federation
   - Research Rspack + Nx integration
   - Research Rspack + Tailwind CSS v4 compatibility
   - Research migration effort and complexity

4. **Create Migration Plan:**
   - Create new branch for Rspack migration planning
   - Document Rspack research findings
   - Create implementation plan for migration
   - Document migration strategy
   - Identify risks and mitigations
   - Create rollback plan

5. **Follow Rules:**
   - Follow all rules in .cursorrules
   - Create documentation in appropriate location
   - Ask for confirmation before major decisions
   - Document all findings and decisions

**Key Considerations:**
- Better HMR support with Module Federation (primary goal)
- Faster builds (secondary benefit)
- Migration effort vs. benefits
- Compatibility with existing stack (Nx, Tailwind v4, Module Federation v2)
- Rollback strategy if migration fails

Let's start planning the Rspack migration!
```

---

## Alternative: Research-First Approach

If you want to start with research before planning:

```
I'm starting a new session to research Rspack for migration from Vite. Please:

1. **Research Rspack:**
   - Rspack compatibility with Module Federation v2
   - Rspack HMR support with Module Federation
   - Rspack + Nx integration
   - Rspack + Tailwind CSS v4 compatibility
   - Rspack vs. Vite comparison for our use case

2. **Document Findings:**
   - Create research document with findings
   - Compare Rspack vs. Vite for our specific needs
   - Identify pros/cons of migration
   - Document compatibility concerns

3. **Provide Recommendation:**
   - Should we proceed with migration?
   - What are the risks?
   - What is the estimated effort?
   - What is the rollback strategy?

**Context:**
- Current: Vite 6.x + Module Federation v2 (preview mode only, no HMR)
- Goal: Better HMR support with Module Federation
- All MFEs working correctly with Vite

Let's research Rspack!
```

---

## Alternative: Implementation Plan Creation

If research is already done and you want to create the implementation plan:

```
I'm starting a new session to create the Rspack migration implementation plan. Please:

1. **Review Research:**
   - Read any existing Rspack research documents
   - Review Rspack migration considerations from post-poc-1.md
   - Understand current Vite configuration

2. **Create Implementation Plan:**
   - Create detailed migration plan document
   - Break down into phases/tasks
   - Identify dependencies and prerequisites
   - Document migration steps
   - Create rollback plan
   - Document testing strategy

3. **Documentation:**
   - Create migration plan in appropriate location
   - Document all steps and considerations
   - Create task list for migration
   - Document risks and mitigations

**Context:**
- Current: Vite 6.x + Module Federation v2
- Target: Rspack + Module Federation v2 (with HMR support)
- Goal: Better developer experience with HMR

Let's create the migration plan!
```

---

## Key Files to Reference

### Current State Documentation

1. **POC-1 Completion:**
   - `docs/POC-1-Implementation/post-poc-1.md` - Decision points and migration considerations
   - `docs/POC-1-Implementation/poc-1-completion-summary.md` - Known limitations (HMR)
   - `docs/POC-1-Implementation/developer-workflow.md` - Current Vite workflow

2. **Architecture:**
   - `docs/References/mfe-poc1-architecture.md` - Current architecture
   - `docs/References/mfe-poc1-tech-stack.md` - Current tech stack

3. **Module Federation:**
   - `docs/POC-1-Implementation/developer-workflow.md` - MF v2 configuration
   - Module Federation configuration in `apps/*/vite.config.mts`

### Memories to Review

- Key learnings from POC-1 about Tailwind v4 in monorepos
- Key learnings from POC-1 about Module Federation testing
- Key learnings from POC-1 about MF asset paths
- Key learnings from POC-1 about MF dev vs build mode

---

## Expected Deliverables

After planning session, you should have:

1. **Research Document:**
   - Rspack compatibility analysis
   - HMR support evaluation
   - Migration effort estimation
   - Risk assessment

2. **Implementation Plan:**
   - Detailed migration steps
   - Task breakdown
   - Testing strategy
   - Rollback plan

3. **Decision Document:**
   - Go/No-Go recommendation
   - Rationale
   - Trade-offs
   - Timeline

---

## Tips

1. **Start with Research:**
   - Don't assume Rspack will solve all problems
   - Verify HMR support with Module Federation v2
   - Check Nx compatibility

2. **Create a Branch:**
   - Use separate branch for migration planning
   - Keep main branch stable
   - Easy to abandon if migration doesn't work

3. **Document Everything:**
   - Research findings
   - Decisions and rationale
   - Migration steps
   - Rollback procedures

4. **Test Early:**
   - Create proof-of-concept if possible
   - Test HMR with Module Federation
   - Verify all features work

---

**Last Updated:** 2026-01-XX  
**Status:** Ready for Use

