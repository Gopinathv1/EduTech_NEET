import { QUESTION_BANK_V1_TAXONOMY } from '../question-bank/taxonomy';
import { questionTextHash, normalizeText } from '../admin/bulk';

export const NEET_PYQ_YEARS = Array.from({ length: 13 }, (_, i) => 2013 + i);
export type NeetCandidate = {
  externalId: string; year: number; paperSession: string; questionText: string; options: string[];
  correctOption: string; questionType: string; subjectCode: string; chapterSlug: string; topic: string;
  sourceType: string; sourceName: string; sourceUrl: string; officialAnswerKeyReference: string;
  validationState: string; imageUrl?: string | null;
};
export type NeetDatabaseRow = {
  id: string; externalId: string | null; exam: string | null; examYear: number | null; year: number | null;
  paperSession: string | null; questionType: string; topic: string | null; sourceType: string | null;
  sourceName: string | null; sourceUrl: string | null; officialAnswerKeyReference: string | null;
  imageUrl: string | null; reviewState: string; status: string; contentClass: string; isActive: boolean;
  reviewer: string | null; reviewedAt: unknown;
  subject: { code: string }; chapter: { name: unknown };
  translations: { language: string; questionText: string; optionA: string | null; optionB: string | null;
    optionC: string | null; optionD: string | null; correctOption: string | null }[];
};

export function neetContentIssues(q: NeetCandidate, db: NeetDatabaseRow): string[] {
  const issues: string[] = [];
  const en = db.translations.find(t => t.language === 'en');
  const chapter = QUESTION_BANK_V1_TAXONOMY.find(t => t.exam === 'NEET' && t.subjectCode === q.subjectCode
    && t.unitSlug === q.chapterSlug && t.topicSlugs.includes(q.topic));
  const chapterName = db.chapter.name && typeof db.chapter.name === 'object'
    ? (db.chapter.name as { en?: string }).en : undefined;
  if (q.validationState !== 'VALIDATED' || q.sourceType !== 'HISTORICAL_VERIFIED') issues.push('SOURCE_NOT_VALIDATED');
  if (db.externalId !== q.externalId || db.exam !== 'NEET' || db.examYear !== q.year || db.year !== q.year
    || db.paperSession !== q.paperSession) issues.push('IDENTITY_MISMATCH');
  if (db.subject.code !== q.subjectCode || !chapter || !chapterName
    || normalizeText(chapterName) !== normalizeText(chapter.unitName) || db.topic !== q.topic) issues.push('TAXONOMY_MISMATCH');
  if (db.sourceType !== q.sourceType || db.sourceName !== q.sourceName || db.sourceUrl !== q.sourceUrl
    || db.officialAnswerKeyReference !== q.officialAnswerKeyReference) issues.push('PROVENANCE_MISMATCH');
  if (db.questionType !== q.questionType || (db.imageUrl ?? null) !== (q.imageUrl ?? null)) issues.push('QUESTION_FORMAT_MISMATCH');
  // Whitespace is the only permitted normalization: scientific symbols/options must match.
  const same = (a: string, b: string) => a.trim().replace(/\s+/g, ' ') === b.trim().replace(/\s+/g, ' ');
  if (!en || !same(en.questionText, q.questionText)
    || ![en.optionA, en.optionB, en.optionC, en.optionD].every((o, i) => o !== null && same(o, q.options[i] ?? ''))
    || en.correctOption !== q.correctOption) issues.push('ENGLISH_CONTENT_OR_ANSWER_MISMATCH');
  return issues;
}

export function neetProductionEligible(db: NeetDatabaseRow) {
  return db.reviewState === 'APPROVED' && db.status === 'PUBLISHED' && db.isActive
    && db.contentClass === 'PRODUCTION' && !!db.sourceType && !!db.sourceName && !!db.reviewer && !!db.reviewedAt
    && db.translations.some(t => t.language === 'en');
}

/** Stem equality is a review blocker, not permission to merge historical identities. */
export function neetDuplicateOwners(rows: { id: string; questionText: string }[]) {
  const owners = new Map<string, Set<string>>();
  for (const row of rows) {
    const hash = questionTextHash(row.questionText);
    owners.set(hash, new Set([...(owners.get(hash) ?? []), row.id]));
  }
  return owners;
}

export type NeetYearPractice = { id: string; year: number | null; totalQuestions: number; questionIds: string[] };
export function neetPracticeYear(practice: { year: number | null; rules: unknown }) {
  const rules = practice.rules as { year?: unknown; historical?: { years?: unknown[] } } | null;
  const years = rules?.historical?.years;
  if (years && years.length !== 1) return null;
  const bound = rules?.year ?? years?.[0];
  if (typeof bound !== 'number' || !NEET_PYQ_YEARS.includes(bound)
    || (practice.year !== null && practice.year !== bound) || (years && years[0] !== bound)) return null;
  return bound;
}
export function neetYearAvailability(eligible: { id: string; year: number }[], practices: NeetYearPractice[]) {
  return NEET_PYQ_YEARS.map(year => {
    const ids = new Set(eligible.filter(q => q.year === year).map(q => q.id));
    const usable = practices.filter(p => p.year === year && p.totalQuestions > 0
      && p.questionIds.length === p.totalQuestions && new Set(p.questionIds).size === p.totalQuestions
      && p.questionIds.every(id => ids.has(id)));
    const visible = new Set(usable.flatMap(p => p.questionIds));
    return { year, approvedCount: ids.size, visibleCount: visible.size, practices: usable,
      comingSoon: !visible.size };
  });
}
