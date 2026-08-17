import { makeRng, seededShuffle } from './rng';

/**
 * Pure, deterministic random question generator.
 *
 * `generateQuestionSet(rules, attemptSeed)` picks question ids so that:
 *  - questions are distributed across subjects and chapters proportional to
 *    chapter weightage (exact, via largest-remainder),
 *  - the overall difficulty mix matches the requested proportions as closely as
 *    the bank allows (targeted per chapter, aggregated),
 *  - the selection is reproducible from `attemptSeed` but differs between seeds,
 *  - for a Tamil attempt, reviewed-Tamil questions are preferred and any
 *    English-only fallback is reported (and console.warn'd),
 *  - it throws `GeneratorError` when the (pre-filtered, active) pool can't
 *    satisfy the rules.
 *
 * The function is pure: callers pass the eligible `pool` in `rules` (already
 * filtered to active + in-scope questions). See lib/generator/plan.ts for the
 * DB-backed builder.
 */

export type GeneratorDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export const DIFFICULTIES: GeneratorDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];

export type GeneratorQuestion = {
  id: string;
  subjectId: string;
  chapterId: string;
  difficulty: GeneratorDifficulty;
  /** Whether a reviewed Tamil translation exists (used for language preference). */
  hasReviewedTa: boolean;
};

export type SubjectQuota = {
  subjectId: string;
  count: number;
  chapters: { chapterId: string; weightage: number }[];
};

export type GeneratorRules = {
  totalQuestions: number;
  language: 'en' | 'ta';
  /** Percentages (or any non-negative weights); normalised internally. */
  difficultyMix: Record<GeneratorDifficulty, number>;
  subjects: SubjectQuota[];
  pool: GeneratorQuestion[];
};

export type GeneratorResult = {
  questionIds: string[];
  warnings: string[];
};

export class GeneratorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeneratorError';
  }
}

/** Allocate `total` integer units across `weights`, proportional, summing exactly. */
export function largestRemainder(total: number, weights: number[]): number[] {
  const n = weights.length;
  if (n === 0 || total <= 0) return new Array(n).fill(0);
  const sum = weights.reduce((a, b) => a + b, 0);

  if (sum <= 0) {
    // No weights → even split.
    const base = Math.floor(total / n);
    const counts = new Array(n).fill(base);
    let rem = total - base * n;
    for (let i = 0; rem > 0; i = (i + 1) % n, rem--) counts[i]++;
    return counts;
  }

  const raw = weights.map((w) => (w / sum) * total);
  const counts = raw.map((r) => Math.floor(r));
  let allocated = counts.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; allocated < total; k++, allocated++) {
    counts[order[k % order.length].i]++;
  }
  return counts;
}

type Picked = { chosen: GeneratorQuestion[]; taFallback: number };

/** Pick up to `n`, preferring reviewed-Tamil questions when language is Tamil. */
function pickPreferLang(
  candidates: GeneratorQuestion[],
  n: number,
  language: 'en' | 'ta',
  rng: () => number,
): Picked {
  if (n <= 0 || candidates.length === 0) return { chosen: [], taFallback: 0 };
  let ordered: GeneratorQuestion[];
  if (language === 'ta') {
    const withTa = seededShuffle(candidates.filter((q) => q.hasReviewedTa), rng);
    const withoutTa = seededShuffle(candidates.filter((q) => !q.hasReviewedTa), rng);
    ordered = [...withTa, ...withoutTa];
  } else {
    ordered = seededShuffle(candidates, rng);
  }
  const chosen = ordered.slice(0, n);
  const taFallback = language === 'ta' ? chosen.filter((q) => !q.hasReviewedTa).length : 0;
  return { chosen, taFallback };
}

