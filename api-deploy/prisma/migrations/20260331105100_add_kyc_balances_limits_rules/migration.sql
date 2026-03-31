-- CreateEnum
CREATE TYPE "KYCStatus" AS ENUM ('PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'KYC_SUBMITTED';
ALTER TYPE "NotificationType" ADD VALUE 'KYC_VERIFIED';
ALTER TYPE "NotificationType" ADD VALUE 'KYC_REJECTED';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "dailyDepositLimit" INTEGER NOT NULL DEFAULT 50000,
ADD COLUMN     "dailySpendLimit" INTEGER NOT NULL DEFAULT 20000,
ADD COLUMN     "kycFirstName" TEXT,
ADD COLUMN     "kycIdNumber" TEXT,
ADD COLUMN     "kycIdPhotoUrl" TEXT,
ADD COLUMN     "kycIdType" TEXT,
ADD COLUMN     "kycLastName" TEXT,
ADD COLUMN     "kycRejectReason" TEXT,
ADD COLUMN     "kycRejectedAt" TIMESTAMP(3),
ADD COLUMN     "kycSelfieUrl" TEXT,
ADD COLUMN     "kycStatus" "KYCStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "kycSubmittedAt" TIMESTAMP(3),
ADD COLUMN     "kycVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "limitsPendingIncrease" JSONB,
ADD COLUMN     "limitsUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "weeklyDepositLimit" INTEGER NOT NULL DEFAULT 200000;

-- AlterTable
ALTER TABLE "wallets" ADD COLUMN     "consumptionBalance" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rewardBalance" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "challenge_rule_acceptances" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "rulesVersion" TEXT NOT NULL,
    "rulesHash" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "challenge_rule_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "challenge_rule_acceptances_challengeId_idx" ON "challenge_rule_acceptances"("challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_rule_acceptances_userId_challengeId_key" ON "challenge_rule_acceptances"("userId", "challengeId");

-- AddForeignKey
ALTER TABLE "challenge_rule_acceptances" ADD CONSTRAINT "challenge_rule_acceptances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_rule_acceptances" ADD CONSTRAINT "challenge_rule_acceptances_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
