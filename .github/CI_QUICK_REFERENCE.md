# CI Quick Reference

## Quick Commands

### Local Pre-CI Checks (Run Before Pushing)

```bash
# Run what CI will run - catch issues early!

# 1. Lint check
pnpm nx affected --target=lint --base=main

# 2. Type check
pnpm nx affected --target=typecheck --base=main

# 3. Run tests
pnpm test

# 4. Build check
pnpm nx affected --target=build --base=main

# 5. All at once (recommended before PR)
pnpm nx affected --target=lint,typecheck,test,build --base=main --parallel=3
```

### CI Status Check

```bash
# Check if your branch will pass CI
gh pr checks

# OR view in browser
gh pr view --web
```

## Common CI Scenarios

### Scenario 1: Only Changed Frontend Code

**What CI Runs:**
- ✅ Lint (frontend only)
- ✅ TypeCheck (frontend only)
- ✅ Frontend tests (affected MFE only)
- ❌ Backend tests (skipped)
- ✅ Build (affected MFE only)

**Time:** ~8-12 minutes

### Scenario 2: Only Changed Backend Code

**What CI Runs:**
- ✅ Lint (backend only)
- ✅ TypeCheck (backend only)
- ❌ Frontend tests (skipped)
- ✅ Backend tests (affected service only)
- ✅ Build (affected service only)

**Time:** ~10-15 minutes

### Scenario 3: Changed Shared Library

**What CI Runs:**
- ✅ Lint (all affected projects)
- ✅ TypeCheck (all affected projects)
- ✅ Frontend tests (all MFEs using the lib)
- ✅ Backend tests (all services using the lib)
- ✅ Build (all affected projects)

**Time:** ~20-30 minutes

### Scenario 4: PR to Main/Develop

**What CI Runs:**
- ✅ All checks above
- ✅ **E2E Tests** (additional)
- ✅ Security scans

**Time:** ~30-40 minutes

## Fixing Common CI Failures

### ❌ Lint Failed

```bash
# Fix automatically
pnpm nx affected --target=lint --fix --base=main

# Or manually check
pnpm nx affected --target=lint --base=main
```

### ❌ TypeCheck Failed

```bash
# Check types locally
pnpm nx affected --target=typecheck --base=main

# Common fixes:
# 1. Add missing type imports
# 2. Fix type mismatches
# 3. Update TypeScript paths in tsconfig.base.json
```

### ❌ Tests Failed

```bash
# Run failed tests locally
pnpm nx affected --target=test --base=main

# Run specific test file
pnpm nx test <project-name> --testFile=<file-name>

# Run with coverage to see what's not tested
pnpm nx test <project-name> --coverage
```

### ❌ Build Failed

```bash
# Build locally to see error
pnpm nx affected --target=build --base=main

# Common issues:
# 1. Missing dependencies - run pnpm install
# 2. Import errors - check file paths
# 3. Environment variables - check .env files
```

### ❌ E2E Failed

```bash
# Run E2E locally (requires infrastructure)
pnpm infra:start
pnpm dev:backend &
pnpm dev:all &
pnpm test:e2e

# Check Playwright report
npx playwright show-report
```

## CI Workflow Files

| File | Purpose | Triggers |
|------|---------|----------|
| `.github/workflows/ci.yml` | Main CI pipeline | Push, PR |
| *Future: `deploy-staging.yml`* | Deploy to staging | Merge to develop |
| *Future: `deploy-production.yml`* | Deploy to production | Merge to main |
| *Future: `release.yml`* | Create releases | Tag push |

## GitHub Actions Useful Commands

```bash
# Install GitHub CLI
brew install gh  # macOS
# OR
apt install gh   # Linux

# Authenticate
gh auth login

# View workflow runs
gh run list

# View specific run
gh run view <run-id>

# Watch current run
gh run watch

# Re-run failed jobs
gh run rerun <run-id>

# Download artifacts
gh run download <run-id>
```

## Skipping CI (Use Sparingly!)

Add to commit message to skip CI:

```bash
git commit -m "docs: update README [skip ci]"
```

**When to skip:**
- Documentation-only changes
- README updates
- Comment changes
- `.md` file updates

**When NOT to skip:**
- Code changes
- Configuration changes
- Dependency updates
- Anything that affects functionality

## CI Performance Tips

### 1. Use Affected Commands Locally

```bash
# Don't run everything
pnpm test  # ❌ Runs all tests (slow)

# Run only what changed
pnpm nx affected --target=test --base=main  # ✅ Fast
```

### 2. Leverage Nx Cache

```bash
# Cache is enabled by default
# Clear cache if needed
pnpm nx reset
```

### 3. Make Atomic Commits

```bash
# Bad: One huge commit with many changes
git add .
git commit -m "Fixed everything"

# Good: Separate commits for different changes
git add apps/auth-mfe/
git commit -m "fix(auth): resolve login validation"

git add apps/payments-mfe/
git commit -m "feat(payments): add currency selector"
```

### 4. Run Pre-commit Checks

Create `.husky/pre-commit` (optional):

```bash
#!/bin/sh
pnpm nx affected --target=lint,typecheck --uncommitted --parallel=2
```

## Monitoring CI Health

### Weekly Checks

1. **Success Rate**: Should be >95%
   - Check: Actions tab → Filter by status

2. **Flaky Tests**: Identify and fix
   - Check: Re-run tests multiple times
   - Fix: Add proper waits, improve test isolation

3. **CI Duration**: Should stay consistent
   - Check: Compare run times over weeks
   - Investigate: Sudden increases in time

### Monthly Review

- Review failed runs and common patterns
- Update dependencies (automated via Dependabot)
- Optimize slow tests
- Update CI configuration as needed

## Emergency Procedures

### CI is Completely Broken

```bash
# 1. Check GitHub status
https://www.githubstatus.com/

# 2. Check workflow file syntax
gh workflow view ci.yml

# 3. Revert recent changes to workflow
git revert <commit-hash>

# 4. Disable workflow temporarily
# Settings → Actions → Disable workflow

# 5. Contact GitHub Support if needed
```

### Urgent Hotfix Needs to Deploy

```bash
# 1. Create hotfix branch from main
git checkout main
git checkout -b hotfix/critical-bug

# 2. Make fix and commit
git add .
git commit -m "hotfix: resolve critical production bug"

# 3. Push and create PR
git push -u origin hotfix/critical-bug
gh pr create --base main

# 4. Request urgent review
# Add "urgent" label in GitHub

# 5. Merge immediately after CI passes
gh pr merge --auto --squash
```

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Nx CI Documentation](https://nx.dev/recipes/ci/ci-setup)
- [Playwright CI Documentation](https://playwright.dev/docs/ci)
- [Full CI Setup Guide](.github/CI_SETUP.md)

## Getting Help

1. **Check CI logs**: Most errors are explained in logs
2. **Search GitHub Issues**: Someone likely had same issue
3. **Ask the team**: Share workflow run URL
4. **GitHub Community**: https://github.community/

---

**Last Updated:** December 28, 2025
