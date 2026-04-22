-- AlterTable
ALTER TABLE "tournament_matches" ADD COLUMN     "challengeId" TEXT;

-- CreateIndex
CREATE INDEX "tournament_matches_challengeId_idx" ON "tournament_matches"("challengeId");

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE SET NULL ON UPDATE CASCADE;
