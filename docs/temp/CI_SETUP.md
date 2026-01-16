# GitHub Actions CI Setup Guide

This document explains the CI pipeline configuration and how to set it up for this project.

## Overview

The CI pipeline consists of 7 jobs that run in parallel and sequence:

```
┌─────────────────────────────────────────────────────────────┐
│                    Pull Request / Push                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
    ┌─────────────────────────────────────────────────────────┐
    │                                                           │
    │  ┌──────────────────┐    ┌──────────────┐               │
    │  │ Lint & TypeCheck │    │ Security     │               │
    │  │                  │    │ Scan         │               │
    │  └────────┬─────────┘    └──────────────┘               │
    │           │                                               │
    │           ▼                                               │
    │  ┌──────────────────┐                                    │
    │  │ Build All        │                                    │
    │  │ Projects         │                                    │
    │  └────────┬─────────┘                                    │
    │           │                                               │
    │  ┌────────┴─────────┐                                    │
    │  │                  │                                    │
    │  ▼                  ▼                                    │
    │  ┌──────────────┐  ┌──────────────┐                    │
    │  │ Frontend     │  │ Backend      │                    │
    │  │ Tests        │  │ Tests        │                    │
    │  └──────────────┘  └──────────────┘                    │
    │           │                  │                           │
    │           └────────┬─────────┘                           │
    │                    │                                     │
    │                    ▼                                     │
    │           ┌──────────────────┐                          │
    │           │ E2E Tests        │ (main/develop only)      │
    │           └──────────────────┘                          │
    │                    │                                     │
    │                    ▼                                     │
    │           ┌──────────────────┐                          │
    │           │ CI Status Check  │                          │
    │           └──────────────────┘                          │
    │                                                           │
    └─────────────────────────────────────────────────────────┘
```

## Jobs Breakdown

### 1. Lint & TypeCheck (15 min)
- Runs ESLint on affected projects
- Runs TypeScript type checking
- Uses Nx affected commands for optimal performance

### 2. Frontend Tests (20 min)
- Runs Jest unit tests for all frontend MFEs
- Generates coverage reports
- Uploads to Codecov (optional)
- Tests: Shell, Auth MFE, Payments MFE, Admin MFE, Profile MFE

### 3. Backend Tests (20 min)
- Spins up PostgreSQL (4 instances), Redis, RabbitMQ in Docker containers
- Generates Prisma clients
- Runs database migrations
- Executes backend unit tests
- Tests: API Gateway, Auth Service, Payments Service, Admin Service, Profile Service

### 4. Build (30 min)
- Builds all affected projects using Nx
- Creates production-ready bundles
- Uploads build artifacts for E2E tests
- Depends on lint-and-typecheck passing

### 5. E2E Tests (30 min)
- **Only runs on main/develop branches**
- Uses Playwright for browser automation
- Starts all backend services and frontend apps
- Tests critical user journeys
- Uploads test reports as artifacts

### 6. Security Scan (10 min)
- Runs Trivy vulnerability scanner
- Checks for known security issues in dependencies
- Uploads results to GitHub Security tab
- Runs npm audit for additional checks

### 7. CI Status Check (1 min)
- Final job that checks if all required jobs passed
- Provides clear pass/fail status
- Used for branch protection rules

## Setup Instructions

### Step 1: Enable GitHub Actions

1. Go to your repository on GitHub
2. Navigate to **Settings → Actions → General**
3. Under "Actions permissions", select "Allow all actions and reusable workflows"
4. Click **Save**

### Step 2: Configure Secrets (Optional for Basic CI)

The basic CI pipeline works without secrets. For full functionality, add these:

**Navigate to: Settings → Secrets and variables → Actions → New repository secret**

#### Optional Secrets:

```bash
# Nx Cloud (for distributed caching - optional, speeds up builds)
NX_CLOUD_ACCESS_TOKEN=<your-nx-cloud-token>

# Codecov (for coverage reports - optional)
CODECOV_TOKEN=<your-codecov-token>
```

### Step 3: Create Branch Protection Rules

**Navigate to: Settings → Branches → Add rule**

#### For `main` branch:
- Branch name pattern: `main`
- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging
  - Required status checks:
    - `Lint & Type Check`
    - `Frontend Tests`
    - `Backend Tests`
    - `Build All Projects`
    - `CI Status Check`
- ✅ Require branches to be up to date before merging
- ✅ Require conversation resolution before merging
- ⚠️ Do not allow bypassing the above settings

#### For `develop` branch:
Same as main, but you can be slightly less strict:
- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging
  - Required status checks:
    - `CI Status Check`

### Step 4: Test the CI Pipeline

1. Create a new branch:
   ```bash
   git checkout -b test/ci-pipeline
   ```

2. Make a small change:
   ```bash
   echo "# Testing CI" >> README.md
   git add README.md
   git commit -m "test: trigger CI pipeline"
   ```

3. Push the branch:
   ```bash
   git push -u origin test/ci-pipeline
   ```

4. Create a Pull Request on GitHub

5. Watch the CI pipeline run in the "Checks" tab

