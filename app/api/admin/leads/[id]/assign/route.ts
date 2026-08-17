import { getAdminSession } from '@/lib/auth/admin';
import { leadAssignSchema } from '@/lib/validation/admission';
import { assignLead } from '@/lib/admin/leads-service';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/admin/leads/[id]/assign — assign a lead to an admin (or unassign).
export async function PATCH(req: Request, { params }: Ctx) {
  const admin = await getAdminSession();
  if (!admin) return fail('unauthorized', 401);
  const { id } = await params;

  const parsed = leadAssignSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400);

  const result = await assignLead(admin, id, parsed.data.assignedToId);
  if (!result.ok) return fail(result.code ?? 'error', result.code === 'notFound' ? 404 : 400);

  return ok({ assignedToId: parsed.data.assignedToId });
}
