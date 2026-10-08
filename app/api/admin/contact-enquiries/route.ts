import { buildAdmissionsEnquiryWhere } from '@/lib/admission/enquiries-filter';
import { getAdmissionsAdminSession } from '@/lib/admission/admin-session';
import { prisma } from '@/lib/prisma';
import { fail, ok } from '@/lib/http';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  if (!await getAdmissionsAdminSession()) return fail('unauthorized', 401);
  const status = new URL(req.url).searchParams.get('status');
  const where = buildAdmissionsEnquiryWhere(status ?? '', new URL(req.url).searchParams.get('q') ?? '');
  const enquiries = await prisma.contactEnquiry.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 });
  return ok({ enquiries });
}
