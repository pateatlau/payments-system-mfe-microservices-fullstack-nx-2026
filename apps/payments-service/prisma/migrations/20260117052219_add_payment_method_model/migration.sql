-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('card', 'bank_account', 'wallet');

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "currency" SET DEFAULT 'INR';

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "PaymentMethodType" NOT NULL,
    "label" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "card_number" TEXT,
    "card_last_4" TEXT,
    "card_last_4_idx" TEXT,
    "card_expiry_month" TEXT,
    "card_expiry_year" TEXT,
    "cardholder_name" TEXT,
    "bank_account_number" TEXT,
    "bank_routing_number" TEXT,
    "bank_account_last_4" TEXT,
    "bank_account_last_4_idx" TEXT,
    "bank_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_methods_user_id_idx" ON "payment_methods"("user_id");

-- CreateIndex
CREATE INDEX "payment_methods_card_last_4_idx_idx" ON "payment_methods"("card_last_4_idx");

-- CreateIndex
CREATE INDEX "payment_methods_bank_account_last_4_idx_idx" ON "payment_methods"("bank_account_last_4_idx");

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
