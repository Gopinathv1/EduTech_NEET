import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

/**
 * JWT signing/verification using `jose`, which runs on BOTH the Node.js runtime
 * (API routes, server components) and the Edge runtime (middleware). This is why
 * middleware can verify sessions without importing Prisma or bcrypt.
 */

export type SessionKind = 'student' | 'admin' | 'partner';
export type SessionRole = 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN' | 'PARTNER';

export interface SessionClaims {
  sub: string; // user id (Student.id or Admin.id)
  kind: SessionKind;
  role: SessionRole;
  name: string;
  agencyId?: string;
}

// Cookie name lives here (no next/headers import) so Edge middleware can use it.
export const SESSION_COOKIE = 'session';

const ISSUER = 'neet-platform';
const AUDIENCE = 'neet-platform';
const ALG = 'HS256';

// 7 day sessions.
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(claims: SessionClaims): Promise<string> {
  return new SignJWT({ kind: claims.kind, role: claims.role, name: claims.name, agencyId: claims.agencyId })
    .setProtectedHeader({ alg: ALG })
    .setSubject(claims.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return claimsFromPayload(payload);
  } catch {
    return null;
  }
}

function claimsFromPayload(payload: JWTPayload): SessionClaims | null {
  const { sub, kind, role, name, agencyId } = payload as JWTPayload & {
    kind?: unknown;
    role?: unknown;
    name?: unknown;
    agencyId?: unknown;
  };
  if (
    typeof sub !== 'string' ||
    (kind !== 'student' && kind !== 'admin' && kind !== 'partner') ||
    (role !== 'STUDENT' && role !== 'ADMIN' && role !== 'SUPER_ADMIN' && role !== 'PARTNER') ||
    typeof name !== 'string' ||
    (agencyId !== undefined && typeof agencyId !== 'string')
  ) {
    return null;
  }
  if (kind === 'student' && role !== 'STUDENT') return null;
  if (kind === 'admin' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') return null;
  if (kind === 'partner' && (!agencyId || role !== 'PARTNER')) return null;
  return { sub, kind, role, name, agencyId };
}
