import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { writeQuestionVersion } from '@/lib/admin/question-version';
import { isAllowedOfficialSource } from '@/lib/question-bank/official-sources';
import { logAudit } from '@/lib/audit';

export type QuestionApprover = { sub: string; name: string };

export class QuestionApprovalError extends Error {
  constructor(
    public readonly code: 'notFound' | 'invalidReviewTransition' | 'approvalValidation',
    public readonly issues: string[] = [],
  ) {
    super(code);
  }
}

const approvalQuestionSelect = {
  id: true,
  externalId: true,
  exam: true,
  examYear: true,
  topic: true,
  chapterId: true,
  questionType: true,
  sourceType: true,
  sourceName: true,
  sourceUrl: true,
  officialAnswerKeyReference: true,
  reviewState: true,
  translations: true,
} satisfies Prisma.QuestionSelect;

type ApprovalQuestion = Prisma.QuestionGetPayload<{ select: typeof approvalQuestionSelect }>;

export type QuestionApprovalOptions = {
  /** Guarded release scripts may supply their already-validated direct client. */
  client?: PrismaClient;
  /** Keep release audit records atomic with their transition and version. */
  atomicAudit?: boolean;
  /** JEE's canonical taxonomy permits a verified chapter without a finer topic. */
  allowChapterOnly?: boolean;
  /** Refuse a release transition if the preflighted question changed meanwhile. */
  expectedUpdatedAt?: Date;
};

export function approvalIssues(question: ApprovalQuestion, options: Pick<QuestionApprovalOptions, 'allowChapterOnly'> = {}): string[] {
  const issues: string[] = [];
  const en = question.translations.find((translation) => translation.language === 'en');
  if (!question.externalId) issues.push('A deterministic external ID is required.');
  if (!question.exam || !['NEET', 'JEE'].includes(question.exam)) issues.push('Exam must be NEET or JEE.');
  if (!question.topic && !(options.allowChapterOnly && question.exam === 'JEE' && question.sourceType === 'HISTORICAL_VERIFIED')) issues.push('Topic is required.');
  if (!question.chapterId) issues.push('Chapter is required.');
  if (!question.sourceType || !question.sourceName) issues.push('Source type and source name are required.');
  if (!en?.questionText?.trim() || !en.explanation?.trim()) issues.push('English question text and explanation are required.');
  if (en) {
    if (question.questionType === 'NUMERICAL_VALUE') {
      if (en.numericAnswer === null) issues.push('A numerical answer is required.');
      if (en.numericTolerance !== null && en.numericTolerance.isNegative()) issues.push('Numerical tolerance cannot be negative.');
    } else {
      const options = [en.optionA, en.optionB, en.optionC, en.optionD].map((option) => option?.trim().toLocaleLowerCase() ?? '');
      if (options.some((option) => !option)) issues.push('All four answer options are required.');
      if (new Set(options).size !== options.length) issues.push('Answer options must be distinct.');
      if (!en.correctOption || !['A', 'B', 'C', 'D'].includes(en.correctOption)) issues.push('A valid correct option is required.');
    }
  }
  if (question.sourceType === 'OFFICIAL_NTA' || question.sourceType === 'OFFICIAL_PREVIOUS_YEAR') {
    if (!question.examYear) issues.push('Official questions require an exam year.');
    if (!question.sourceUrl || !isAllowedOfficialSource(question.sourceUrl)) issues.push('Official questions require an allowlisted NTA/NIC/NMC source URL.');
  }
  if (question.sourceType === 'HISTORICAL_VERIFIED') {
    if (!question.examYear) issues.push('Historically verified questions require an exam year.');
    if (!question.sourceUrl) issues.push('Historically verified questions require the actual wording archive URL.');
    if (!question.officialAnswerKeyReference) issues.push('Historically verified questions require an authoritative answer-key reference.');
  }
  return issues;
}

export async function loadQuestionForApproval(id: string, client = prisma): Promise<ApprovalQuestion | null> {
  return client.question.findUnique({ where: { id }, select: approvalQuestionSelect });
}

