-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "phone_idx" TEXT;

-- CreateIndex
CREATE INDEX "user_profiles_phone_idx_idx" ON "user_profiles"("phone_idx");
