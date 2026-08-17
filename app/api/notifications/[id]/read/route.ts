import { getSession } from '@/lib/auth/session';
import { getStudentAudience, markRead } from '@/lib/notifications/query';
import { ok, fail } from '@/lib/http';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

// POST /api/notifications/[id]/read — mark one notification read for this student.
export async function POST(_req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session || session.kind !== 'student') return fail('unauthorized', 401);
  const { id } = await params;

  const student = await getStudentAudience(session.sub);
  if (!student) return fail('notFound', 404);

  const done = await markRead(student, id);
  if (!done) return fail('notFound', 404);
  return ok();
}
