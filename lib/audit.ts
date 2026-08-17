import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { SessionClaims } from '@/lib/auth/jwt';

/**
 * Append an entry to the AuditLog (who / what / when). Audit failures are
 * swallowed (logged to the server console) so they never break the user action.
 */
export async function logAudit(
  admin: Pick<SessionClaims, 'sub' | 'name'>,
  entry: {
    action: string;
    entityType: string;
    entityId?: string | null;
    details?: Prisma.InputJsonValue;
  },
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        adminId: admin.sub,
        adminName: admin.name,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        details: entry.details,
      },
    });
  } catch (err) {
    console.error('[audit] failed to write log entry', entry.action, err);
  }
}
