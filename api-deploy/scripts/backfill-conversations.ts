/**
 * Backfill CHALLENGE conversations for pre-existing active challenges.
 *
 * Context:
 *   Until recently, a CHALLENGE conversation was only created when the
 *   challenge transitioned to IN_PROGRESS. Defis that were created (OPEN)
 *   and never reached FULL/IN_PROGRESS therefore have no conversation,
 *   which is why they do not appear in the user's chat sidebar.
 *
 * Behaviour:
 *   1. Find every challenge whose status is NOT in [COMPLETED, CANCELLED]
 *      and that currently has no associated Conversation.
 *   2. Create a CHALLENGE conversation wiring in every existing
 *      ChallengeParticipant as a member + a neutral SYSTEM welcome message.
 *   3. Print a per-row log and a final summary.
 *
 * Usage:
 *   cd api-deploy
 *   npx ts-node scripts/backfill-conversations.ts
 *
 * Idempotent: safe to re-run.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TERMINAL_STATUSES = ['COMPLETED', 'CANCELLED'] as const;

async function main() {
  console.log('[backfill] Scanning for active challenges without a conversation...');

  const challenges = await prisma.challenge.findMany({
    where: {
      status: { notIn: [...TERMINAL_STATUSES] as any },
      conversation: { is: null },
    },
    include: {
      participants: { select: { userId: true } },
    },
  });

  console.log(`[backfill] Found ${challenges.length} challenge(s) to backfill.`);

  let created = 0;
  let skipped = 0;
  const errors: Array<{ challengeId: string; error: string }> = [];

  for (const challenge of challenges) {
    const participantIds = Array.from(
      new Set(challenge.participants.map((p) => p.userId)),
    );

    if (participantIds.length === 0) {
      console.warn(
        `[backfill] Skipping ${challenge.id} — no participants (title="${challenge.title}")`,
      );
      skipped++;
      continue;
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Double-check inside the transaction (race-safe).
        const existing = await tx.conversation.findUnique({
          where: { challengeId: challenge.id },
          select: { id: true },
        });
        if (existing) {
          skipped++;
          return;
        }

        const conv = await tx.conversation.create({
          data: {
            type: 'CHALLENGE',
            challengeId: challenge.id,
            members: {
              create: participantIds.map((userId) => ({ userId })),
            },
          },
        });

        await tx.conversationMessage.create({
          data: {
            conversationId: conv.id,
            content:
              '⚔️ Salon du défi ouvert — discutez ici en attendant le démarrage.',
            type: 'SYSTEM',
          },
        });
      });

      created++;
      console.log(
        `[backfill] Conversation créée pour challenge ${challenge.id} — ${challenge.title}`,
      );
    } catch (err: any) {
      errors.push({ challengeId: challenge.id, error: err?.message ?? String(err) });
      console.error(
        `[backfill] FAILED for challenge ${challenge.id} (${challenge.title}): ${err?.message ?? err}`,
      );
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`[backfill] Total conversations créées : ${created}`);
  console.log(`[backfill] Ignorés (déjà existants / sans participants) : ${skipped}`);
  console.log(`[backfill] Erreurs : ${errors.length}`);
  if (errors.length > 0) {
    console.log('[backfill] Détail erreurs :');
    for (const e of errors) console.log(`  - ${e.challengeId}: ${e.error}`);
  }
  console.log('═══════════════════════════════════════════════════════════');
}

main()
  .catch((err) => {
    console.error('[backfill] Fatal error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
