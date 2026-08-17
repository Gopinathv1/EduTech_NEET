import { destroySession } from '@/lib/auth/session';
import { ok } from '@/lib/http';

export const runtime = 'nodejs';

// POST /api/auth/logout — clear the session cookie.
export async function POST() {
  await destroySession();
  return ok();
}
