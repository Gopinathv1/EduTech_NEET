import { getAdminSession } from '@/lib/auth/admin';
import { prisma } from '@/lib/prisma';

// Admissions records contain personal contact data. Re-check revoked accounts
// against persisted state rather than relying only on a seven-day JWT.
export async function getAdmissionsAdminSession() {
  const session = await getAdminSession();
  if (!session) return null;
  const admin = await prisma.admin.findUnique({ where: { id: session.sub }, select: { isActive: true, role: true } });
  if (!admin?.isActive) return null;
  return { ...session, role: admin.role };
}
