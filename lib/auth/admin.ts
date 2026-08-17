import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import type { SessionClaims } from '@/lib/auth/jwt';

/**
 * Admin authorisation helpers.
 *
 * Page routes under /admin/* are already gated by middleware (Edge). These add
 * a second, defence-in-depth check inside server components and — crucially —
 * are the ONLY guard for /api/admin/* routes, which middleware does not cover.
 */

/** For server components: ensure an admin session, else redirect to login. */
export async function requireAdminPage(opts?: { superOnly?: boolean }): Promise<SessionClaims> {
  const session = await getSession();
  if (!session || session.kind !== 'admin') redirect('/admin/login');
  if (opts?.superOnly && session.role !== 'SUPER_ADMIN') redirect('/admin');
  return session;
}

/** For API routes: return the admin session or null (caller returns 401/403). */
export async function getAdminSession(): Promise<SessionClaims | null> {
  const session = await getSession();
  if (!session || session.kind !== 'admin') return null;
  return session;
}

/** For super-admin-only API routes: null unless the caller is a SUPER_ADMIN. */
export async function getSuperAdminSession(): Promise<SessionClaims | null> {
  const session = await getAdminSession();
  if (!session || session.role !== 'SUPER_ADMIN') return null;
  return session;
}
