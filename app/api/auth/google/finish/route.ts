import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth/session';
import { returnParamFromUrl, withReturnParam } from '@/lib/auth/redirect';
import { syncLocaleFromProfile } from '@/lib/locale';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const returnTo = returnParamFromUrl(req.nextUrl);
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET,
  });
  const email = typeof token?.email === 'string' ? token.email.toLowerCase() : null;
  if (!email) return authErrorRedirect(req, 'OAuthCallback', returnTo);

  const student = await prisma.student.findUnique({ where: { email } });
  if (!student) return authErrorRedirect(req, 'GoogleAccountNotRegistered', returnTo);

  await createSession({ sub: student.id, kind: 'student', role: 'STUDENT', name: student.name });
  await syncLocaleFromProfile(student.preferredLanguage);

  const destination = student.mobile ? returnTo : withReturnParam('/complete-profile', returnTo);
  return NextResponse.redirect(new URL(destination, req.url));
}

function authErrorRedirect(req: NextRequest, error: string, returnTo: string) {
  const url = new URL('/login', req.url);
  url.searchParams.set('error', error);
  url.searchParams.set('callbackUrl', returnTo);
  return NextResponse.redirect(url);
}
