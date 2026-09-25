import { QUESTION_BANK_V1_TAXONOMY } from './taxonomy';

export const NEET_SUBJECT_CODES = ['PHYSICS', 'CHEMISTRY', 'BOTANY', 'ZOOLOGY'] as const;
export type NeetSubjectCode = (typeof NEET_SUBJECT_CODES)[number];

export const PRODUCTION_SYNC_CONFIRMATION = 'SYNC_CANONICAL_NEET_TAXONOMY';

const SUBJECT_NAMES: Record<NeetSubjectCode, string> = {
  PHYSICS: 'Physics',
  CHEMISTRY: 'Chemistry',
  BOTANY: 'Botany',
  ZOOLOGY: 'Zoology',
};

export type ExistingChapter = { id: string; name: string };
export type ExistingSubject = { id: string; code: string; chapters: ExistingChapter[] };

export type CanonicalChapter = {
  subjectCode: NeetSubjectCode;
  name: string;
  order: number;
};

export type TaxonomySyncPlan = {
  subjectsExisting: number;
  subjectsMissing: Array<{ code: NeetSubjectCode; name: string; order: number }>;
  canonicalChapters: number;
  chaptersExisting: number;
  chaptersMatched: Array<CanonicalChapter & { id: string }>;
  chaptersMissing: CanonicalChapter[];
  legacyPreserved: Array<{ subjectCode: NeetSubjectCode; id: string; name: string }>;
  ambiguousMatches: Array<{ subjectCode: NeetSubjectCode; canonicalName: string; ids: string[] }>;
  duplicateCanonicalChapters: Array<{ subjectCode: NeetSubjectCode; canonicalName: string; ids: string[] }>;
  writesRequired: number;
};

export type SafeDatabaseTarget = {
  host: string;
  port: string;
  database: string;
  classification: 'LOCAL_TEST' | 'PRODUCTION';
  direct: boolean;
};

export function normalizeTaxonomyName(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

export function canonicalNeetChapters(): CanonicalChapter[] {
  return NEET_SUBJECT_CODES.flatMap((subjectCode) => {
    const seen = new Set<string>();
    return QUESTION_BANK_V1_TAXONOMY
      .filter((entry) => entry.exam === 'NEET' && entry.subjectCode === subjectCode)
      .filter((entry) => {
        const key = normalizeTaxonomyName(entry.unitName);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((entry, index) => ({ subjectCode, name: entry.unitName, order: index + 1 }));
  });
}

export function planCanonicalTaxonomySync(existing: ExistingSubject[]): TaxonomySyncPlan {
  const canonical = canonicalNeetChapters();
  const subjectsByCode = new Map(existing.map((subject) => [subject.code, subject]));
  const subjectsMissing = NEET_SUBJECT_CODES.filter((code) => !subjectsByCode.has(code)).map((code, index) => ({
    code,
    name: SUBJECT_NAMES[code],
    order: index + 1,
  }));
  const chaptersMatched: TaxonomySyncPlan['chaptersMatched'] = [];
  const chaptersMissing: CanonicalChapter[] = [];
  const duplicateCanonicalChapters: TaxonomySyncPlan['duplicateCanonicalChapters'] = [];
  const canonicalKeysBySubject = new Map<NeetSubjectCode, Set<string>>();

  for (const definition of canonical) {
    const subject = subjectsByCode.get(definition.subjectCode);
    const matches = (subject?.chapters ?? []).filter((chapter) => normalizeTaxonomyName(chapter.name) === normalizeTaxonomyName(definition.name));
    if (matches.length === 1) chaptersMatched.push({ ...definition, id: matches[0].id });
    else if (matches.length === 0) chaptersMissing.push(definition);
    else duplicateCanonicalChapters.push({ subjectCode: definition.subjectCode, canonicalName: definition.name, ids: matches.map((match) => match.id) });
    const keys = canonicalKeysBySubject.get(definition.subjectCode) ?? new Set<string>();
    keys.add(normalizeTaxonomyName(definition.name));
    canonicalKeysBySubject.set(definition.subjectCode, keys);
  }

  const legacyPreserved = existing.flatMap((subject) => {
    if (!NEET_SUBJECT_CODES.includes(subject.code as NeetSubjectCode)) return [];
    const code = subject.code as NeetSubjectCode;
    const keys = canonicalKeysBySubject.get(code) ?? new Set<string>();
    return subject.chapters
      .filter((chapter) => !keys.has(normalizeTaxonomyName(chapter.name)))
      .map((chapter) => ({ subjectCode: code, id: chapter.id, name: chapter.name }));
  });

  return {
    subjectsExisting: NEET_SUBJECT_CODES.length - subjectsMissing.length,
    subjectsMissing,
    canonicalChapters: canonical.length,
    chaptersExisting: existing.filter((subject) => NEET_SUBJECT_CODES.includes(subject.code as NeetSubjectCode)).reduce((count, subject) => count + subject.chapters.length, 0),
    chaptersMatched,
    chaptersMissing,
    legacyPreserved,
    ambiguousMatches: [],
    duplicateCanonicalChapters,
    writesRequired: subjectsMissing.length + chaptersMissing.length,
  };
}

export function inspectDatabaseTarget(rawUrl: string): SafeDatabaseTarget {
  const url = new URL(rawUrl);
  const database = decodeURIComponent(url.pathname.replace(/^\//, ''));
  const local = url.hostname === '127.0.0.1' && url.port === '5433' && database === 'sivora_test';
  return {
    host: url.hostname,
    port: url.port || '5432',
    database,
    classification: local ? 'LOCAL_TEST' : 'PRODUCTION',
    direct: !url.hostname.includes('pooler'),
  };
}

export function assertSafeSyncTarget(args: {
  databaseUrl: string;
  directUrl: string;
  dryRun: boolean;
  confirmation?: string;
}): { database: SafeDatabaseTarget; direct: SafeDatabaseTarget } {
  const database = inspectDatabaseTarget(args.databaseUrl);
  const direct = inspectDatabaseTarget(args.directUrl);
  if (database.database !== direct.database) throw new Error('DATABASE_URL and DIRECT_URL target different databases.');
  if (!direct.direct) throw new Error('DIRECT_URL must use a non-pooled host.');
  if (database.classification !== direct.classification) throw new Error('DATABASE_URL and DIRECT_URL have different safety classifications.');
  if (!args.dryRun && direct.classification === 'LOCAL_TEST') {
    if (database.host !== '127.0.0.1' || database.port !== '5433' || direct.host !== '127.0.0.1' || direct.port !== '5433') {
      throw new Error('Local writes require both URLs to target 127.0.0.1:5433/sivora_test.');
    }
  }
  if (!args.dryRun && direct.classification === 'PRODUCTION' && args.confirmation !== PRODUCTION_SYNC_CONFIRMATION) {
    throw new Error(`Production write refused. Set CANONICAL_TAXONOMY_SYNC_CONFIRM=${PRODUCTION_SYNC_CONFIRMATION}.`);
  }
  return { database, direct };
}

