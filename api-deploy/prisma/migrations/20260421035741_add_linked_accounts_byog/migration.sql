-- CreateEnum
CREATE TYPE "ResultSource" AS ENUM ('SCREENSHOT', 'STEAM_API', 'EPIC_API');

-- CreateEnum
CREATE TYPE "GameProvider" AS ENUM ('STEAM', 'EPIC', 'DISCORD', 'TWITCH');

-- AlterTable
ALTER TABLE "challenge_results" ADD COLUMN     "dataSource" "ResultSource" NOT NULL DEFAULT 'SCREENSHOT',
ADD COLUMN     "externalMatchId" TEXT;

-- CreateTable
CREATE TABLE "linked_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "GameProvider" NOT NULL,
    "externalId" TEXT NOT NULL,
    "username" TEXT,
    "avatarUrl" TEXT,
    "profileUrl" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "linked_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "linked_accounts_userId_idx" ON "linked_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "linked_accounts_provider_externalId_key" ON "linked_accounts"("provider", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "linked_accounts_userId_provider_key" ON "linked_accounts"("userId", "provider");

-- AddForeignKey
ALTER TABLE "linked_accounts" ADD CONSTRAINT "linked_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
