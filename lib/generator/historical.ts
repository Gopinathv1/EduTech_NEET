import { largestRemainder, GeneratorError, type GeneratorRules, type GeneratorResult } from './index';
import { makeRng, seededShuffle } from './rng';

/**
 * Select a historical mixed paper with explicit per-year balance inside each
 * subject quota. The final order is shuffled and therefore frozen by the
 * attempt seed like every other random test.
 */
export function generateBalancedHistoricalSet(
  rules: GeneratorRules,
  years: readonly number[],
  attemptSeed: string | number,
): GeneratorResult {
  if (!years.length) throw new GeneratorError('Historical year balance requires at least one year');
  const rng = makeRng(attemptSeed);
  const chosen = [] as typeof rules.pool;
  const used = new Set<string>();

  for (const subject of [...rules.subjects].sort((a, b) => a.subjectId.localeCompare(b.subjectId))) {
    const desired = largestRemainder(subject.count, years.map(() => 1));
    let subjectCount = 0;
    years.forEach((year, index) => {
      const candidates = rules.pool.filter((question) => question.subjectId === subject.subjectId
        && question.year === year && !used.has(question.id));
      const picked = seededShuffle(candidates, rng).slice(0, desired[index]);
      for (const question of picked) used.add(question.id);
      chosen.push(...picked);
      subjectCount += picked.length;
    });
    if (subjectCount < subject.count) {
      const fallback = seededShuffle(rules.pool.filter((question) => question.subjectId === subject.subjectId
        && years.includes(question.year ?? -1) && !used.has(question.id)), rng).slice(0, subject.count - subjectCount);
      for (const question of fallback) used.add(question.id);
      chosen.push(...fallback);
      subjectCount += fallback.length;
    }
    if (subjectCount < subject.count) throw new GeneratorError(`Not enough year-balanced questions for subject ${subject.subjectId}`);
  }

  return { questionIds: seededShuffle(chosen, rng).map((question) => question.id), warnings: [] };
}
