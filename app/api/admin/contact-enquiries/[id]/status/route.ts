import { getAdmissionsAdminSession } from '@/lib/admission/admin-session';
import { prisma } from '@/lib/prisma';
import { contactStatusUpdateSchema } from '@/lib/validation/admin';
import { fail, ok, readJson } from '@/lib/http';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await getAdmissionsAdminSession()) return fail('unauthorized', 401);
  const parsed = contactStatusUpdateSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400);
  try {
    const enquiry = await prisma.contactEnquiry.update({ where: { id: (await params).id }, data: { status: parsed.data.status }, select: { id: true, status: true } });
    return ok(enquiry);
  } catch {
    return fail('notFound', 404);
  }
}
