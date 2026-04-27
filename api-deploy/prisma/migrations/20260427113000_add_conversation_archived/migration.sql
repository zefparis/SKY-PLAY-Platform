-- AlterTable
ALTER TABLE "conversations" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "conversations" ADD COLUMN "archivedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "conversations_archived_idx" ON "conversations"("archived");
