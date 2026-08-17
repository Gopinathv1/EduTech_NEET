import { describe, it, expect, vi, beforeEach } from 'vitest';

const generator = vi.hoisted(() => ({
  generateForAttempt: vi.fn(),
}));

vi.mock('@/lib/generator/plan', () => generator);
vi.mock('@/lib/prisma', () => ({
  prisma: {
    test: { findUnique: vi.fn() },
    testEntitlement: { count: vi.fn(), upsert: vi.fn() },
    testAttempt: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { startOrResumeAttempt } from '@/lib/attempts/service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const p = prisma as any;

const publishedPaidTest = {
  id: 't1',
  isPublished: true,
  durationMinutes: 180,
  availableLanguages: ['en', 'ta'],
  price: 30,
};

beforeEach(() => {
  vi.clearAllMocks();
  p.test.findUnique.mockResolvedValue(publishedPaidTest);
  p.testEntitlement.count.mockResolvedValue(1);
  p.testEntitlement.upsert.mockResolvedValue({});
  p.testAttempt.findFirst.mockResolvedValue(null);
  p.testAttempt.create.mockResolvedValue({ id: 'att1' });
  p.testAttempt.update.mockResolvedValue({});
  p.testAttempt.delete.mockResolvedValue({});
  generator.generateForAttempt.mockResolvedValue({ questionIds: ['q1', 'q2'] });
});

describe('startOrResumeAttempt', () => {
  it('starts a paid owned mock test and freezes generated questions', async () => {
    const out = await startOrResumeAttempt('s1', 't1', 'en');

    expect(out).toEqual({ ok: true, attemptId: 'att1', resumed: false });
    expect(p.testAttempt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          studentId: 's1',
          testId: 't1',
          selectedLanguage: 'en',
          remainingSeconds: 10_800,
          shuffleOptions: true,
        }),
      }),
    );
    expect(generator.generateForAttempt).toHaveBeenCalledWith('t1', 'en', 'att1');
    expect(p.testAttempt.update).toHaveBeenCalledWith({
      where: { id: 'att1' },
      data: { questionOrder: ['q1', 'q2'], seed: 'att1' },
    });
  });

  it('blocks a paid test when the student does not own it', async () => {
    p.testEntitlement.count.mockResolvedValue(0);

    const out = await startOrResumeAttempt('s1', 't1', 'en');

    expect(out).toEqual({ ok: false, code: 'notOwned' });
    expect(p.testAttempt.create).not.toHaveBeenCalled();
  });

  it('auto-grants and starts a free published mock test', async () => {
    p.test.findUnique.mockResolvedValue({ ...publishedPaidTest, price: 0 });
    p.testEntitlement.count.mockResolvedValue(0);

    const out = await startOrResumeAttempt('s1', 't1', 'ta');

    expect(out).toEqual({ ok: true, attemptId: 'att1', resumed: false });
    expect(p.testEntitlement.upsert).toHaveBeenCalledWith({
      where: { studentId_testId: { studentId: 's1', testId: 't1' } },
      create: { studentId: 's1', testId: 't1', source: 'FREE' },
      update: {},
    });
  });

  it('resumes an existing in-progress attempt', async () => {
    p.testAttempt.findFirst.mockResolvedValue({ id: 'att-existing', status: 'IN_PROGRESS' });

    const out = await startOrResumeAttempt('s1', 't1', 'en');

    expect(out).toEqual({ ok: true, attemptId: 'att-existing', resumed: true });
    expect(p.testAttempt.create).not.toHaveBeenCalled();
  });

  it('blocks unavailable languages', async () => {
    p.test.findUnique.mockResolvedValue({ ...publishedPaidTest, availableLanguages: ['en'] });

    const out = await startOrResumeAttempt('s1', 't1', 'ta');

    expect(out).toEqual({ ok: false, code: 'languageUnavailable' });
    expect(p.testAttempt.create).not.toHaveBeenCalled();
  });
});
