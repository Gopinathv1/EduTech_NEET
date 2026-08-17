import { cookies } from 'next/headers';
import {
  signSession,
  verifySession,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  type SessionClaims,
} from '@/lib/auth/jwt';

/**
 * Session cookie helpers for the Node.js runtime (API routes, server
 * components, server actions). Middleware reads the cookie directly from the
 * request instead — see middleware.ts.
 */

export { SESSION_COOKIE };

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

/** Sign a session and write it to the httpOnly cookie. */
export async function createSession(claims: SessionClaims): Promise<void> {
  const token = await signSession(claims);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, cookieOptions());
}

/** Read and verify the current session, or null if none/invalid. */
export async function getSession(): Promise<SessionClaims | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** Clear the session cookie (logout). */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, '', { ...cookieOptions(), maxAge: 0 });
}
