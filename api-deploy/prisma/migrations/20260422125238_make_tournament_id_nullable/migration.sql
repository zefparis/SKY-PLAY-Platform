-- DropForeignKey
ALTER TABLE "tournament_matches" DROP CONSTRAINT "tournament_matches_tournamentId_fkey";

-- AlterTable
ALTER TABLE "tournament_matches" ALTER COLUMN "tournamentId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
