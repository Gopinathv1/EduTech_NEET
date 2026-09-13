import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    student: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { upsertGoogleStudent } from '@/lib/auth/google';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const p = prisma as any;
type GoogleArgs = Parameters<typeof upsertGoogleStudent>[0];

function googleArgs(email = 'Student@Gmail.com', providerAccountId = 'google-subject-1') {
  return {
    user: { email, name: 'Google Student' },
    account: {
      provider: 'google',
      providerAccountId,
      type: 'oauth',
    },
    profile: {
      email,
      email_verified: true,
      name: 'Google Student',
    },
  } as unknown as GoogleArgs;
}

beforeEach(() => vi.clearAllMocks());

describe('upsertGoogleStudent', () => {
  it('links a verified Google email to an existing password student without changing password or mobile', async () => {
    const existing = {
      id: 'student-1',
      name: 'Password Student',
      email: 'student@gmail.com',
      mobile: '+919876543210',
      passwordHash: 'existing-hash',
    };
    p.student.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(existing);
    p.student.update.mockResolvedValue({ ...existing, googleSubject: 'google-subject-1' });

    await expect(upsertGoogleStudent(googleArgs())).resolves.toBe(true);

    expect(p.student.update).toHaveBeenCalledWith({
      where: { id: 'student-1' },
      data: {
        googleSubject: 'google-subject-1',
        email: 'student@gmail.com',
        isEmailVerified: true,
        name: 'Password Student',
      },
    });
    expect(p.student.create).not.toHaveBeenCalled();
  });

  it('creates a profile-incomplete student for a brand-new verified Google account', async () => {
    p.student.findUnique.mockResolvedValue(null);
    p.student.create.mockResolvedValue({ id: 'student-2' });

    await expect(upsertGoogleStudent(googleArgs('new@gmail.com', 'google-subject-2'))).resolves.toBe(true);

    expect(p.student.create).toHaveBeenCalledWith({
      data: {
        name: 'Google Student',
        email: 'new@gmail.com',
        mobile: null,
        googleSubject: 'google-subject-2',
        isEmailVerified: true,
        isMobileVerified: false,
        preferredLanguage: 'en',
      },
    });
  });

  it('allows an already-linked Google account to sign in directly', async () => {
    const existing = {
      id: 'student-1',
      name: 'Linked Student',
      email: 'student@gmail.com',
      googleSubject: 'google-subject-1',
    };
    p.student.findUnique
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(existing);
    p.student.update.mockResolvedValue(existing);

    await expect(upsertGoogleStudent(googleArgs())).resolves.toBe(true);

    expect(p.student.update).toHaveBeenCalledWith({
      where: { id: 'student-1' },
      data: {
        googleSubject: 'google-subject-1',
        email: 'student@gmail.com',
        isEmailVerified: true,
        name: 'Linked Student',
      },
    });
  });

  it('refuses to merge when Google subject and verified email belong to different students', async () => {
    p.student.findUnique
      .mockResolvedValueOnce({ id: 'google-owner', email: 'old@gmail.com', googleSubject: 'google-subject-1' })
      .mockResolvedValueOnce({ id: 'email-owner', email: 'student@gmail.com', passwordHash: 'hash' });

    await expect(upsertGoogleStudent(googleArgs())).resolves.toBe(false);

    expect(p.student.update).not.toHaveBeenCalled();
    expect(p.student.create).not.toHaveBeenCalled();
  });

  it('rejects unverified Google emails', async () => {
    const args = googleArgs();
    args.profile = { email: 'student@gmail.com', email_verified: false } as GoogleArgs['profile'];

    await expect(upsertGoogleStudent(args)).resolves.toBe(false);

    expect(p.student.findUnique).not.toHaveBeenCalled();
  });
});
