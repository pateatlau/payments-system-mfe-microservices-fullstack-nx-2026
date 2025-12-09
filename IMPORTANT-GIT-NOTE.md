# IMPORTANT: Git History Rewrite

**Date:** 2025-12-10
**Branch:** `poc-2`

## What Happened

The `.env` file was accidentally committed to the repository in earlier commits. This file contains sensitive configuration including JWT secrets and should never be committed.

## Actions Taken

1. ✅ Added `.env` to `.gitignore`
2. ✅ Removed `.env` from git tracking (kept locally)
3. ✅ Used `git filter-branch` to remove `.env` from entire git history
4. ✅ Cleaned up git references and garbage collected

## Current State

- `.env` file still exists locally (required for development)
- `.env` is NOT in any commits (past or present)
- `.env` is in `.gitignore` (won't be committed in future)
- `.env.example` has been updated as the reference template

## Next Steps When Pushing

Since the git history has been rewritten, you MUST use **force push** when pushing to remote:

```bash
git push origin poc-2 --force-with-lease
```

**WARNING:** This will rewrite the remote history. Make sure no one else is working on this branch!

## For Other Developers

After pulling the rewritten history:

1. Copy `.env.example` to `.env`
2. Update `.env` with local configuration (especially `JWT_SECRET=your-secret-key-change-in-production`)
3. Restart all backend services to pick up the new JWT_SECRET

## JWT_SECRET Fix

The `.env` file now has the correct `JWT_SECRET` that matches all backend services:

```
JWT_SECRET=your-secret-key-change-in-production
```

All services (auth, admin, payments) now use this same secret for signing/verifying JWT tokens.
