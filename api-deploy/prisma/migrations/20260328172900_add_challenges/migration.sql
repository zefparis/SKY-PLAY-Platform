/*
  Warnings:

  - You are about to drop the column `endTime` on the `challenges` table. All the data in the column will be lost.
  - You are about to drop the column `gameMode` on the `challenges` table. All the data in the column will be lost.
  - You are about to drop the column `minPlayers` on the `challenges` table. All the data in the column will be lost.
  - You are about to drop the column `platform` on the `challenges` table. All the data in the column will be lost.
  - You are about to drop the column `prizePool` on the `challenges` table. All the data in the column will be lost.
  - You are about to drop the column `region` on the `challenges` table. All the data in the column will be lost.
  - You are about to drop the column `rules` on the `challenges` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `challenges` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `challenges` table. All the data in the column will be lost.
  - You are about to alter the column `entryFee` on the `challenges` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to drop the column `challengeId` on the `matches` table. All the data in the column will be lost.
  - Added the required column `commission` to the `challenges` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creatorId` to the `challenges` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiresAt` to the `challenges` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `challenges` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ChallengeType" AS ENUM ('DUEL', 'SMALL_CHALLENGE', 'STANDARD', 'MEDIUM_TOURNAMENT', 'BIG_TOURNAMENT', 'PREMIUM_TOURNAMENT');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('PENDING', 'REVIEWING', 'RESOLVED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ChallengeStatus" ADD VALUE 'VALIDATING';
ALTER TYPE "ChallengeStatus" ADD VALUE 'DISPUTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'CHALLENGE_FULL';
ALTER TYPE "NotificationType" ADD VALUE 'CHALLENGE_WON';
ALTER TYPE "NotificationType" ADD VALUE 'CHALLENGE_LOST';
ALTER TYPE "NotificationType" ADD VALUE 'CHALLENGE_DISPUTED';
ALTER TYPE "NotificationType" ADD VALUE 'CHALLENGE_RESOLVED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionType" ADD VALUE 'DEBIT';
ALTER TYPE "TransactionType" ADD VALUE 'CREDIT';

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_challengeId_fkey";

-- DropForeignKey
ALTER TABLE "participants" DROP CONSTRAINT "participants_challengeId_fkey";

-- AlterTable
ALTER TABLE "challenges" DROP COLUMN "endTime",
DROP COLUMN "gameMode",
DROP COLUMN "minPlayers",
DROP COLUMN "platform",
DROP COLUMN "prizePool",
DROP COLUMN "region",
DROP COLUMN "rules",
DROP COLUMN "startTime",
DROP COLUMN "updatedAt",
ADD COLUMN     "commission" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "creatorId" TEXT NOT NULL,
ADD COLUMN     "endedAt" TIMESTAMP(3),
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "potTotal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "type" "ChallengeType" NOT NULL,
ALTER COLUMN "entryFee" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "matches" DROP COLUMN "challengeId";

-- CreateTable
CREATE TABLE "challenge_participants" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hasPaid" BOOLEAN NOT NULL DEFAULT false,
    "rank" INTEGER,
    "winnings" INTEGER,

    CONSTRAINT "challenge_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_results" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "declaredRank" INTEGER NOT NULL,
    "screenshotUrl" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenge_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_disputes" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenge_disputes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "challenge_participants_userId_idx" ON "challenge_participants"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_participants_challengeId_userId_key" ON "challenge_participants"("challengeId", "userId");

-- CreateIndex
CREATE INDEX "challenge_results_challengeId_idx" ON "challenge_results"("challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_results_challengeId_userId_key" ON "challenge_results"("challengeId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_disputes_challengeId_key" ON "challenge_disputes"("challengeId");

-- CreateIndex
CREATE INDEX "challenge_disputes_status_idx" ON "challenge_disputes"("status");

-- CreateIndex
CREATE INDEX "challenges_status_idx" ON "challenges"("status");

-- CreateIndex
CREATE INDEX "challenges_game_idx" ON "challenges"("game");

-- CreateIndex
CREATE INDEX "challenges_type_idx" ON "challenges"("type");

-- CreateIndex
CREATE INDEX "challenges_createdAt_idx" ON "challenges"("createdAt");

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_participants" ADD CONSTRAINT "challenge_participants_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_participants" ADD CONSTRAINT "challenge_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_results" ADD CONSTRAINT "challenge_results_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_results" ADD CONSTRAINT "challenge_results_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_disputes" ADD CONSTRAINT "challenge_disputes_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
