# Rspack Migration Planning - New Session Prompt

Use this prompt when starting a new chat session to plan the Vite to Rspack migration.

---

## Getting Started - Which Prompt Should I Use?

### 🎯 Recommended: Standard Rspack Migration Planning Prompt

**Use this if:** You're starting fresh with no prior research.

**What it does:**
- ✅ Reads all context and current state
- ✅ Conducts comprehensive Rspack research
- ✅ Analyzes tech stack impact for ALL technologies
- ✅ Creates migration plan
- ✅ Documents everything in one session

**Best for:** Most users starting migration planning. Gets you from zero to complete plan in one session.

---

### 🔬 Alternative: Research-First Approach

**Use this if:** You want to do research first, review findings, and then decide whether to proceed with planning.

**What it does:**
- ✅ Conducts Rspack research
- ✅ Analyzes tech stack impact
- ✅ Documents findings
- ✅ Provides recommendation (Go/No-Go)
- ❌ Does NOT create implementation plan

**Best for:** When you want to evaluate feasibility before committing to planning effort.

**Next step after research:** If research is positive, use "Alternative: Implementation Plan Creation" prompt.

---

### 📋 Alternative: Implementation Plan Creation

**Use this if:** Research is already complete and you have a Go decision.

**What it does:**
- ✅ Reviews existing research
- ✅ Creates detailed implementation plan
- ✅ Breaks down into tasks/phases
- ✅ Documents migration steps
- ❌ Does NOT do research (assumes it's done)

**Best for:** Follow-up session after research is complete.

---

### 📊 Workflow Comparison

| Workflow | Sessions | When to Use |
|----------|----------|-------------|
| **Standard Prompt** | 1 session | ✅ **Recommended** - Start here if you have no research |
| **Research-First → Implementation Plan** | 2 sessions | Use if you want to review research before planning |
| **Implementation Plan Only** | 1 session | Use if research is already done |

---

### 🚀 Quick Start Recommendation

**For your situation (no research done yet):**

1. **Start with:** **Standard Rspack Migration Planning Prompt** ✅
   - This will do everything: research + analysis + planning
   - Most efficient approach
   - Gets you a complete plan in one session

2. **If you prefer a two-step approach:**
   - **Step 1:** Use "Research-First Approach" to get findings and recommendation
   - **Step 2:** Review the research, then use "Implementation Plan Creation" if you decide to proceed

**Our recommendation:** Use the **Standard Rspack Migration Planning Prompt** - it's comprehensive and efficient.

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

4. **Analyze Tech Stack Impact:**
   Analyze how Rspack migration will impact the ENTIRE tech stack (positively and negatively):

   **Bundling & Build:**
   - Vite 6.x → Rspack: Impact on dev server, HMR, production builds
   - TypeScript 5.9.x: Compatibility, compilation performance
   - Build performance comparison

   **Module Federation:**
   - @module-federation/enhanced 0.21.6: Compatibility with Rspack
   - Module Federation v2 support in Rspack
   - Remote loading behavior
   - Shared dependencies handling

   **Monorepo & Tooling:**
   - Nx integration: Compatibility, build caching, task execution
   - pnpm 9.x: Package resolution, workspace support
   - Node.js 24.11.x LTS: Compatibility

   **Core Framework:**
   - React 19.2.0: Compatibility, build output
   - React DOM 19.2.0: Runtime behavior

   **Routing:**
   - React Router 7.x: Compatibility, code splitting, lazy loading

   **State Management:**
   - Zustand 4.5.x: Bundle size, runtime behavior, middleware support
   - TanStack Query 5.x: Compatibility, DevTools, caching behavior

   **Styling:**
   - Tailwind CSS 4.0+: Compatibility, PostCSS integration, build performance
   - CSS processing and optimization

   **Forms & Validation:**
   - React Hook Form 7.52.x: Compatibility, bundle size
   - Zod 3.23.x: Runtime validation, bundle size

   **HTTP & Storage:**
   - Axios 1.7.x: Compatibility, bundle size
   - localStorage: No impact (browser API)

   **Error Handling:**
   - react-error-boundary 4.0.13: Compatibility, React 19 support

   **Testing:**
   - Vitest 2.0.x: Compatibility with Rspack (may need alternative)
   - React Testing Library 16.1.x: Compatibility
   - Playwright: No impact (runs in browser)

   **Code Quality:**
   - ESLint 9.x: No impact (runs separately)
   - Prettier 3.3.x: No impact (runs separately)
   - TypeScript ESLint 8.x: No impact (runs separately)

   For each technology, document:
   - ✅ Positive impacts (benefits, improvements)
   - ⚠️ Negative impacts (risks, regressions, breaking changes)
   - 🔄 Neutral/no impact
   - 📝 Migration considerations (config changes, code changes needed)

5. **Create Migration Plan:**
   - Create new branch for Rspack migration planning
   - Document Rspack research findings
   - Create implementation plan for migration
   - Document migration strategy
   - Identify risks and mitigations
   - Create rollback plan

6. **Follow Rules:**
   - Follow all rules in .cursorrules
   - Create documentation in appropriate location
   - Ask for confirmation before major decisions
   - Document all findings and decisions

**Key Considerations:**
- Better HMR support with Module Federation (primary goal)
- Faster builds (secondary benefit)
- Migration effort vs. benefits
- **Comprehensive tech stack impact** (not just bundler, but ALL technologies)
- Compatibility with existing stack (React, React Router, Zustand, TanStack Query, React Hook Form, Zod, Axios, Tailwind v4, Vitest, Nx, Module Federation v2, etc.)
- Testing framework compatibility (Vitest may need alternative with Rspack)
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

2. **Analyze Tech Stack Impact:**
   Analyze how Rspack migration will impact the ENTIRE tech stack:
   - Read `docs/References/mfe-poc1-tech-stack.md` for complete tech stack list
   - For each technology, analyze:
     * Positive impacts (benefits, improvements)
     * Negative impacts (risks, regressions, breaking changes)
     * Neutral/no impact
     * Migration considerations (config changes, code changes)
   - Focus on: React, React Router, Zustand, TanStack Query, React Hook Form, Zod, Axios, Tailwind CSS, Vitest, Nx, and all other technologies in the stack

3. **Document Findings:**
   - Create research document with findings
   - Create comprehensive tech stack impact analysis
   - Compare Rspack vs. Vite for our specific needs
   - Identify pros/cons of migration
   - Document compatibility concerns for ALL technologies

4. **Provide Recommendation:**
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
   - Review tech stack impact analysis
   - Review Rspack migration considerations from post-poc-1.md
   - Understand current Vite configuration

2. **Create Implementation Plan:**
   - Create detailed migration plan document
   - Break down into phases/tasks
   - Identify dependencies and prerequisites
   - Document migration steps for each technology
   - Address tech stack impact findings in migration plan
   - Create rollback plan
   - Document testing strategy for all affected technologies

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

### Tech Stack Reference

1. **Complete Tech Stack:**
   - `docs/References/mfe-poc1-tech-stack.md` - Complete tech stack matrix and detailed breakdown
   - `docs/POC-1-Implementation/packages-and-libraries.md` - All packages and their usage patterns

2. **Current Configurations:**
   - `apps/*/vite.config.mts` - Vite configurations for all apps
   - `apps/*/vitest.config.ts` - Vitest configurations
   - `tailwind.config.js` - Tailwind CSS v4 configuration
   - `nx.json` - Nx workspace configuration

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

2. **Tech Stack Impact Analysis:**
   - Comprehensive analysis of Rspack impact on ALL technologies
   - Positive impacts for each technology
   - Negative impacts/risks for each technology
   - Migration considerations for each technology
   - Compatibility matrix (Rspack vs. Vite for each tech)

3. **Implementation Plan:**
   - Detailed migration steps
   - Task breakdown
   - Technology-specific migration steps
   - Testing strategy (including all affected technologies)
   - Rollback plan

4. **Decision Document:**
   - Go/No-Go recommendation
   - Rationale based on comprehensive analysis
   - Trade-offs (including all tech stack impacts)
   - Timeline
   - Risk mitigation strategies

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
