# Trunk-Based Development Branching Strategy

**Created:** February 9, 2026
**Status:** IMPLEMENTING
**Priority:** High

---

## Executive Summary

This document outlines the migration from GitFlow-style branching (main + develop + feature branches) to **trunk-based development** (TBD). Trunk-based development is an industry best practice that reduces merge complexity, enables continuous integration, and accelerates delivery.

### Current State

| Aspect | Current State |
|--------|---------------|
| Primary branches | `main`, `develop` |
| Feature branches | `feature/**`, `fix/**` |
| CI triggers | Push to main, develop, feature/*, fix/* |
| E2E tests | Run on main and develop only |
| Staging deploy | Triggered by push to `develop` |
| Production deploy | Triggered by push to `main` |

### Target State

| Aspect | Target State |
|--------|--------------|
| Primary branch | `main` only |
| Feature branches | Short-lived (< 2 days), branch from main, merge to main |
| CI triggers | Push to main, pull requests to main |
| E2E tests | Run on main and pull requests |
| Staging deploy | Triggered by push to `main` (automatic) |
| Production deploy | Manual promotion from staging |

---

## Why Trunk-Based Development?

### Benefits

1. **Reduced merge conflicts** - Short-lived branches minimize divergence
2. **Faster feedback loops** - Changes integrated continuously
3. **Simpler CI/CD** - Single source of truth for deployments
4. **Higher code quality** - Frequent small changes are easier to review
5. **Team velocity** - Less time managing branches, more time shipping

### Industry Adoption

Trunk-based development is used by:
- Google (monorepo with TBD)
- Meta (single main branch)
- Netflix (continuous deployment from trunk)
- Spotify (squads merge to trunk)

### Key Practices

1. **Small, frequent commits** - Multiple times per day
2. **Feature flags** - Decouple deployment from release
3. **Comprehensive testing** - CI must catch issues before merge
4. **Code review** - All changes reviewed before merging
5. **Short-lived branches** - Maximum 2 days, ideally hours

---

## Implementation Checklist

### Phase 1: CI/CD Updates

- [x] Update `.github/workflows/ci.yml`:
  - [x] Change push triggers from `main, develop, feature/**, fix/**` to `main` only
  - [x] Change pull_request triggers from `main, develop` to `main` only
  - [x] Update E2E test condition from `main OR develop` to `main` (and PRs)
  - [x] Update frontend test conditions
  - [x] Update backend test conditions
  - [x] Update build job conditions

### Phase 2: Documentation Updates

- [x] Update `docs/CICD.md`:
  - [x] Update "Triggers" section to reflect trunk-based workflow
  - [x] Remove develop branch references
  - [x] Update environment triggers (staging = main, production = manual)
  - [x] Add trunk-based development section

- [x] Update `.github/CICD-PREREQUISITES.md`:
  - [x] Update branch protection section
  - [x] Add trunk-based workflow notes

- [x] Update `CLAUDE.md`:
  - [x] Add trunk-based development workflow section
  - [x] Document feature flag strategy
  - [x] Document commit conventions for TBD

### Phase 3: Branch Cleanup (Post-Implementation)

- [ ] Delete `develop` branch after all work is merged to main
- [ ] Update branch protection rules:
  - [ ] Require pull request reviews for main
  - [ ] Require status checks to pass
  - [ ] Require up-to-date branches before merging
  - [ ] Optionally: Require signed commits

---

## Updated Workflow

### Development Flow

```
Developer                    GitHub                      CI/CD
   │                           │                           │
   │  git checkout -b          │                           │
   │  feature/short-name       │                           │
   │─────────────────────>     │                           │
   │                           │                           │
   │  (work, commit, push)     │                           │
   │─────────────────────>     │  (no CI on feature push)  │
   │                           │                           │
   │                           │                           │
   │  Open/Update PR to main   │                           │
   │─────────────────────>     │  Run full CI + E2E        │
   │                           │─────────────────────>     │
   │                           │                           │
   │  Review + Approve         │                           │
   │<─────────────────────     │                           │
   │                           │                           │
   │  Merge (squash)           │                           │
   │─────────────────────>     │  CI runs on main          │
   │                           │─────────────────────>     │
   │                           │                           │
   │                           │  Deploy to Staging        │  (when CD is implemented)
   │                           │─────────────────────>     │
   │                           │                           │
   │                           │  Manual approval          │  (when CD is implemented)
   │                           │<─────────────────────     │
   │                           │                           │
   │                           │  Deploy to Production     │  (when CD is implemented)
   │                           │─────────────────────>     │
```

### Branch Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/<short-description>` | `feature/add-payment-export` |
| Bug fix | `fix/<issue-or-description>` | `fix/login-redirect` |
| Hotfix | `hotfix/<description>` | `hotfix/critical-payment-bug` |
| Chore | `chore/<description>` | `chore/update-dependencies` |
| Docs | `docs/<description>` | `docs/api-documentation` |

### Commit Message Conventions

Use Conventional Commits for clear change history:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, missing semi colons, etc.
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding tests
- `chore`: Build process or auxiliary tool changes

Examples:
```
feat(payments): add export to CSV functionality
fix(auth): resolve token refresh race condition
docs(api): update authentication endpoint examples
chore(deps): upgrade React to 18.3.1
```

---

## Feature Flag Strategy

For incomplete features that need to be merged to main before they're ready for release:

### Implementation Options

1. **Environment Variables**
   ```typescript
   const FEATURE_FLAGS = {
     ENABLE_NEW_PAYMENT_FLOW: process.env.NX_ENABLE_NEW_PAYMENT_FLOW === 'true',
   };
   ```

2. **Feature Flag Service** (for production)
   - LaunchDarkly
   - Split.io
   - Flagsmith (self-hosted option)

3. **Build-time Flags**
   ```typescript
   // rspack.config.js
   new DefinePlugin({
     'process.env.FEATURE_NEW_CHECKOUT': JSON.stringify(false),
   }),
   ```

### Usage Pattern

```typescript
// In component
function PaymentPage() {
  if (FEATURE_FLAGS.ENABLE_NEW_PAYMENT_FLOW) {
    return <NewPaymentFlow />;
  }
  return <LegacyPaymentFlow />;
}
```

### Feature Flag Lifecycle

1. **Create flag** - Default to `false` in production
2. **Develop behind flag** - Merge incomplete work safely
3. **Enable in staging** - Test in staging environment
4. **Gradual rollout** - Enable for % of users
5. **Full release** - Enable for all users
6. **Clean up** - Remove flag and dead code

---

## Rollback Strategy

### Automated Rollback

If staging smoke tests fail:
1. CI automatically reverts the deployment
2. Previous stable version restored
3. Team notified via Slack/PagerDuty

### Manual Rollback

```bash
# Revert a bad commit
git revert <commit-hash>
git push origin main

# Or revert multiple commits
git revert <oldest-hash>..<newest-hash>
git push origin main
```

### Production Rollback

1. Identify issue in monitoring
2. Click "Rollback" in deployment dashboard
3. Previous container image deployed
4. Post-mortem scheduled

---

## CI/CD Pipeline Changes

### Before (GitFlow)

```yaml
on:
  push:
    branches:
      - main
      - develop
      - 'feature/**'
      - 'fix/**'
  pull_request:
    branches:
      - main
      - develop

# E2E only on main/develop
if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
```

### After (Trunk-Based)

```yaml
on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

# E2E on main and PRs to main
if: github.ref == 'refs/heads/main' || github.event_name == 'pull_request'
```

---

## Environment Mapping

### Before

| Branch | Environment | Trigger |
|--------|-------------|---------|
| develop | Staging | Automatic on push |
| main | Production | Automatic on push |

### After

| Branch | Environment | Trigger |
|--------|-------------|---------|
| main | Staging | Automatic on push |
| main | Production | Manual approval |

### Deployment Flow

```
PR merged to main
       │
       ▼
   ┌───────────────┐
   │   CI Tests    │
   └───────┬───────┘
           │ (pass)
           ▼
   ┌───────────────┐
   │ Deploy Staging│ ◄── Automatic
   └───────┬───────┘
           │
           ▼
   ┌───────────────┐
   │ Staging Tests │
   └───────┬───────┘
           │ (pass)
           ▼
   ┌───────────────┐
   │Manual Approval│
   └───────┬───────┘
           │
           ▼
   ┌───────────────┐
   │Deploy Prod    │
   └───────────────┘
```

---

## Migration Steps

### Step 1: Update CI Workflow

Modify `.github/workflows/ci.yml` to:
- Remove develop from triggers
- Update E2E conditions to include PRs
- Update test/build conditions

### Step 2: Update Documentation

- Update `docs/CICD.md`
- Update `.github/CICD-PREREQUISITES.md`
- Update `CLAUDE.md`

### Step 3: Configure Branch Protection

1. Go to GitHub repo → Settings → Branches
2. Delete `develop` protection rule
3. Update `main` protection rule:
   - ✅ Require pull request reviews (1 reviewer minimum)
   - ✅ Dismiss stale reviews on new commits
   - ✅ Require status checks (ci-status)
   - ✅ Require branches to be up to date
   - ✅ Require linear history (squash merges)

### Step 4: Merge Existing Work

1. Merge any pending PRs to develop
2. Merge develop into main
3. Create this migration PR

### Step 5: Delete Develop Branch

After confirming everything works:
```bash
git push origin --delete develop
```

---

## FAQ

### Q: What about long-running features?

Use feature flags. Merge incomplete work behind a flag so it doesn't affect production.

### Q: How do we handle hotfixes?

Create `hotfix/description` branch from main, fix, PR, merge. Same as any other change but with higher priority.

### Q: What if CI is slow?

- Use Nx Cloud for distributed caching (already enabled)
- Run E2E tests in parallel
- Consider splitting tests across jobs
- Use affected commands for faster feedback

### Q: How do we coordinate releases?

Releases are continuous. Every merge to main goes to staging. Production promotion is manual. No "release trains" or "code freezes".

### Q: What about database migrations?

Migrations should be backwards compatible:
1. Deploy migration (additive changes only)
2. Deploy application code
3. Later: Remove old columns if needed

---

## Related Documents

- `docs/CICD.md` - CI/CD pipeline documentation
- `.github/CICD-PREREQUISITES.md` - Prerequisites checklist
- `CLAUDE.md` - Project conventions and guidelines

---

## Revision History

| Date | Change |
|------|--------|
| 2026-02-09 | Initial plan created |
