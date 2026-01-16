/*
  Backend Hardening - Priority 1.2: JWT Refresh Token Rotation

  Adds fields for:
  - token_family: Groups tokens in a rotation chain for reuse detection
  - fingerprint: Hash of IP + User-Agent for session validation
  - is_revoked: Soft delete for audit trail and reuse detection
  - last_used_at: Track when token was last used

  Strategy for existing rows:
  - Delete existing refresh tokens (users will need to re-login)
  - This is acceptable as it's a security improvement
*/

-- First, delete existing refresh tokens (they lack the new required fields)
-- Users will need to re-login, which is acceptable for a security migration
DELETE FROM "refresh_tokens";

-- Now add the new columns
ALTER TABLE "refresh_tokens" ADD COLUMN "fingerprint" TEXT;
ALTER TABLE "refresh_tokens" ADD COLUMN "is_revoked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "refresh_tokens" ADD COLUMN "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "refresh_tokens" ADD COLUMN "token_family" TEXT NOT NULL;

-- Create index for token family lookups
CREATE INDEX "refresh_tokens_token_family_idx" ON "refresh_tokens"("token_family");
