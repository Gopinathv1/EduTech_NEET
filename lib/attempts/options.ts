import { makeRng, seededShuffle } from '@/lib/generator/rng';

/**
 * Per-attempt answer-option randomisation (NEET spec: "randomize answer option
 * order, where appropriate").
 *
 * The display order is DERIVED deterministically from the attempt seed + the
 * question id — nothing extra is stored per question. Because it's deterministic,
 * the exam payload (display), the scoring, and the answer review all reconstruct
 * the exact same order, and a resume shows the same layout. The student's answer
 * is recorded as the DISPLAYED letter (A–D in shuffled space); scoring maps the
 * canonical correct option into that same space, so the marking logic is
 * unchanged.
 *
 * "Where appropriate": options that reference their own position or each other
 * ("All of the above", "Both A and B", "1 and 3 only", assertion–reason) must NOT
 * be reordered, or they become nonsensical — `canShuffleOptions` guards this.
 */

export type OptLetter = 'A' | 'B' | 'C' | 'D';
export const OPTION_LETTERS: readonly OptLetter[] = ['A', 'B', 'C', 'D'];

export type OptionContent = { optionA: string; optionB: string; optionC: string; optionD: string };

// Options that reference position / each other — reordering would break them.
const POSITIONAL = /\b(all|none|both|neither|any)\b|of the above|of these|of the following|and\s*\(?[a-d1-4]\)?|\bonly\b|\boption[s]?\s*[a-d]\b|\bstatement[s]?\b|\bboth\b/i;

/** Whether a question's options may be safely reordered. */
export function canShuffleOptions(en: OptionContent, questionType: string): boolean {
  if (questionType === 'ASSERTION_REASON') return false;
  const texts = [en.optionA, en.optionB, en.optionC, en.optionD];
  return !texts.some((t) => POSITIONAL.test(t));
}

/**
 * The display order for a question's options, as an array of CANONICAL letters:
 * `order[i]` is the canonical option shown at display position i (A,B,C,D).
 * Returns the identity order when `shuffle` is false.
 */
export function optionDisplayOrder(
  seed: string | null | undefined,
  questionId: string,
  shuffle: boolean,
): OptLetter[] {
  if (!shuffle || !seed) return [...OPTION_LETTERS];
  const rng = makeRng(`${seed}:${questionId}`);
  return seededShuffle(OPTION_LETTERS, rng);
}

/** Reorder a content's options into the given display order (relabelled A–D). */
export function applyDisplayOrder<T extends OptionContent>(content: T, order: OptLetter[]): T {
  return {
    ...content,
    optionA: content[`option${order[0]}` as keyof OptionContent],
    optionB: content[`option${order[1]}` as keyof OptionContent],
    optionC: content[`option${order[2]}` as keyof OptionContent],
    optionD: content[`option${order[3]}` as keyof OptionContent],
  };
}

/** Map a CANONICAL option letter to the DISPLAY letter it appears under. */
export function canonicalToDisplay(order: OptLetter[], canonical: OptLetter): OptLetter {
  const i = order.indexOf(canonical);
  return OPTION_LETTERS[i >= 0 ? i : 0];
}

/** Map a DISPLAY option letter back to the CANONICAL option it represents. */
export function displayToCanonical(order: OptLetter[], display: OptLetter): OptLetter {
  const i = OPTION_LETTERS.indexOf(display);
  return order[i >= 0 ? i : 0];
}
