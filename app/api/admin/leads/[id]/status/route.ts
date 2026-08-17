import { getAdminSession } from '@/lib/auth/admin';
import { leadStatusSchema } from '@/lib/validation/admission';
import { changeLeadStatus } from '@/lib/admin/leads-service';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/admin/leads/[id]/status — move a lead through the pipeline. Logs the
// transition to the lead timeline and the audit log.
export async function PATCH(req: Request, { params }: Ctx) {
  const admin = await getAdminSession();
  if (!admin) return fail('unauthorized', 401);
  const { id } = await params;

  const parsed = leadStatusSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400);

  const result = await changeLeadStatus(admin, id, parsed.data.status, parsed.data.note);
  if (!result.ok) return fail(result.code ?? 'error', result.code === 'notFound' ? 404 : 400);

  return ok({ status: parsed.data.status });
}
