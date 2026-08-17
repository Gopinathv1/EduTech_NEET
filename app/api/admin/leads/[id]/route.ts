import { getAdminSession } from '@/lib/auth/admin';
import { buildLeadDetail } from '@/lib/admin/leads-service';
import { ok, fail } from '@/lib/http';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

// GET /api/admin/leads/[id] — full lead detail for the admin drawer.
export async function GET(_req: Request, { params }: Ctx) {
  const admin = await getAdminSession();
  if (!admin) return fail('unauthorized', 401);
  const { id } = await params;

  const detail = await buildLeadDetail(id);
  if (!detail) return fail('notFound', 404);

  return ok({ lead: detail });
}
