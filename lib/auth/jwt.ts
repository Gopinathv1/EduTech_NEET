import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

/**
 * JWT signing/verification using `jose`, which runs on BOTH the Node.js runtime
 * (API routes, server components) and the Edge runtime (middleware). This is why
 * middleware can verify sessions without importing Prisma or bcrypt.
 */

export type SessionKind = 'student' | 'admin';
export type SessionRole = 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN';

export interface SessionClaims {
  sub: string; // user id (Student.id or Admin.id)
  kind: SessionKind;
  role: SessionRole;
  name: string;
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
  return new SignJWT({ kind: claims.kind, role: claims.role, name: claims.name })
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
  const { sub, kind, role, name } = payload as JWTPayload & {
    kind?: unknown;
    role?: unknown;
    name?: unknown;
  };
  if (
    typeof sub !== 'string' ||
    (kind !== 'student' && kind !== 'admin') ||
    (role !== 'STUDENT' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') ||
    typeof name !== 'string'
  ) {
    return null;
  }
  return { sub, kind, role, name };
}
