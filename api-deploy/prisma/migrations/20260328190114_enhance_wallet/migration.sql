-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionType" ADD VALUE 'CHALLENGE_DEBIT';
ALTER TYPE "TransactionType" ADD VALUE 'CHALLENGE_CREDIT';

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "balanceAfter" INTEGER,
ADD COLUMN     "balanceBefore" INTEGER,
ADD COLUMN     "flwRef" TEXT,
ADD COLUMN     "flwTxId" TEXT,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "phoneNumber" TEXT;

-- AlterTable
ALTER TABLE "wallets" ALTER COLUMN "currency" SET DEFAULT 'XAF';

-- CreateIndex
CREATE INDEX "transactions_walletId_idx" ON "transactions"("walletId");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "transactions_type_idx" ON "transactions"("type");
