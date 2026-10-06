import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { questionVersionSnapshot } from '@/lib/admin/question-version';
import {
  assertJeeDatabaseTargets, assertJeeWriteAuthorization, jeeExistingContentIssues, jeeQuestionData,
  JEE_IMPORT_CONFIRMATION, JEE_REQUIRED_RELEASE_ARTIFACTS, loadJeeRelease, projectJeeReleaseCounts,
  jeeReleaseHistoryIssues, type ExistingJeeReleaseQuestion,
} from '@/lib/previous-year/jee-release';
import type { JeeHistoricalQuestion } from '@/lib/previous-year/jee-dataset';

function existing(question: JeeHistoricalQuestion): ExistingJeeReleaseQuestion {
  const data = jeeQuestionData(question, 'jee-subject', 'canonical-chapter');
  const translation = (data.translations!.create as Prisma.QuestionTranslationCreateWithoutQuestionInput);
  return { ...data, id: 'question-row', subjectId: 'jee-subject', chapterId: 'canonical-chapter',
    tags: data.tags as string[], imageUrl: null, licenseReference: null, reviewer: null, reviewNote: null,
    reviewedAt: null, createdAt: new Date(), updatedAt: new Date(),
    translations: [{ ...translation, id: 'translation-row', questionId: 'question-row',
      createdAt: new Date(), updatedAt: new Date() }],
  } as ExistingJeeReleaseQuestion;
}

describe('exact JEE V1 guarded release', () => {
  it('loads every canonical question with its exact key and complete release artifact hashes', async () => {
    const release = await loadJeeRelease();
    expect(release.questions).toHaveLength(218);
    expect(release.quarantine).toHaveLength(67);
    expect(Object.keys(release.artifactHashes).sort()).toEqual([...JEE_REQUIRED_RELEASE_ARTIFACTS].sort());
    expect(release.questions.filter(question => question.year === 2022).every(question => question.originalQuestionNumber === null)).toBe(true);
  });

  it('compares full persisted content and preserves numerical questions without MCQ options', async () => {
    const { questions } = await loadJeeRelease();
    const numerical = questions.find(question => question.questionType === 'NUMERICAL_VALUE')!;
    const row = existing(numerical);
    expect(jeeExistingContentIssues(numerical, row, 'jee-subject', 'canonical-chapter')).toEqual([]);
    expect(row.translations[0].optionA).toBeNull();
    expect(row.translations[0].correctOption).toBeNull();
    expect(jeeExistingContentIssues(numerical, { ...row, questionNature: 'CONCEPTUAL_THEORY' }, 'jee-subject', 'canonical-chapter')).not.toEqual([]);
    expect(jeeExistingContentIssues(numerical, { ...row, translations: [{ ...row.translations[0], numericAnswer: new Prisma.Decimal(numerical.numericAnswer! + 1) }] }, 'jee-subject', 'canonical-chapter')).not.toEqual([]);
    const mcq = questions.find(question => question.questionType === 'SINGLE_CORRECT')!;
    const mcqRow = existing(mcq);
    expect(jeeExistingContentIssues(mcq, { ...mcqRow, translations: [{ ...mcqRow.translations[0], optionA: 'changed option' }] }, 'jee-subject', 'canonical-chapter')).not.toEqual([]);
  });

  it('includes numerical answer and tolerance in immutable question version snapshots', async () => {
    const { questions } = await loadJeeRelease();
    const numerical = questions.find(question => question.questionType === 'NUMERICAL_VALUE')!;
    const snapshot = questionVersionSnapshot(existing(numerical)) as { translations: Array<{ numericAnswer: string; numericTolerance: string }> };
    expect(snapshot.translations[0].numericAnswer).toBe(String(numerical.numericAnswer));
    expect(snapshot.translations[0].numericTolerance).toBe('0');
  });

  it('projects exact lifecycle records for fresh and partially resumed selections', () => {
    expect(projectJeeReleaseCounts(Array.from({ length: 218 }, () => 'MISSING' as const))).toMatchObject({
      questionsToImport: 218, questionsToApprove: 218, reviewTransitions: 218,
      questionVersionRecords: 654, auditLogRecords: 654, importBatches: 9,
      taxonomyWrites: 0, migrations: 0, unrelatedRecordsModified: 0,
    });
    expect(projectJeeReleaseCounts(['MISSING', 'DRAFT', 'REVIEW_REQUIRED', 'APPROVED'])).toMatchObject({
      questionsToImport: 1, questionsToApprove: 3, reviewTransitions: 2, questionVersionRecords: 6, auditLogRecords: 6,
    });
    expect(projectJeeReleaseCounts(['APPROVED'])).toMatchObject({ questionsToImport: 0, questionsToApprove: 0, questionVersionRecords: 0, auditLogRecords: 0 });
  });

  it('rejects different projects even when both URL database names are postgres', () => {
    const pooled = 'postgresql://postgres.projectone:dummy@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
    const direct = 'postgresql://postgres:dummy@db.projectone.supabase.co:5432/postgres';
    expect(assertJeeDatabaseTargets(pooled, direct).direct.direct).toBe(true);
    expect(() => assertJeeDatabaseTargets(pooled, direct.replace('projectone.supabase', 'projecttwo.supabase'))).toThrow('same project/database');
    expect(() => assertJeeDatabaseTargets(pooled, pooled)).toThrow('non-pooled');
    expect(() => assertJeeDatabaseTargets(direct, `${direct}?pgbouncer=true`)).toThrow('non-pooled');
  });

  it('requires the exact release hash and action confirmation only for execution', () => {
    const args = { execute: true, releaseSha256: 'a'.repeat(64), action: 'IMPORT' as const };
    expect(() => assertJeeWriteAuthorization({ ...args, execute: false })).not.toThrow();
    expect(() => assertJeeWriteAuthorization(args)).toThrow('write refused');
    expect(() => assertJeeWriteAuthorization({ ...args, confirmation: JEE_IMPORT_CONFIRMATION, confirmedHash: 'b'.repeat(64) })).toThrow('write refused');
    expect(() => assertJeeWriteAuthorization({ ...args, confirmation: JEE_IMPORT_CONFIRMATION, confirmedHash: args.releaseSha256 })).not.toThrow();
  });

  it('refuses resumed records without the exact transactional history and release hash', async () => {
    const { questions, releaseSha256 } = await loadJeeRelease();
    const row = existing(questions[0]);
    const client = {
      questionVersion: { findMany: vi.fn().mockResolvedValue([{ questionId: row.id, version: 1, action: 'jee-historical:imported' }]) },
      auditLog: { findMany: vi.fn().mockResolvedValue([{ entityId: row.id, action: 'question.jeeHistoricalImport', details: { releaseSha256 } }]) },
    } as unknown as Parameters<typeof jeeReleaseHistoryIssues>[0];
    await expect(jeeReleaseHistoryIssues(client, [row], releaseSha256)).resolves.toEqual([]);
    await expect(jeeReleaseHistoryIssues(client, [row], 'different-release')).resolves.toContain(`${row.externalId}: existing import belongs to a different release hash.`);
    vi.mocked(client.auditLog.findMany).mockResolvedValue([]);
    expect(await jeeReleaseHistoryIssues(client, [row], releaseSha256)).not.toEqual([]);
  });
});
