import { NextResponse, type NextRequest } from 'next/server';
import { verifySession, SESSION_COOKIE } from '@/lib/auth/jwt';
import { SUPER_ADMIN_PATHS } from '@/lib/admin/nav';

/**
 * Route protection. Runs on the Edge runtime, so it only verifies the JWT from
 * the cookie (via `jose`) — no Prisma, no bcrypt.
 *
 * Rules:
 *   /student/*        → any logged-in student
 *   /admin/*          → ADMIN or SUPER_ADMIN (except /admin/login, which is public)
 *   /admin/super/*    → SUPER_ADMIN only
 * Unauthenticated users are redirected to the relevant login page with a
 * `?next=` param so they return to where they were headed.
 */

// Super-admin-only areas (defined alongside the nav so they never drift apart).
const SUPER_ADMIN_PREFIXES = ['/admin/super', ...SUPER_ADMIN_PATHS];

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // /admin/login is the only public page under /admin.
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (pathname.startsWith('/admin')) {
    const isAdmin =
      session?.kind === 'admin' && (session.role === 'ADMIN' || session.role === 'SUPER_ADMIN');
    if (!isAdmin) {
      return redirectTo(req, '/admin/login', pathname + search);
    }
    const isSuperArea = SUPER_ADMIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
    if (isSuperArea && session.role !== 'SUPER_ADMIN') {
      // Authenticated but insufficient privilege → send to the admin dashboard.
      return NextResponse.redirect(new URL('/admin', req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/student')) {
    if (session?.kind !== 'student') {
      return redirectTo(req, '/login', pathname + search);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

function redirectTo(req: NextRequest, loginPath: string, next: string) {
  const url = new URL(loginPath, req.url);
  url.searchParams.set('next', next);
  return NextResponse.redirect(url);
}

// Only run on protected areas — keeps public pages and API routes untouched.
export const config = {
  matcher: ['/student/:path*', '/admin/:path*'],
};
