import { createHash } from 'node:crypto';

export const CONTENT_FIELDS = ['questionText', 'optionA', 'optionB', 'optionC', 'optionD', 'explanation'] as const;
export type TranslationContent = { questionText: string; optionA: string | null; optionB: string | null; optionC: string | null; optionD: string | null; explanation?: string | null };
export type CanonicalContent = TranslationContent & { correctOption?: string | null; numericAnswer?: unknown; numericTolerance?: unknown };

/** Stable canonical binding includes answer identity without copying it into translations. */
export function canonicalContentHash(type: string, en: CanonicalContent): string {
  return createHash('sha256').update(JSON.stringify({ type,
    ...Object.fromEntries(CONTENT_FIELDS.map(key => [key, en[key] ?? null])),
    correctOption: en.correctOption ?? null,
    numericAnswer: en.numericAnswer == null ? null : String(en.numericAnswer),
    numericTolerance: en.numericTolerance == null ? null : String(en.numericTolerance),
  })).digest('hex');
}

/** Conservative mechanical QA; meaning and non-token science still require editorial review. */
export function protectedTokens(text: string): string[] {
  return text.match(/\$\$[\s\S]*?\$\$|\$[^$\n]+\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|<[^>]+>|&[a-zA-Z0-9#]+;|\\[a-zA-Z]+|(?<![\p{L}\d])[-+]?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?[⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉⁺⁻]*(?:[a-zα-ωΑ-Ω](?![a-zA-Z]))?|(?<!\p{L})(?:[A-Z][a-z]?[₀₁₂₃₄₅₆₇₈₉\d]*){2,}[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]*(?!\p{L})|m\/s²|m\/s|\b(?:H|He|Li|Be|B|C|N|O|F|Ne|Na|Mg|Al|Si|P|S|Cl|Ar|K|Ca|Cr|Mn|Fe|Co|Ni|Cu|Zn|Br|Sr|Ba|Ti|pH|SI|mol|kg|cm|mm|km|nm|mL|kJ|J|Hz|MHz|GHz|Pa|atm|eV|m|s|K|N|V|W)\b|(?:sin|cos|tan|log|ln)\s*[a-zα-ωΑ-Ω]|[a-zα-ωΑ-Ω][²³⁴⁵⁶⁷⁸⁹]|[α-ωΑ-Ω]|\b[b-zB-Z]\b|(?<=['‘])[a-zA-Z](?=['’])|[=×÷±^√∈≠ℝ⁻⁺₀₁₂₃₄₅₆₇₈₉]/gu) ?? [];
}
function tokenCounts(text: string) {
  const counts = new Map<string, number>();
  for (const token of protectedTokens(text)) counts.set(token, (counts.get(token) ?? 0) + 1);
  return [...counts].sort(([a], [b]) => a.localeCompare(b));
}
export function translationQa(type: string, en: TranslationContent, translated: TranslationContent): string[] {
  const issues: string[] = [];
  if (!translated.questionText.trim()) issues.push('Question statement is required.');
  for (const key of CONTENT_FIELDS) {
    const source = en[key] ?? '';
    const target = translated[key] ?? '';
    if (key.startsWith('option') && (Boolean(source.trim()) !== Boolean(target.trim()))) issues.push(`${key}: option identity/count differs.`);
    if (key === 'explanation' && !target) continue; // Optional explanation is not invented.
    if (JSON.stringify(tokenCounts(source)) !== JSON.stringify(tokenCounts(target))) issues.push(`${key}: protected numbers, formulas, variables, units or renderer tokens differ.`);
  }
  if (type === 'NUMERICAL_VALUE' && ['optionA', 'optionB', 'optionC', 'optionD'].some(key => translated[key as keyof TranslationContent])) issues.push('Numerical questions cannot have translated options.');
  return issues;
}

type ReviewedTranslation = TranslationContent & { reviewState?: string; canonicalContentHash?: string | null; translationSource?: string | null; reviewedById?: string | null; reviewedAt?: Date | null };
export function approvedTranslation(type: string, en: CanonicalContent, row: ReviewedTranslation | undefined): TranslationContent | null {
  if (!row || row.reviewState !== 'APPROVED' || !row.translationSource || !row.reviewedById || !row.reviewedAt
    || row.canonicalContentHash !== canonicalContentHash(type, en) || translationQa(type, en, row).length) return null;
  return row;
}
