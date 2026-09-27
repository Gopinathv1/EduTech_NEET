import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({ findUnique: vi.fn(), updateMany: vi.fn(), transaction: vi.fn() }));
const versioning = vi.hoisted(() => ({ writeQuestionVersion: vi.fn() }));
const audit = vi.hoisted(() => ({ logAudit: vi.fn() }));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    question: { findUnique: db.findUnique },
    $transaction: db.transaction,
  },
}));
vi.mock('@/lib/admin/question-version', () => versioning);
vi.mock('@/lib/audit', () => audit);

import { approveQuestion, QuestionApprovalError } from '@/lib/admin/question-approval';

const admin = { sub: 'admin-1', name: 'Reviewer' };
const question = {
  id: 'selected-1', externalId: 'sivora-authored:selected-1', exam: 'NEET', examYear: null,
  topic: 'Motion', chapterId: 'chapter-1', questionType: 'SINGLE_CORRECT',
  sourceType: 'SIVORA_AUTHORED', sourceName: 'SIVORA editorial', sourceUrl: null,
  reviewState: 'REVIEW_REQUIRED',
  translations: [{ language: 'en', questionText: 'Question?', optionA: 'A', optionB: 'B', optionC: 'C', optionD: 'D', correctOption: 'A', explanation: 'Because.', numericAnswer: null, numericTolerance: null }],
};

beforeEach(() => {
  vi.clearAllMocks();
  db.findUnique.mockResolvedValue(question);
  db.updateMany.mockResolvedValue({ count: 1 });
  db.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback({ question: { updateMany: db.updateMany } }));
});

describe('approveQuestion', () => {
  it('applies the normal approval transition and audit semantics', async () => {
    await expect(approveQuestion('selected-1', admin)).resolves.toEqual({ reviewState: 'APPROVED', alreadyApproved: false });
    expect(db.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'selected-1', reviewState: 'REVIEW_REQUIRED' },
      data: expect.objectContaining({ reviewState: 'APPROVED', status: 'PUBLISHED', contentClass: 'PRODUCTION', isActive: true, reviewer: 'Reviewer' }),
    }));
    expect(versioning.writeQuestionVersion).toHaveBeenCalledWith(expect.anything(), 'selected-1', 'review:APPROVED', admin);
    expect(audit.logAudit).toHaveBeenCalledOnce();
  });

  it('is idempotent only when explicitly requested by maintenance tooling', async () => {
    db.findUnique.mockResolvedValue({ ...question, reviewState: 'APPROVED' });
    await expect(approveQuestion('selected-1', admin, { allowAlreadyApproved: true })).resolves.toEqual({ reviewState: 'APPROVED', alreadyApproved: true });
    expect(db.updateMany).not.toHaveBeenCalled();
  });

  it('rejects invalid states without touching any question', async () => {
    db.findUnique.mockResolvedValue({ ...question, reviewState: 'DRAFT' });
    await expect(approveQuestion('selected-1', admin)).rejects.toMatchObject({ code: 'invalidReviewTransition' } satisfies Partial<QuestionApprovalError>);
    expect(db.updateMany).not.toHaveBeenCalled();
  });

  it('rejects content that fails approval validation', async () => {
    db.findUnique.mockResolvedValue({ ...question, topic: null });
    await expect(approveQuestion('selected-1', admin)).rejects.toMatchObject({ code: 'approvalValidation' } satisfies Partial<QuestionApprovalError>);
    expect(db.updateMany).not.toHaveBeenCalled();
  });
});
