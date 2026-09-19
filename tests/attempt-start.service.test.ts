import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';

const generator = vi.hoisted(() => ({
  generateForAttempt: vi.fn(),
}));

vi.mock('@/lib/generator/plan', () => generator);
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    test: { findUnique: vi.fn() },
    testAttempt: {
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    paidAttemptCredit: { findFirst: vi.fn(), update: vi.fn() },
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

const originalPaidRetriesFlag = process.env.EXAM_PAID_RETRIES_ENABLED;

afterEach(() => {
  if (originalPaidRetriesFlag === undefined) delete process.env.EXAM_PAID_RETRIES_ENABLED;
  else process.env.EXAM_PAID_RETRIES_ENABLED = originalPaidRetriesFlag;
});

beforeEach(() => {
  process.env.EXAM_PAID_RETRIES_ENABLED = 'false';
  vi.clearAllMocks();
  p.$transaction.mockImplementation((fn: (tx: unknown) => unknown) => fn(p));
  p.test.findUnique.mockResolvedValue(publishedPaidTest);
  p.testAttempt.count.mockResolvedValue(0);
  p.testAttempt.findFirst.mockResolvedValue(null);
  p.testAttempt.create.mockResolvedValue({ id: 'att1' });
  p.testAttempt.update.mockResolvedValue({});
  p.testAttempt.delete.mockResolvedValue({});
  p.paidAttemptCredit.findFirst.mockResolvedValue(null);
  p.paidAttemptCredit.update.mockResolvedValue({});
  generator.generateForAttempt.mockResolvedValue({ questionIds: ['q1', 'q2'] });
});

describe('startOrResumeAttempt', () => {
  it('starts a mock test without requiring payment and freezes generated questions', async () => {
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
    expect(generator.generateForAttempt).toHaveBeenCalledWith('t1', 'en', expect.any(String));
    expect(p.testAttempt.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ questionOrder: ['q1', 'q2'], seed: expect.any(String) }),
    }));
    expect(p.testAttempt.update).not.toHaveBeenCalled();
  });

  it.each([0, 1, 2, 3, 4, 9])('allows a free attempt after %i previous attempts in marketing mode', async (used) => {
    p.testAttempt.count.mockResolvedValue(used);

    const out = await startOrResumeAttempt('s1', 't1', 'ta');

    expect(out).toEqual({ ok: true, attemptId: 'att1', resumed: false });
    expect(p.paidAttemptCredit.findFirst).not.toHaveBeenCalled();
  });

  it('resumes an existing in-progress attempt', async () => {
    p.testAttempt.findFirst.mockResolvedValue({ id: 'att-existing', status: 'IN_PROGRESS' });

    const out = await startOrResumeAttempt('s1', 't1', 'en');

    expect(out).toEqual({ ok: true, attemptId: 'att-existing', resumed: true });
    expect(p.testAttempt.create).not.toHaveBeenCalled();
  });

  it('requires payment credit for the fourth attempt only when paid retries are enabled', async () => {
    process.env.EXAM_PAID_RETRIES_ENABLED = 'true';
    p.testAttempt.count.mockResolvedValue(3);

    const out = await startOrResumeAttempt('s1', 't1', 'en');

    expect(out).toEqual({ ok: false, code: 'paymentRequired' });
    expect(p.testAttempt.count).toHaveBeenCalledWith({ where: { studentId: 's1', testId: 't1' } });
    expect(p.testAttempt.create).not.toHaveBeenCalled();
  });

  it('consumes one matching credit to create the fourth attempt only when paid retries are enabled', async () => {
    process.env.EXAM_PAID_RETRIES_ENABLED = 'true';
    p.testAttempt.count.mockResolvedValue(3);
    p.paidAttemptCredit.findFirst.mockResolvedValue({ id: 'credit_1' });
    const out = await startOrResumeAttempt('s1', 't1', 'en');
    expect(out).toEqual({ ok: true, attemptId: 'att1', resumed: false });
    expect(p.paidAttemptCredit.update).toHaveBeenCalledWith({ where: { id: 'credit_1' }, data: expect.objectContaining({ attemptId: 'att1', consumedAt: expect.any(Date) }) });
  });

  it('blocks unavailable languages', async () => {
    p.test.findUnique.mockResolvedValue({ ...publishedPaidTest, availableLanguages: ['en'] });

    const out = await startOrResumeAttempt('s1', 't1', 'ta');

    expect(out).toEqual({ ok: false, code: 'languageUnavailable' });
    expect(p.testAttempt.create).not.toHaveBeenCalled();
  });
});

  it.each([0, 1, 2])('allows paid-mode free attempt with %i previous attempts', async used => {
    process.env.EXAM_PAID_RETRIES_ENABLED = 'true';
    p.testAttempt.count.mockResolvedValue(used);
    expect((await startOrResumeAttempt('s1', 't1', 'en')).ok).toBe(true);
  });
  it.each([['s2', 't1'], ['s1', 't2']])('scopes quota to %s and %s', async (studentId, testId) => {
    await startOrResumeAttempt(studentId, testId, 'en');
    expect(p.testAttempt.count).toHaveBeenCalledWith({ where: { studentId, testId } });
  });
  it('resumes a session inserted by a concurrent request', async () => {
    p.testAttempt.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'concurrent' });
    expect(await startOrResumeAttempt('s1', 't1', 'en')).toEqual({ ok: true, attemptId: 'concurrent', resumed: true });
    expect(p.testAttempt.create).not.toHaveBeenCalled();
  });
  it('does not consume a slot when question generation fails', async () => {
    generator.generateForAttempt.mockResolvedValue({ questionIds: [] });
    expect(await startOrResumeAttempt('s1', 't1', 'en')).toEqual({ ok: false, code: 'generationFailed' });
    expect(p.testAttempt.create).not.toHaveBeenCalled();
  });