/** Pick `target` from one chapter, aiming for the difficulty mix. */
function pickFromChapter(
  available: GeneratorQuestion[],
  target: number,
  mixFrac: Record<GeneratorDifficulty, number>,
  language: 'en' | 'ta',
  rng: () => number,
): Picked {
  if (target <= 0 || available.length === 0) return { chosen: [], taFallback: 0 };

  const byDiff: Record<GeneratorDifficulty, GeneratorQuestion[]> = { EASY: [], MEDIUM: [], HARD: [] };
  for (const q of available) byDiff[q.difficulty].push(q);

  const desired = largestRemainder(target, DIFFICULTIES.map((d) => mixFrac[d]));
  const used = new Set<string>();
  const chosen: GeneratorQuestion[] = [];
  let taFallback = 0;

  DIFFICULTIES.forEach((d, idx) => {
    const res = pickPreferLang(byDiff[d].filter((q) => !used.has(q.id)), desired[idx], language, rng);
    for (const q of res.chosen) used.add(q.id);
    chosen.push(...res.chosen);
    taFallback += res.taFallback;
  });

  // Fill any shortfall (bank lacked a difficulty) from whatever remains.
  if (chosen.length < target) {
    const res = pickPreferLang(
      available.filter((q) => !used.has(q.id)),
      target - chosen.length,
      language,
      rng,
    );
    for (const q of res.chosen) used.add(q.id);
    chosen.push(...res.chosen);
    taFallback += res.taFallback;
  }

  return { chosen, taFallback };
}

export function generateQuestionSet(
  rules: GeneratorRules,
  attemptSeed: string | number,
): GeneratorResult {
  if (rules.totalQuestions <= 0) throw new GeneratorError('totalQuestions must be greater than zero');
  if (rules.subjects.length === 0) throw new GeneratorError('No subjects specified in the rules');

  const rng = makeRng(attemptSeed);
  const warnings: string[] = [];

  // Normalise difficulty mix to fractions (fall back to even if unusable).
  const mixTotal = DIFFICULTIES.reduce((s, d) => s + Math.max(0, rules.difficultyMix[d] ?? 0), 0);
  const mixFrac: Record<GeneratorDifficulty, number> =
    mixTotal > 0
      ? {
          EASY: Math.max(0, rules.difficultyMix.EASY ?? 0) / mixTotal,
          MEDIUM: Math.max(0, rules.difficultyMix.MEDIUM ?? 0) / mixTotal,
          HARD: Math.max(0, rules.difficultyMix.HARD ?? 0) / mixTotal,
        }
      : { EASY: 1 / 3, MEDIUM: 1 / 3, HARD: 1 / 3 };

  const byChapter = new Map<string, GeneratorQuestion[]>();
  for (const q of rules.pool) {
    const arr = byChapter.get(q.chapterId);
    if (arr) arr.push(q);
    else byChapter.set(q.chapterId, [q]);
  }

  const chosen: string[] = [];
  let taFallback = 0;

  // Deterministic subject order.
  const subjects = [...rules.subjects].sort((a, b) => a.subjectId.localeCompare(b.subjectId));

  for (const subject of subjects) {
    const chapters = [...subject.chapters].sort((a, b) => a.chapterId.localeCompare(b.chapterId));
    const chapterCounts = largestRemainder(subject.count, chapters.map((c) => c.weightage));

    const used = new Set<string>();
    let subjectChosen = 0;

    // Pass 1 — pick each chapter's weightage share, matching the difficulty mix.
    for (let ci = 0; ci < chapters.length; ci++) {
      const chapId = chapters[ci].chapterId;
      const available = (byChapter.get(chapId) ?? []).filter((q) => !used.has(q.id));
      const res = pickFromChapter(available, chapterCounts[ci], mixFrac, rules.language, rng);
      for (const q of res.chosen) {
        used.add(q.id);
        chosen.push(q.id);
        subjectChosen++;
      }
      taFallback += res.taFallback;
    }

    // Pass 2 — some chapters may have been short; backfill from the subject's
    // remaining questions so the subject total is met when the bank allows.
    if (subjectChosen < subject.count) {
      const leftover: GeneratorQuestion[] = [];
      for (const c of chapters) {
        for (const q of byChapter.get(c.chapterId) ?? []) if (!used.has(q.id)) leftover.push(q);
      }
      const res = pickPreferLang(leftover, subject.count - subjectChosen, rules.language, rng);
      for (const q of res.chosen) {
        used.add(q.id);
        chosen.push(q.id);
        subjectChosen++;
      }
      taFallback += res.taFallback;
    }

    if (subjectChosen < subject.count) {
      throw new GeneratorError(
        `Not enough active questions for subject ${subject.subjectId}: need ${subject.count}, found ${subjectChosen}`,
      );
    }
  }

  if (rules.language === 'ta' && taFallback > 0) {
    const msg = `Tamil test: ${taFallback} question(s) fell back to English-only (no reviewed Tamil translation).`;
    warnings.push(msg);
    console.warn(`[generator] ${msg}`);
  }

  return { questionIds: chosen, warnings };
}