## Features

### ✅ Nx Affected Commands
- Only tests/builds/lints projects that changed
- Dramatically reduces CI time for small changes
- Full rebuild on main/develop to ensure everything works

### ✅ Smart Caching
- Caches pnpm store between runs
- Reuses dependencies to speed up installs
- Optional: Use Nx Cloud for distributed caching

### ✅ Parallel Execution
- Runs frontend and backend tests in parallel
- Independent jobs run concurrently
- Optimized resource usage

### ✅ Service Containers
- PostgreSQL (4 separate databases for services)
- Redis for caching tests
- RabbitMQ for event-driven tests
- All services isolated per job

### ✅ Artifact Management
- Build artifacts stored for 7 days
- E2E test reports uploaded
- Coverage reports integrated with Codecov

### ✅ Security
- Trivy scans for vulnerabilities
- npm audit for dependency issues
- Results uploaded to GitHub Security tab

## Performance Optimization

### Current Performance (estimated):
- **Small changes (1-2 files):** 5-10 minutes
- **Medium changes (1 app):** 10-15 minutes
- **Large changes (multiple apps):** 20-30 minutes
- **Full rebuild (main/develop):** 30-40 minutes

### To Further Optimize:

1. **Enable Nx Cloud** (recommended):
   ```bash
   # Sign up at https://nx.app/
   # Add token to GitHub Secrets as NX_CLOUD_ACCESS_TOKEN
   ```
   - Saves ~30-50% CI time
   - Distributed task execution
   - Remote caching

2. **Self-hosted Runners**:
   - Faster hardware
   - Persistent caching
   - No minute limits

3. **Split E2E Tests**:
   - Run in parallel shards
   - Different browsers simultaneously

## Troubleshooting

### Issue: Prisma Client Generation Fails

**Error:** `@prisma/client did not initialize yet`

**Solution:**
- Ensure `pnpm db:all:generate` runs before tests
- Check that all Prisma schema files are valid

### Issue: Database Connection Failed

**Error:** `Can't reach database server`

**Solution:**
- Wait for service health checks to pass
- Increase health check intervals if needed
- Check database URLs are correct

### Issue: Tests Timeout

**Error:** `The job running on runner... has exceeded the maximum execution time`

**Solution:**
- Increase `timeout-minutes` for the job
- Optimize slow tests
- Split tests into multiple jobs

### Issue: Out of Disk Space

**Error:** `No space left on device`

**Solution:**
- Clean up Docker images/containers between runs
- Reduce artifact retention days
- Use `actions/cache` cleanup

### Issue: Nx Affected Not Working

**Error:** All projects rebuilding every time

**Solution:**
- Ensure `fetch-depth: 0` in checkout action
- Check that `nrwl/nx-set-shas@v4` is running
- Verify base branch is correct

## CI Workflow Triggers

### When CI Runs:

1. **On Push** to:
   - `main` branch
   - `develop` branch
   - Any `feature/**` branch
   - Any `fix/**` branch

2. **On Pull Request** to:
   - `main` branch
   - `develop` branch

### When E2E Tests Run:
- Only on `main` and `develop` branches
- Skipped for feature branches to save time

### Concurrency:
- Multiple commits to same branch → cancels older runs
- Different branches run independently

## Monitoring CI Health

### View CI Status:
1. **Repository homepage**: Shows status badge
2. **Actions tab**: Full history and logs
3. **Pull Request checks**: Inline status
4. **Commit page**: Individual commit status

### Add Status Badge to README:

```markdown
[![CI Pipeline](https://github.com/<username>/<repo>/actions/workflows/ci.yml/badge.svg)](https://github.com/<username>/<repo>/actions/workflows/ci.yml)
```

### GitHub Insights:
- **Insights → Actions**: CI usage and performance metrics
- Track success rates
- Identify flaky tests
- Monitor CI costs

## Next Steps

After CI is working:

1. ✅ **Enable Dependabot** (Settings → Security → Code security and analysis)
2. ✅ **Add CodeQL scanning** (GitHub Advanced Security)
3. ✅ **Set up CD pipeline** (deploy-staging.yml, deploy-production.yml)
4. ✅ **Add E2E test parallelization**
5. ✅ **Integrate Lighthouse for performance testing**
6. ✅ **Add visual regression testing**

## Cost Considerations

### GitHub Actions Free Tier:
- **2,000 minutes/month** for private repos
- **Unlimited** for public repos
- This CI pipeline uses ~30-40 min per full run

### Estimated Monthly Usage:
- 10 PRs/week × 4 weeks = 40 PRs
- 40 PRs × 15 min average = 600 minutes
- Well within free tier limits

### To Reduce Costs:
1. Use Nx affected commands (already implemented)
2. Cache dependencies aggressively (already implemented)
3. Skip E2E on feature branches (already implemented)
4. Use self-hosted runners for heavy workloads

## Support

For issues with the CI pipeline:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review GitHub Actions logs
3. Open an issue in the repository
4. Consult [GitHub Actions documentation](https://docs.github.com/en/actions)
