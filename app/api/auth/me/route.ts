import { getSession } from '@/lib/auth/session';
import { ok } from '@/lib/http';

export const runtime = 'nodejs';

// GET /api/auth/me — current session claims, or { user: null } if signed out.
export async function GET() {
  const session = await getSession();
  return ok({ user: session });
}
