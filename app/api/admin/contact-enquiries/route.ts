import { getAdminSession } from '@/lib/auth/admin';
import { prisma } from '@/lib/prisma';
import { fail, ok } from '@/lib/http';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  if (!await getAdminSession()) return fail('unauthorized', 401);
  const status = new URL(req.url).searchParams.get('status');
  const where = status && ['NEW', 'RESPONDED', 'CLOSED'].includes(status) ? { status: status as 'NEW' | 'RESPONDED' | 'CLOSED' } : {};
  const enquiries = await prisma.contactEnquiry.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 });
  return ok({ enquiries });
}
