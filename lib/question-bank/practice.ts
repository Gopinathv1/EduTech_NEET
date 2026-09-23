import { makeRng, seededShuffle } from '@/lib/generator/rng';
import { evaluatePracticeReadiness, matchesSubjectQuota, type EligibleQuestionRecord, type PracticeRequest } from './readiness';

export function planPracticeQuestionIds(records: readonly EligibleQuestionRecord[], request: PracticeRequest, seed: string | number): string[] {
  const readiness = evaluatePracticeReadiness(records, request);
  if (!readiness.ready) throw new Error(readiness.reasons.join(' '));
  let pool = records.filter((record) => record.eligible && record.exam === request.exam);
  if (request.mode === 'YEAR') pool = pool.filter((record) => record.year === request.year && record.sourceType === 'OFFICIAL_NTA');
  if (request.subjectCodes?.length) pool = pool.filter((record) => request.subjectCodes!.includes(record.subjectCode));
  if (request.chapterSlugs?.length) pool = pool.filter((record) => request.chapterSlugs!.includes(record.chapterSlug));
  if (request.topics?.length) pool = pool.filter((record) => request.topics!.includes(record.topic));
  const unique = [...new Map(pool.map((record) => [record.id, record])).values()];
  const rng = makeRng(seed);
  const selected: string[] = [];
  const used = new Set<string>();
  for (const [subject, quota] of Object.entries(request.subjectQuotas ?? {})) {
    for (const record of seededShuffle(unique.filter((q) => matchesSubjectQuota(q, subject)), rng).slice(0, quota)) {
      selected.push(record.id);
      used.add(record.id);
    }
  }
  for (const record of seededShuffle(unique.filter((q) => !used.has(q.id)), rng)) {
    if (selected.length >= request.totalQuestions) break;
    selected.push(record.id);
  }
  return selected;
}
