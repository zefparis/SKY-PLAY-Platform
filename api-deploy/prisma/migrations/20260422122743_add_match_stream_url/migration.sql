-- CreateEnum
CREATE TYPE "StreamType" AS ENUM ('YOUTUBE', 'TWITCH', 'FACEBOOK');

-- AlterTable
ALTER TABLE "tournament_matches" ADD COLUMN     "streamType" "StreamType",
ADD COLUMN     "streamUrl" TEXT;
