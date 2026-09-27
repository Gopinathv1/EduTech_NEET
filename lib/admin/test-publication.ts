import { prisma } from '@/lib/prisma';
import { checkFeasibility } from '@/lib/generator/plan';
import { logAudit } from '@/lib/audit';
import { notifyNewTestPublished } from '@/lib/notifications/create';
import type { SessionClaims } from '@/lib/auth/jwt';

/** Shared publication workflow for authenticated admin routes and guarded maintenance commands. */
export async function publishTest(testId: string, admin: Pick<SessionClaims, 'sub' | 'name'>) {
  const test = await prisma.test.findUnique({
    where: { id: testId },
    select: { id: true, isPublished: true, title: true, price: true },
  });
  if (!test) throw new Error('Test not found.');

  const feasibility = await checkFeasibility(testId);
  if (!feasibility.ok) throw new Error(`Test is not feasible: ${feasibility.errors.join(' ')}`);

  await prisma.test.update({ where: { id: testId }, data: { isPublished: true } });
  await logAudit(admin, { action: 'test.publish', entityType: 'Test', entityId: testId });
  if (!test.isPublished) {
    await notifyNewTestPublished({ testId, title: test.title, isFree: test.price === 0 });
  }
  return { isPublished: true, warnings: feasibility.warnings };
}