export async function approveQuestion(
  id: string,
  admin: QuestionApprover,
  options: QuestionApprovalOptions & { note?: string; allowAlreadyApproved?: boolean } = {},
): Promise<{ reviewState: 'APPROVED'; alreadyApproved: boolean }> {
  const client = options.client ?? prisma;
  const question = await loadQuestionForApproval(id, client);
  if (!question) throw new QuestionApprovalError('notFound');
  if (question.reviewState === 'APPROVED' && options.allowAlreadyApproved) {
    return { reviewState: 'APPROVED', alreadyApproved: true };
  }
  if (question.reviewState !== 'REVIEW_REQUIRED') throw new QuestionApprovalError('invalidReviewTransition');
  const issues = approvalIssues(question, options);
  if (issues.length) throw new QuestionApprovalError('approvalValidation', issues);

  const note = options.note?.trim() || null;
  const now = new Date();
  await client.$transaction(async (tx) => {
    const updated = await tx.question.updateMany({
      where: { id, reviewState: 'REVIEW_REQUIRED', ...(options.expectedUpdatedAt ? { updatedAt: options.expectedUpdatedAt } : {}) },
      data: {
        reviewState: 'APPROVED',
        reviewNote: note,
        reviewer: admin.name,
        reviewedAt: now,
        status: 'PUBLISHED',
        contentClass: 'PRODUCTION',
        isActive: true,
      },
    });
    if (updated.count !== 1) throw new QuestionApprovalError('invalidReviewTransition');
    await writeQuestionVersion(tx, id, 'review:APPROVED', admin);
    if (options.atomicAudit) await tx.auditLog.create({ data: {
      adminId: admin.sub, adminName: admin.name, action: 'question.review.approved',
      entityType: 'Question', entityId: id, details: { note },
    } });
  }, options.atomicAudit ? { maxWait: 10_000, timeout: 30_000 } : undefined);

  if (!options.atomicAudit) await logAudit(admin, {
    action: 'question.review.approved',
    entityType: 'Question',
    entityId: id,
    details: { note },
  });
  return { reviewState: 'APPROVED', alreadyApproved: false };
}

export async function submitImportedQuestionForReview(
  id: string,
  admin: QuestionApprover,
  topic: string | null,
  options: QuestionApprovalOptions = {},
): Promise<void> {
  const client = options.client ?? prisma;
  const question = await loadQuestionForApproval(id, client);
  if (!question) throw new QuestionApprovalError('notFound');
  if (question.reviewState === 'REVIEW_REQUIRED' || question.reviewState === 'APPROVED') return;
  if (question.reviewState !== 'DRAFT') throw new QuestionApprovalError('invalidReviewTransition');
  const normalizedTopic = topic?.trim() ?? null;
  const issues = approvalIssues({ ...question, topic: normalizedTopic }, options);
  if (issues.length) throw new QuestionApprovalError('approvalValidation', issues);

  await client.$transaction(async (tx) => {
    const updated = await tx.question.updateMany({
      where: { id, reviewState: 'DRAFT', ...(options.expectedUpdatedAt ? { updatedAt: options.expectedUpdatedAt } : {}) },
      data: {
        topic: normalizedTopic,
        reviewState: 'REVIEW_REQUIRED',
        reviewNote: null,
        reviewer: null,
        reviewedAt: null,
        status: 'REVIEW',
        contentClass: 'PRODUCTION',
        isActive: false,
      },
    });
    if (updated.count !== 1) throw new QuestionApprovalError('invalidReviewTransition');
    await writeQuestionVersion(tx, id, 'updated', admin);
    if (options.atomicAudit) await tx.auditLog.create({ data: {
      adminId: admin.sub, adminName: admin.name, action: 'question.update',
      entityType: 'Question', entityId: id, details: { importedSelectionTransition: true },
    } });
  }, options.atomicAudit ? { maxWait: 10_000, timeout: 30_000 } : undefined);
  if (!options.atomicAudit) await logAudit(admin, {
    action: 'question.update',
    entityType: 'Question',
    entityId: id,
    details: { importedSelectionTransition: true },
  });
}
