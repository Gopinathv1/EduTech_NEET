import { prisma } from '@/lib/prisma';
import { checkFeasibility } from '@/lib/generator/plan';
import { logAudit } from '@/lib/audit';
import { notifyNewTestPublished } from '@/lib/notifications/create';
import type { SessionClaims } from '@/lib/auth/jwt';
import type { PrismaClient } from '@prisma/client';

/** Shared publication workflow for authenticated admin routes and guarded maintenance commands. */
export async function publishTest(testId: string, admin: Pick<SessionClaims, 'sub' | 'name'>,
  options: { client?: PrismaClient; atomicAudit?: boolean; skipNotifications?: boolean; idempotent?: boolean } = {}) {
  const client = options.client ?? prisma;
  const test = await client.test.findUnique({
    where: { id: testId },
    select: { id: true, isPublished: true, title: true, price: true },
  });
  if (!test) throw new Error('Test not found.');

  const feasibility = await checkFeasibility(testId);
  if (!feasibility.ok) throw new Error(`Test is not feasible: ${feasibility.errors.join(' ')}`);

  if (options.idempotent && test.isPublished) return { isPublished: true, warnings: feasibility.warnings };

  if (options.atomicAudit) {
    await client.$transaction(async tx => {
      const changed = await tx.test.updateMany({ where: { id: testId, isPublished: false }, data: { isPublished: true } });
      if (changed.count !== 1) throw new Error('Test publication state changed during release.');
      await tx.auditLog.create({ data: { adminId: admin.sub, adminName: admin.name, action: 'test.publish', entityType: 'Test', entityId: testId } });
    });
  } else {
    await client.test.update({ where: { id: testId }, data: { isPublished: true } });
    await logAudit(admin, { action: 'test.publish', entityType: 'Test', entityId: testId });
  }
  if (!test.isPublished && !options.skipNotifications) {
    await notifyNewTestPublished({ testId, title: test.title, isFree: test.price === 0 });
  }
  return { isPublished: true, warnings: feasibility.warnings };
}
