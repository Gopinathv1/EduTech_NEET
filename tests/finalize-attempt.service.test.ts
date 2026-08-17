import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
import { finalizeAttempt } from '@/lib/attempts/service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const p = prisma as any;

function makeTx() {
  return {
    testAttempt: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'att1',
        status: 'IN_PROGRESS',
        questionOrder: ['q1', 'q2', 'q3'],
        studentId: 's1',
        seed: null,
        shuffleOptions: false,
        test: { title: { en: 'Mock Test' } },
      }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    question: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'q1',
          subjectId: 'phy',
          chapterId: 'c1',
          questionType: 'SINGLE_CORRECT',
          translations: [{ correctOption: 'A', optionA: 'A1', optionB: 'B1', optionC: 'C1', optionD: 'D1' }],
        },
        {
          id: 'q2',
          subjectId: 'phy',
          chapterId: 'c1',
          questionType: 'SINGLE_CORRECT',
          translations: [{ correctOption: 'B', optionA: 'A2', optionB: 'B2', optionC: 'C2', optionD: 'D2' }],
        },
        {
          id: 'q3',
          subjectId: 'chem',
          chapterId: 'c2',
          questionType: 'SINGLE_CORRECT',
          translations: [{ correctOption: 'D', optionA: 'A3', optionB: 'B3', optionC: 'C3', optionD: 'D3' }],
        },
      ]),
    },
    answer: {
      findMany: vi.fn().mockResolvedValue([
        { questionId: 'q1', selectedOption: 'A', timeSpentSeconds: 25 },
        { questionId: 'q2', selectedOption: 'C', timeSpentSeconds: 40 },
      ]),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    result: {
      create: vi.fn().mockResolvedValue({ id: 'r1' }),
    },
    notification: {
      create: vi.fn().mockResolvedValue({ id: 'n1' }),
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('finalizeAttempt', () => {
  it('scores, persists result analysis, marks answers, and creates a result notification', async () => {
    const tx = makeTx();
    p.$transaction.mockImplementation((cb: (txArg: unknown) => Promise<unknown>) => cb(tx));

    const out = await finalizeAttempt('att1', { auto: false });

    expect(out).toEqual({ ok: true, alreadyDone: false, status: 'SUBMITTED' });
    expect(tx.testAttempt.updateMany).toHaveBeenCalledWith({
      where: { id: 'att1', status: 'IN_PROGRESS' },
      data: { status: 'SUBMITTED', submittedAt: expect.any(Date), remainingSeconds: 0 },
    });
    expect(tx.answer.updateMany).toHaveBeenCalledWith({
      where: { attemptId: 'att1', questionId: 'q1' },
      data: { isCorrect: true },
    });
    expect(tx.answer.updateMany).toHaveBeenCalledWith({
      where: { attemptId: 'att1', questionId: 'q2' },
      data: { isCorrect: false },
    });
    expect(tx.result.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        attemptId: 'att1',
        totalQuestions: 3,
        correct: 1,
        wrong: 1,
        skipped: 1,
        score: 3,
        chapterAnalysis: {
          c1: { correct: 1, wrong: 1, skipped: 0, total: 2 },
          c2: { correct: 0, wrong: 0, skipped: 1, total: 1 },
        },
        subjectAnalysis: {
          phy: { correct: 1, wrong: 1, skipped: 0, total: 2 },
          chem: { correct: 0, wrong: 0, skipped: 1, total: 1 },
        },
        timeAnalysis: {
          totalSeconds: 65,
          bySubject: { phy: 65, chem: 0 },
          byQuestion: { q1: 25, q2: 40, q3: 0 },
        },
      }),
    });
    expect(tx.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        student: { connect: { id: 's1' } },
        type: 'RESULT',
        linkUrl: '/student/results/att1',
      }),
    });
  });

  it('is idempotent when the attempt is already finalised', async () => {
    const tx = makeTx();
    tx.testAttempt.findUnique.mockResolvedValueOnce({
      id: 'att1',
      status: 'SUBMITTED',
      questionOrder: ['q1'],
      studentId: 's1',
      seed: null,
      shuffleOptions: false,
      test: { title: { en: 'Mock Test' } },
    });
    p.$transaction.mockImplementation((cb: (txArg: unknown) => Promise<unknown>) => cb(tx));

    const out = await finalizeAttempt('att1', { auto: false });

    expect(out).toEqual({ ok: true, alreadyDone: true, status: 'SUBMITTED' });
    expect(tx.result.create).not.toHaveBeenCalled();
    expect(tx.notification.create).not.toHaveBeenCalled();
  });
});
