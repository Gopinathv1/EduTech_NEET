import { getAdminSession } from '@/lib/auth/admin';
import { leadNoteSchema } from '@/lib/validation/admission';
import { addLeadNote } from '@/lib/admin/leads-service';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

// POST /api/admin/leads/[id]/notes — append a follow-up note to the lead timeline.
export async function POST(req: Request, { params }: Ctx) {
  const admin = await getAdminSession();
  if (!admin) return fail('unauthorized', 401);
  const { id } = await params;

  const parsed = leadNoteSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400);

  const result = await addLeadNote(admin, id, parsed.data.note);
  if (!result.ok) return fail(result.code ?? 'error', result.code === 'notFound' ? 404 : 400);

  return ok();
}
