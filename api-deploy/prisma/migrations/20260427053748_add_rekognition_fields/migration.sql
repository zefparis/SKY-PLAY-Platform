-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'ANALYZING', 'ANALYZED', 'FAILED', 'LOW_CONFIDENCE');

-- AlterEnum
ALTER TYPE "ResultSource" ADD VALUE 'AUTO_VERIFIED';

-- AlterTable
ALTER TABLE "challenge_results" ADD COLUMN     "analysisStatus" "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "analyzedAt" TIMESTAMP(3),
ADD COLUMN     "confidence" DOUBLE PRECISION,
ADD COLUMN     "rekognitionData" JSONB,
ADD COLUMN     "verifiedRank" INTEGER,
ADD COLUMN     "verifiedScore" INTEGER;
