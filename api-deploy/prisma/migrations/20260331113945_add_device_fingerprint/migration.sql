-- CreateTable
CREATE TABLE "device_fingerprints" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "userAgent" TEXT,
    "language" TEXT,
    "timezone" TEXT,
    "screen" TEXT,
    "ipAddress" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,

    CONSTRAINT "device_fingerprints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "device_fingerprints_fingerprint_idx" ON "device_fingerprints"("fingerprint");

-- CreateIndex
CREATE INDEX "device_fingerprints_userId_idx" ON "device_fingerprints"("userId");

-- CreateIndex
CREATE INDEX "device_fingerprints_ipAddress_idx" ON "device_fingerprints"("ipAddress");

-- CreateIndex
CREATE UNIQUE INDEX "device_fingerprints_userId_fingerprint_key" ON "device_fingerprints"("userId", "fingerprint");

-- AddForeignKey
ALTER TABLE "device_fingerprints" ADD CONSTRAINT "device_fingerprints_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
