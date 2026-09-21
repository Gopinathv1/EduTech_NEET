import { redirect } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import EmailVerificationForm from '@/components/auth/EmailVerificationForm';
import { safeReturnPath } from '@/lib/auth/redirect';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string | string[]; email?: string | string[] }> }) {
  const params = await searchParams;
  const callbackUrl = safeReturnPath(Array.isArray(params.callbackUrl) ? params.callbackUrl[0] : params.callbackUrl);
  const suppliedEmail = Array.isArray(params.email) ? params.email[0] : params.email;
  const session = await getSession();
  const student = session?.kind === 'student'
    ? await prisma.student.findUnique({ where: { id: session.sub }, select: { email: true, mobile: true, isEmailVerified: true } })
    : suppliedEmail ? await prisma.student.findUnique({ where: { email: suppliedEmail }, select: { email: true, mobile: true, isEmailVerified: true } }) : null;
  const email = student?.email;
  if (!email) redirect('/register');
  if (!student?.mobile) redirect('/register');
  if (student.isEmailVerified) redirect(callbackUrl);
  return <AuthShell><EmailVerificationForm email={email} mobile={student.mobile} callbackUrl={callbackUrl} /></AuthShell>;
}
