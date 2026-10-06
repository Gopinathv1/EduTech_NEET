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

import { approvalIssues, approveQuestion, QuestionApprovalError, submitImportedQuestionForReview } from '@/lib/admin/question-approval';

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

  it('legitimately submits an imported draft with its manifest topic before approval', async () => {
    db.findUnique.mockResolvedValue({ ...question, topic: null, reviewState: 'DRAFT' });
    await submitImportedQuestionForReview('selected-1', admin, 'motion');
    expect(db.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'selected-1', reviewState: 'DRAFT' },
      data: expect.objectContaining({ topic: 'motion', reviewState: 'REVIEW_REQUIRED', status: 'REVIEW', isActive: false }),
    }));
    expect(versioning.writeQuestionVersion).toHaveBeenCalledWith(expect.anything(), 'selected-1', 'updated', admin);
  });

  it('keeps the default topic requirement while allowing verified canonical JEE chapters explicitly', () => {
    const chapterOnly = { ...question, exam: 'JEE', sourceType: 'HISTORICAL_VERIFIED', sourceUrl: 'https://archive.example/paper',
      officialAnswerKeyReference: 'https://nta.ac.in/final-key.pdf', examYear: 2025, topic: null } as Parameters<typeof approvalIssues>[0];
    expect(approvalIssues(chapterOnly)).toContain('Topic is required.');
    expect(approvalIssues(chapterOnly, { allowChapterOnly: true })).toEqual([]);
    expect(approvalIssues({ ...chapterOnly, exam: 'NEET' }, { allowChapterOnly: true })).toContain('Topic is required.');
    expect(approvalIssues({ ...chapterOnly, sourceType: 'SIVORA_AUTHORED' }, { allowChapterOnly: true })).toContain('Topic is required.');
  });

  it('uses the supplied direct client and writes its release audit inside the approval transaction', async () => {
    const createAudit = vi.fn().mockResolvedValue({});
    const findUnique = vi.fn().mockResolvedValue(question);
    const transaction = vi.fn().mockImplementation(async callback => callback({ question: { updateMany: db.updateMany }, auditLog: { create: createAudit } }));
    const client = { question: { findUnique }, $transaction: transaction } as unknown as NonNullable<Parameters<typeof approveQuestion>[2]>['client'];
    const expectedUpdatedAt = new Date('2025-01-01T00:00:00Z');
    await approveQuestion('selected-1', admin, { client, atomicAudit: true, expectedUpdatedAt });
    expect(db.findUnique).not.toHaveBeenCalled();
    expect(db.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'selected-1', reviewState: 'REVIEW_REQUIRED', updatedAt: expectedUpdatedAt } }));
    expect(createAudit).toHaveBeenCalledWith({ data: expect.objectContaining({ action: 'question.review.approved', entityId: 'selected-1' }) });
    expect(audit.logAudit).not.toHaveBeenCalled();
  });

  it('propagates an atomic audit failure so the release transaction can roll back', async () => {
    const failure = new Error('audit write failed');
    const client = {
      question: { findUnique: vi.fn().mockResolvedValue(question) },
      $transaction: vi.fn().mockImplementation(async callback => callback({ question: { updateMany: db.updateMany }, auditLog: { create: vi.fn().mockRejectedValue(failure) } })),
    } as unknown as NonNullable<Parameters<typeof approveQuestion>[2]>['client'];
    await expect(approveQuestion('selected-1', admin, { client, atomicAudit: true })).rejects.toThrow('audit write failed');
    expect(audit.logAudit).not.toHaveBeenCalled();
  });

  it('preserves a null verified JEE topic during an atomic imported-review transition', async () => {
    const draft = { ...question, exam: 'JEE', examYear: 2025, sourceType: 'HISTORICAL_VERIFIED',
      sourceUrl: 'https://archive.example/paper', officialAnswerKeyReference: 'https://nta.ac.in/final-key.pdf',
      topic: null, reviewState: 'DRAFT' };
    const createAudit = vi.fn().mockResolvedValue({});
    const expectedUpdatedAt = new Date('2025-01-01T00:00:00Z');
    const client = { question: { findUnique: vi.fn().mockResolvedValue(draft) },
      $transaction: vi.fn().mockImplementation(async callback => callback({ question: { updateMany: db.updateMany }, auditLog: { create: createAudit } })),
    } as unknown as NonNullable<Parameters<typeof approveQuestion>[2]>['client'];
    await submitImportedQuestionForReview('selected-1', admin, null, { client, atomicAudit: true, allowChapterOnly: true, expectedUpdatedAt });
    expect(db.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'selected-1', reviewState: 'DRAFT', updatedAt: expectedUpdatedAt },
      data: expect.objectContaining({ topic: null, reviewState: 'REVIEW_REQUIRED' }),
    }));
    expect(createAudit).toHaveBeenCalledWith({ data: expect.objectContaining({ action: 'question.update', entityId: 'selected-1' }) });
    expect(audit.logAudit).not.toHaveBeenCalled();
  });
});
