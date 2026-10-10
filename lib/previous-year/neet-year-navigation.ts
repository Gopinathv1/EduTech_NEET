import { prisma } from '../prisma';
import { questionTextHash } from '../admin/bulk';
import { neetValidatedCatalogue } from './neet-catalogue';
import { neetContentIssues, neetDuplicateOwners, neetPracticeYear, neetProductionEligible, neetYearAvailability } from './neet-release-readiness';
import { previousYearMode } from './modes';
import nature from '@/data/previous-year/neet/question-nature.json';

type Practice = { id: string; year: number | null; totalQuestions: number; isRandom: boolean;
  availableLanguages: string[]; testQuestions: { questionId: string }[]; rules: unknown; testType: string };

/** Read-only. A fixed year practice is shown only when every member passes the actual start-flow pool gates. */
export async function getNeetYearNavigation(practices: Practice[]) {
  const catalogue = neetValidatedCatalogue;
  const [rows, stems] = await Promise.all([
    prisma.question.findMany({ where: { externalId: { in: catalogue.map(q => q.externalId) }, exam: 'NEET' },
      include: { subject: { select: { code: true } }, chapter: { select: { name: true } }, translations: { where: { language: 'en' } } } }),
    prisma.questionTranslation.findMany({ where: { language: 'en', question: { exam: 'NEET' } }, select: { questionId: true, questionText: true } }),
  ]);
  const byExternal = new Map(rows.map(q => [q.externalId, q]));
  const owners = neetDuplicateOwners(stems.map(s => ({ id: s.questionId, questionText: s.questionText })));
  const canonicalNatureIds = new Set(nature.rows.map(q => q.externalId));
  const eligible = catalogue.flatMap(q => {
    const db = byExternal.get(q.externalId);
    if (!db || !canonicalNatureIds.has(q.externalId) || !neetProductionEligible(db) || neetContentIssues(q, db).length) return [];
    if ([...(owners.get(questionTextHash(q.questionText)) ?? [])].some(id => id !== db.id)) return [];
    return [{ id: db.id, year: q.year, subjectId: db.subjectId, chapterId: db.chapterId }];
  });
  const usable = practices.filter(p => {
    if (!p.availableLanguages.includes('en') || p.totalQuestions <= 0) return false;
    if (!p.isRandom) return p.testQuestions.length === p.totalQuestions
      && p.testQuestions.every(m => eligible.some(q => q.id === m.questionId));
    const rules = p.rules as { historical?: { years?: number[] }; random?: { subjectIds?: string[]; chapterIds?: string[] } } | null;
    const pool = eligible.filter(q => rules?.historical?.years?.includes(q.year)
      && (!rules.random?.subjectIds?.length || rules.random.subjectIds.includes(q.subjectId))
      && (!rules.random?.chapterIds?.length || rules.random.chapterIds.includes(q.chapterId)));
    return pool.length >= p.totalQuestions;
  });
  return { years: neetYearAvailability(eligible, usable.filter(p => !p.isRandom && previousYearMode(p) === 'YEAR_WISE')
    .map(p => ({ ...p, year: neetPracticeYear(p), questionIds: p.testQuestions.map(q => q.questionId) }))), usableTestIds: new Set(usable.map(p => p.id)) };
}
