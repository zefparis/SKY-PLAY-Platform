-- CreateEnum
CREATE TYPE "WinningsStatus" AS ENUM ('PENDING', 'AUTO_APPROVED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PAID');

-- CreateEnum
CREATE TYPE "RefundPolicy" AS ENUM ('STANDARD', 'NO_REFUND', 'PARTIAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'REFUND';
ALTER TYPE "NotificationType" ADD VALUE 'WINNINGS_REVIEW';

-- AlterTable
ALTER TABLE "challenge_participants" ADD COLUMN     "winningsApprovedAt" TIMESTAMP(3),
ADD COLUMN     "winningsRejectReason" TEXT,
ADD COLUMN     "winningsRejectedAt" TIMESTAMP(3),
ADD COLUMN     "winningsReviewAt" TIMESTAMP(3),
ADD COLUMN     "winningsStatus" "WinningsStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "challenges" ADD COLUMN     "refundPolicy" "RefundPolicy" NOT NULL DEFAULT 'STANDARD';

-- CreateIndex
CREATE INDEX "challenge_participants_winningsStatus_idx" ON "challenge_participants"("winningsStatus");
