const fs = require('fs');
const path = require('path');

/**
 * Railway compat:
 * Some Railway configurations still run:
 *   npx prisma generate --schema ../../database/prisma/schema.prisma
 * while the service root directory is `services/api`.
 *
 * This script mirrors `services/api/prisma` to `../../database/prisma` so the schema path exists.
 */

const srcPrismaDir = path.resolve(__dirname, '..', 'prisma');
const legacyPrismaDir = path.resolve(__dirname, '..', '..', 'database', 'prisma');

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copyDir(src, dest) {
  // Node 16+ supports fs.cpSync
  fs.cpSync(src, dest, { recursive: true, force: true });
}

try {
  if (!fs.existsSync(srcPrismaDir)) {
    process.exit(0);
  }

  ensureDir(legacyPrismaDir);
  copyDir(srcPrismaDir, legacyPrismaDir);
} catch (e) {
  // Best-effort: do not break install if filesystem is read-only.
  process.exit(0);
}
