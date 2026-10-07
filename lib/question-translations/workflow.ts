import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { canonicalContentHash, CONTENT_FIELDS, translationQa } from './content';

const text = z.string().max(8000);
export const saveTranslationSchema = z.object({
  revision: z.number().int().min(0),
  questionText: text.min(1), optionA: text.nullable(), optionB: text.nullable(), optionC: text.nullable(), optionD: text.nullable(),
  explanation: text.nullable(),
  translationSource: z.enum(['SIVORA_TRANSLATION', 'OFFICIAL_TRANSLATION']),
  sourceReference: z.string().trim().min(1).max(2000),
  submitForReview: z.boolean(),
}).strict();
export const reviewTranslationSchema = z.object({
  revision: z.number().int().min(1), action: z.enum(['APPROVE', 'REJECT', 'NEEDS_CORRECTION']),
  note: z.string().trim().min(1).max(2000),
  meaningAndOptionIdentityChecked: z.boolean().optional(),
  officialWordingSourceChecked: z.boolean().optional(),
}).strict();
export class TranslationWorkflowError extends Error {
  constructor(public code: string, public status: number, public issues: string[] = []) { super(code); }
}
type Actor = { sub: string; name: string };

/** No Question, English translation, attempt, answer, monitoring or scoring writes. */
export async function mutateTranslation(questionId: string, language: 'ta' | 'hi', actor: Actor,
  operation: { save: z.infer<typeof saveTranslationSchema> } | { review: z.infer<typeof reviewTranslationSchema> }) {
  try {
    return await prisma.$transaction(async tx => {
      const question = await tx.question.findUnique({ where: { id: questionId }, select: { questionType: true,
        translations: { where: { language: 'en' } } } });
      const en = question?.translations[0];
      if (!question || !en) throw new TranslationWorkflowError('notFound', 404);
      const prior = await tx.questionTranslation.findUnique({ where: { questionId_language: { questionId, language } } });
      const expected = 'save' in operation ? operation.save.revision : operation.review.revision;
      if ((prior?.revision ?? 0) !== expected) throw new TranslationWorkflowError('translationConflict', 409);
      const binding = canonicalContentHash(question.questionType, en);
      let data: Prisma.QuestionTranslationUncheckedCreateInput;
      let action: string;
      if ('save' in operation) {
        const input = operation.save;
        const qa = translationQa(question.questionType, en, input);
        if (input.submitForReview && qa.length) throw new TranslationWorkflowError('translationQa', 400, qa);
        if (input.translationSource === 'OFFICIAL_TRANSLATION' && !/^https:\/\//.test(input.sourceReference)) {
          throw new TranslationWorkflowError('officialWordingReferenceRequired', 400);
        }
        // Any edit of approved wording is review-required, even a draft save.
        const reviewState = prior?.reviewState === 'APPROVED' || input.submitForReview ? 'REVIEW_REQUIRED' : 'DRAFT';
        data = { questionId, language, ...Object.fromEntries(CONTENT_FIELDS.map(key => [key, input[key]])),
          questionText: input.questionText, translationSource: input.translationSource, sourceReference: input.sourceReference,
          reviewState, reviewed: false, reviewedById: null, reviewedByName: null, reviewedAt: null, reviewNote: null,
          canonicalContentHash: binding, revision: expected + 1,
          // These legacy fields are deliberately absent from translated content.
          correctOption: null, numericAnswer: null, numericTolerance: null,
        };
        action = `translation:${reviewState}`;
      } else {
        const input = operation.review;
        if (!prior || !['REVIEW_REQUIRED', 'NEEDS_CORRECTION'].includes(prior.reviewState)) throw new TranslationWorkflowError('invalidReviewTransition', 409);
        if (input.action === 'APPROVE') {
          const qa = translationQa(question.questionType, en, prior);
          if (prior.canonicalContentHash !== binding) qa.push('Canonical English changed; save and review the current revision.');
          if (!prior.translationSource || !prior.sourceReference) qa.push('Translation wording provenance is required.');
          if (!input.meaningAndOptionIdentityChecked) qa.push('Explicit meaning, completeness and option identity review is required.');
          if (prior.translationSource === 'OFFICIAL_TRANSLATION' && (!input.officialWordingSourceChecked || !/^https:\/\//.test(prior.sourceReference ?? ''))) qa.push('The official translated wording source must be checked explicitly.');
          if (qa.length) throw new TranslationWorkflowError('translationQa', 400, qa);
        }
        const reviewState = input.action === 'APPROVE' ? 'APPROVED' : input.action === 'REJECT' ? 'REJECTED' : 'NEEDS_CORRECTION';
        data = { questionId, language, questionText: prior.questionText, revision: expected + 1,
          reviewState, reviewed: reviewState === 'APPROVED', reviewedById: actor.sub, reviewedByName: actor.name,
          reviewedAt: new Date(), reviewNote: input.note };
        action = `translation:${reviewState}`;
      }
      let row;
      if (prior) {
        const updated = await tx.questionTranslation.updateMany({ where: { id: prior.id, revision: expected }, data });
        if (updated.count !== 1) throw new TranslationWorkflowError('translationConflict', 409);
        row = await tx.questionTranslation.findUniqueOrThrow({ where: { id: prior.id } });
      } else row = await tx.questionTranslation.create({ data });
      const snapshot = JSON.parse(JSON.stringify(row)) as Prisma.InputJsonValue;
      await tx.questionTranslationVersion.create({ data: { translationId: row.id, revision: row.revision, action,
        editedById: actor.sub, editedByName: actor.name, snapshot } });
      await tx.auditLog.create({ data: { adminId: actor.sub, adminName: actor.name, action,
        entityType: 'QuestionTranslation', entityId: row.id,
        details: { questionId, language, revision: row.revision, reviewState: row.reviewState } } });
      return { revision: row.revision, reviewState: row.reviewState };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2034', 'P2002'].includes(error.code)) throw new TranslationWorkflowError('translationConflict', 409);
    throw error;
  }
}
