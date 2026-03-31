-- CreateEnum
CREATE TYPE "ExclusionStatus" AS ENUM ('ACTIVE', 'SELF_EXCLUDED', 'PERMANENTLY_EXCLUDED', 'COOLING_OFF');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "exclusionReason" TEXT,
ADD COLUMN     "exclusionRequestedAt" TIMESTAMP(3),
ADD COLUMN     "exclusionStatus" "ExclusionStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "exclusionUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "exclusion_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ExclusionStatus" NOT NULL,
    "duration" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "reason" TEXT,
    "requestedBy" TEXT NOT NULL,

    CONSTRAINT "exclusion_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exclusion_history_userId_idx" ON "exclusion_history"("userId");

-- CreateIndex
CREATE INDEX "users_exclusionStatus_idx" ON "users"("exclusionStatus");

-- AddForeignKey
ALTER TABLE "exclusion_history" ADD CONSTRAINT "exclusion_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
