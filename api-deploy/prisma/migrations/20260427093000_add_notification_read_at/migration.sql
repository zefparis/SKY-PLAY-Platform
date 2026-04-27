-- AlterTable
ALTER TABLE "notifications" ADD COLUMN "readAt" TIMESTAMP(3);

-- Backfill readAt for already-read notifications using createdAt as a best-effort timestamp
UPDATE "notifications" SET "readAt" = "createdAt" WHERE "read" = true AND "readAt" IS NULL;
