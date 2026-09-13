import type { Account, Profile, User } from 'next-auth';
import type { AdapterUser } from 'next-auth/adapters';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type GoogleProfile = Profile & {
  email?: string;
  email_verified?: boolean;
  name?: string;
};

export async function upsertGoogleStudent({
  user,
  account,
  profile,
}: {
  user: User | AdapterUser;
  account: Account | null;
  profile?: Profile;
}): Promise<boolean> {
  if (account?.provider !== 'google') return false;
  const googleSubject = account.providerAccountId;
  const p = profile as GoogleProfile | undefined;
  const email = (user.email ?? p?.email ?? '').trim().toLowerCase();
  if (!email || p?.email_verified === false) return false;

  const name = user.name ?? p?.name ?? email.split('@')[0] ?? 'Student';
  const [byGoogleSubject, byEmail] = await Promise.all([
    prisma.student.findUnique({ where: { googleSubject } }),
    prisma.student.findUnique({ where: { email } }),
  ]);

  if (byGoogleSubject && byEmail && byGoogleSubject.id !== byEmail.id) {
    return false;
  }

  const existing = byGoogleSubject ?? byEmail;
  if (existing) {
    const ownsVerifiedEmail = existing.email === email || !byEmail || byEmail.id === existing.id;
    if (!ownsVerifiedEmail) return false;

    await prisma.student.update({
      where: { id: existing.id },
      data: {
        googleSubject,
        email,
        isEmailVerified: true,
        name: existing.name || name,
      },
    });
    return true;
  }

  try {
    await prisma.student.create({
      data: {
        name,
        email,
        mobile: null,
        googleSubject,
        isEmailVerified: true,
        isMobileVerified: false,
        preferredLanguage: 'en',
      },
    });
    return true;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return false;
    }
    throw e;
  }
}
