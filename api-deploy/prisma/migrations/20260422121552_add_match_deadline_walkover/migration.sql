-- AlterTable
ALTER TABLE "tournament_matches" ADD COLUMN     "deadlineAt" TIMESTAMP(3),
ADD COLUMN     "walkedOver" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "walkoverUserId" TEXT;
