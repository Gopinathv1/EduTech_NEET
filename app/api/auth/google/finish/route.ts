import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth/session';
import { syncLocaleFromProfile } from '@/lib/locale';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET,
  });
  const email = typeof token?.email === 'string' ? token.email.toLowerCase() : null;
  if (!email) return NextResponse.redirect(new URL('/login?error=google', req.url));

  const student = await prisma.student.findUnique({ where: { email } });
  if (!student) return NextResponse.redirect(new URL('/login?error=google', req.url));

  await createSession({ sub: student.id, kind: 'student', role: 'STUDENT', name: student.name });
  await syncLocaleFromProfile(student.preferredLanguage);

  return NextResponse.redirect(new URL(student.mobile ? '/student' : '/complete-profile', req.url));
}
