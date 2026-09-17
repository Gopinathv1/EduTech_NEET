import { prisma } from '@/lib/prisma';
import { finalizeAttempt } from './service';
import { isTimeUp } from './timer';

/** Server worker entry point. A closed browser is not required for finalization. */
export async function finalizeExpiredAttempts(now = new Date()) {
  const attempts = await prisma.testAttempt.findMany({
    where: { status: 'IN_PROGRESS' },
    select: { id: true, startedAt: true, test: { select: { durationMinutes: true } } },
  });
  let finalized = 0;
  for (const attempt of attempts) {
    if (!isTimeUp(attempt.startedAt, attempt.test.durationMinutes, now)) continue;
    const result = await finalizeAttempt(attempt.id, { auto: true });
    if (result.ok && !result.alreadyDone) finalized++;
  }
  return finalized;
}
