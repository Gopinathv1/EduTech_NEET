import { OFFICIAL_EXAM_SOURCES } from './official-sources';

export type CanonicalTaxonomyEntry = {
  exam: 'NEET' | 'JEE';
  subjectCode: string;
  unitSlug: string;
  unitName: string;
  topicSlugs: readonly string[];
  sourceUrl: string;
};

/**
 * V1 pilot taxonomy. Slugs are repository identities, not claims that NTA
 * publishes slugs or divides either exam into SIVORA practice parts.
 */
export const QUESTION_BANK_V1_TAXONOMY: readonly CanonicalTaxonomyEntry[] = [
  { exam: 'NEET', subjectCode: 'PHYSICS', unitSlug: 'physics-gravitation', unitName: 'Gravitation', topicSlugs: ['universal-law', 'gravity-variation', 'satellites'], sourceUrl: OFFICIAL_EXAM_SOURCES.NEET_2026_SYLLABUS },
  { exam: 'NEET', subjectCode: 'CHEMISTRY', unitSlug: 'chemistry-some-basic-concepts', unitName: 'Some Basic Concepts in Chemistry', topicSlugs: ['mole-concept', 'stoichiometry'], sourceUrl: OFFICIAL_EXAM_SOURCES.NEET_2026_SYLLABUS },
  { exam: 'NEET', subjectCode: 'BOTANY', unitSlug: 'biology-genetics-and-evolution', unitName: 'Genetics and Evolution', topicSlugs: ['mendelian-inheritance', 'molecular-basis-of-inheritance'], sourceUrl: OFFICIAL_EXAM_SOURCES.NEET_2026_SYLLABUS },
  { exam: 'NEET', subjectCode: 'ZOOLOGY', unitSlug: 'biology-human-physiology', unitName: 'Human Physiology', topicSlugs: ['breathing', 'circulation', 'excretion'], sourceUrl: OFFICIAL_EXAM_SOURCES.NEET_2026_SYLLABUS },
  { exam: 'JEE', subjectCode: 'JEE_PHYSICS', unitSlug: 'jee-physics-kinematics', unitName: 'Kinematics', topicSlugs: ['motion-in-line', 'motion-in-plane'], sourceUrl: OFFICIAL_EXAM_SOURCES.JEE_MAIN_2026_SYLLABUS },
  { exam: 'JEE', subjectCode: 'JEE_CHEMISTRY', unitSlug: 'jee-chemistry-basic-concepts', unitName: 'Some Basic Concepts in Chemistry', topicSlugs: ['mole-concept', 'stoichiometry'], sourceUrl: OFFICIAL_EXAM_SOURCES.JEE_MAIN_2026_SYLLABUS },
  { exam: 'JEE', subjectCode: 'JEE_MATHEMATICS', unitSlug: 'jee-mathematics-sets-relations-functions', unitName: 'Sets, Relations and Functions', topicSlugs: ['sets', 'relations', 'functions'], sourceUrl: OFFICIAL_EXAM_SOURCES.JEE_MAIN_2026_SYLLABUS },
] as const;

export function validateTaxonomy(entries: readonly CanonicalTaxonomyEntry[] = QUESTION_BANK_V1_TAXONOMY): string[] {
  const errors: string[] = [];
  const unitKeys = new Set<string>();
  for (const entry of entries) {
    const key = `${entry.exam}:${entry.subjectCode}:${entry.unitSlug}`;
    if (unitKeys.has(key)) errors.push(`Duplicate unit identity: ${key}`);
    unitKeys.add(key);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.unitSlug)) errors.push(`Invalid unit slug: ${entry.unitSlug}`);
    if (new Set(entry.topicSlugs).size !== entry.topicSlugs.length) errors.push(`Duplicate topic in ${key}`);
  }
  return errors;
}
