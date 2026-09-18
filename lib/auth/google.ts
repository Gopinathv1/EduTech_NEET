import type { Account, Profile, User } from 'next-auth';
import type { AdapterUser } from 'next-auth/adapters';
import { prisma } from '@/lib/prisma';

type GoogleProfile = Profile & {
  email?: string;
  email_verified?: boolean;
  name?: string;
};

export type GoogleStudentDecision = 'linked' | 'notFound' | 'denied';

export async function authorizeGoogleStudent({
  user,
  account,
  profile,
}: {
  user: User | AdapterUser;
  account: Account | null;
  profile?: Profile;
}): Promise<GoogleStudentDecision> {
  if (account?.provider !== 'google') return 'denied';
  const googleSubject = account.providerAccountId;
  const p = profile as GoogleProfile | undefined;
  const email = (user.email ?? p?.email ?? '').trim().toLowerCase();
  if (!email || p?.email_verified !== true) return 'denied';

  const name = user.name ?? p?.name ?? email.split('@')[0] ?? 'Student';
  const [byGoogleSubject, byEmail] = await Promise.all([
    prisma.student.findUnique({ where: { googleSubject } }),
    prisma.student.findUnique({ where: { email } }),
  ]);

  if (byGoogleSubject && byEmail && byGoogleSubject.id !== byEmail.id) {
    return 'denied';
  }

  const existing = byGoogleSubject ?? byEmail;
  if (existing) {
    const ownsVerifiedEmail = existing.email === email || !byEmail || byEmail.id === existing.id;
    if (!ownsVerifiedEmail) return 'denied';

    await prisma.student.update({
      where: { id: existing.id },
      data: {
        googleSubject,
        email,
        isEmailVerified: true,
        name: existing.name || name,
      },
    });
    return 'linked';
  }

  return 'notFound';
}
