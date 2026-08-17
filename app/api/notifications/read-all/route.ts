import { getSession } from '@/lib/auth/session';
import { getStudentAudience, markAllRead } from '@/lib/notifications/query';
import { ok, fail } from '@/lib/http';

export const runtime = 'nodejs';

// POST /api/notifications/read-all — mark every visible notification read.
export async function POST() {
  const session = await getSession();
  if (!session || session.kind !== 'student') return fail('unauthorized', 401);

  const student = await getStudentAudience(session.sub);
  if (!student) return fail('notFound', 404);

  const count = await markAllRead(student);
  return ok({ count });
}
