-- AlterEnum
-- ALTER TYPE "GameProvider" ADD VALUE cannot run inside a transaction block on
-- some PostgreSQL versions, so we wrap each new variant on its own statement.
ALTER TYPE "GameProvider" ADD VALUE IF NOT EXISTS 'YOUTUBE';

-- AlterTable
ALTER TABLE "matches" ADD COLUMN "broadcastId" TEXT,
ADD COLUMN "streamKey" TEXT;

-- AlterTable
ALTER TABLE "tournament_matches" ADD COLUMN "broadcastId" TEXT,
ADD COLUMN "streamKey" TEXT;
