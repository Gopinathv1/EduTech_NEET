import fs from 'node:fs';
import { PrismaClient, QuestionNature } from '@prisma/client';
import { QUESTION_BANK_V1_TAXONOMY } from '../lib/question-bank/taxonomy';
import nature from '../data/previous-year/neet/question-nature.json';

// Disposable local copies of already-approved records only. Never an import command.
export function assertNeetE2eTarget() {
  for (const name of ['DATABASE_URL', 'DIRECT_URL']) {
    const url = new URL(process.env[name] ?? '');
    if (url.protocol !== 'postgresql:' || url.hostname !== '127.0.0.1' || url.port !== '5547'
      || url.pathname !== '/neet_navigation_test' || url.search) throw Error('Disposable NEET E2E database required');
  }
}
async function main() {
  assertNeetE2eTarget();
  const db = new PrismaClient();
  try {
    if (await db.question.count() || await db.student.count()) throw Error('Fixture requires an empty database');
    const root = 'data/previous-year/neet/release-2013-2025';
    const questions = JSON.parse(fs.readFileSync(`${root}/questions.json`, 'utf8'));
    const manifest = JSON.parse(fs.readFileSync(`${root}/manifest.json`, 'utf8'));
    if (questions.length !== 780) throw Error('Expected sealed 780 approved records');
    for (const q of questions) {
      if (q.year < 2021 || q.approvalEvidence.reviewState !== 'APPROVED') throw Error('Unapproved fixture rejected');
      const subject = await db.subject.upsert({ where: { code: q.subjectCode }, update: {}, create: { code: q.subjectCode, name: { en: q.subjectCode } } });
      const tax = QUESTION_BANK_V1_TAXONOMY.find(t => t.exam === 'NEET' && t.subjectCode === q.subjectCode && t.unitSlug === q.chapterSlug)!;
      const chapterId = `e2e-${q.subjectCode}-${q.chapterSlug}`;
      const chapter = await db.chapter.upsert({ where: { id: chapterId }, update: {}, create: { id: chapterId, subjectId: subject.id, name: { en: tax.unitName }, class: 12 } });
      await db.question.create({ data: { id: q.databaseQuestionId, externalId: q.externalId, subjectId: subject.id, chapterId: chapter.id,
        topic: q.topic, year: q.year, examYear: q.year, exam: 'NEET', paperSession: q.paperSession,
        sourceType: q.sourceType, sourceName: q.sourceName, sourceUrl: q.sourceUrl, officialAnswerKeyReference: q.officialAnswerKeyReference,
        questionType: q.questionType, questionNature: QuestionNature[nature.rows.find(r => r.externalId === q.externalId)!.questionNature as keyof typeof QuestionNature],
        reviewState: 'APPROVED', status: 'PUBLISHED', contentClass: 'PRODUCTION', reviewer: 'copied-approval-e2e', reviewedAt: new Date(q.approvalEvidence.reviewedAt),
        translations: { create: { language: 'en', questionText: q.questionText, optionA: q.options[0], optionB: q.options[1], optionC: q.options[2], optionD: q.options[3], correctOption: q.correctOption } } } });
    }
    for (const p of manifest.yearPractices) await db.test.create({ data: { id: p.id, title: { en: `NEET ${p.year} verified partial practice` }, testType: 'YEAR_PATTERN',
      year: null, totalQuestions: p.totalQuestions, durationMinutes: 180, price: 0, isPublished: true, contentClass: 'PRODUCTION', availableLanguages: ['en'],
      rules: { exam: 'NEET', year: p.year, sourceType: 'HISTORICAL_VERIFIED' }, testQuestions: { create: p.questionIds.map((questionId: string, order: number) => ({ questionId, order: order + 1 })) } } });
    console.log('Disposable fixture: 780 copied approved questions; five year practices; no staged questions.');
  } finally { await db.$disconnect(); }
}
if (process.argv[1]?.includes('prepare-neet-navigation-e2e')) main().catch(e => { console.error(e); process.exitCode = 1; });
