import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Prisma, type PrismaClient } from '@prisma/client';
import { approvalIssues } from '@/lib/admin/question-approval';
import { QUESTION_BANK_V1_TAXONOMY } from '@/lib/question-bank/taxonomy';
import { inspectDatabaseTarget, normalizeTaxonomyName } from '@/lib/question-bank/taxonomy-sync';
import { assertValidJeeDataset, type JeeHistoricalQuestion, type JeeInventoryEntry, type JeeQuarantineRecord } from './jee-dataset';
import type { JeeKeyQuestion } from './jee-validation';

export const JEE_RELEASE_YEARS = [2021, 2022, 2023, 2024, 2025] as const;
export const JEE_RELEASE_SCOPE = 'JEE_MAIN_PAPER_1_2021_2025_V1';
export const JEE_RELEASE_COUNT = 218;
export const JEE_RELEASE_BATCH_SIZE = 25;
export const JEE_IMPORT_CONFIRMATION = 'IMPORT_JEE_HISTORICAL_2021_2025_V1';
export const JEE_APPROVAL_CONFIRMATION = 'APPROVE_JEE_HISTORICAL_2021_2025_V1';

export const JEE_REQUIRED_RELEASE_ARTIFACTS = [
  ...JEE_RELEASE_YEARS.flatMap(year => ['questions.json', 'quarantine.json', 'source-manifest.json'].map(file => `${year}/${file}`)),
  'acquisition-manifest.json', 'final-answer-keys.json', 'question-nature.json',
  'quarantine-report.json', 'taxonomy-gap-report.json', 'classification-report.json',
] as const;

export type JeeReleaseManifest = {
  schemaVersion: number;
  scope: string;
  importReady: boolean;
  validated: number;
  quarantined: number;
  years: Array<{ year: number; validated: number; quarantined: number; questionsSha256: string }>;
  acquisitionManifestSha256: string;
  finalAnswerKeysSha256: string;
  questionNatureSha256: string;
  artifactSha256?: Record<string, string>;
};

export function jeeArtifactHash(bytes: string | Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/** Hash every retained, excluded, classification and source artifact before any database access. */
export async function loadJeeRelease(options: { root?: string; requireReady?: boolean } = {}) {
  const root = options.root ?? path.join(process.cwd(), 'data', 'previous-year', 'jee');
  const releaseBytes = await readFile(path.join(root, 'release-manifest.json'));
  const manifest = JSON.parse(releaseBytes.toString('utf8')) as JeeReleaseManifest;
  if (manifest.schemaVersion !== 1 || manifest.scope !== JEE_RELEASE_SCOPE || manifest.validated !== JEE_RELEASE_COUNT) {
    throw new Error('JEE release must be the exact 218-question validated V1 manifest.');
  }
  const artifacts = new Map<string, Buffer>();
  const artifactHashes: Record<string, string> = {};
  const readinessBlockers: string[] = [];
  for (const file of JEE_REQUIRED_RELEASE_ARTIFACTS) {
    try {
      const bytes = await readFile(path.join(root, file));
      artifacts.set(file, bytes);
      artifactHashes[file] = jeeArtifactHash(bytes);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      readinessBlockers.push(`Missing release artifact: ${file}`);
    }
  }
  const json = <T>(file: string): T => {
    const bytes = artifacts.get(file);
    if (!bytes) throw new Error(`Required dataset artifact is missing: ${file}`);
    return JSON.parse(bytes.toString('utf8')) as T;
  };
  const expectedHashes: Record<string, string> = {
    'acquisition-manifest.json': manifest.acquisitionManifestSha256,
    'final-answer-keys.json': manifest.finalAnswerKeysSha256,
    'question-nature.json': manifest.questionNatureSha256,
    ...Object.fromEntries(manifest.years.map(year => [`${year.year}/questions.json`, year.questionsSha256])),
  };
  for (const [file, hash] of Object.entries(expectedHashes)) {
    if (!/^[a-f0-9]{64}$/.test(hash) || artifactHashes[file] !== hash) throw new Error(`JEE release hash mismatch: ${file}`);
  }
  for (const file of JEE_REQUIRED_RELEASE_ARTIFACTS) {
    const expected = manifest.artifactSha256?.[file];
    if (!expected) readinessBlockers.push(`Manifest hash is missing: ${file}`);
    else if (!/^[a-f0-9]{64}$/.test(expected) || artifactHashes[file] !== expected) throw new Error(`JEE release hash mismatch: ${file}`);
  }
  const questions = JEE_RELEASE_YEARS.flatMap(year => json<JeeHistoricalQuestion[]>(`${year}/questions.json`));
  const quarantine = JEE_RELEASE_YEARS.flatMap(year => json<JeeQuarantineRecord[]>(`${year}/quarantine.json`));
  if (questions.length !== JEE_RELEASE_COUNT || quarantine.length !== manifest.quarantined || manifest.years.length !== 5
    || new Set(manifest.years.map(year => year.year)).size !== 5) throw new Error('JEE release totals differ from the exact manifest.');
  for (const year of JEE_RELEASE_YEARS) {
    const summary = manifest.years.find(entry => entry.year === year);
    if (!summary || questions.filter(question => question.year === year).length !== summary.validated
      || json<JeeQuarantineRecord[]>(`${year}/quarantine.json`).length !== summary.quarantined) {
      throw new Error(`JEE ${year} release counts differ from the manifest.`);
    }
  }
  const inventory = json<{ entries: JeeInventoryEntry[] }>('acquisition-manifest.json').entries;
  const keys = json<{ entries: Array<{ paperId: string; questions: JeeKeyQuestion[] }> }>('final-answer-keys.json').entries;
  assertValidJeeDataset(questions, inventory, keys, quarantine);
  const nature = json<{ rows: Array<{ externalId: string; questionNature: string }> }>('question-nature.json').rows;
  if (nature.length !== questions.length || new Set(nature.map(row => row.externalId)).size !== questions.length
    || questions.some(question => nature.find(row => row.externalId === question.externalId)?.questionNature !== question.questionNature)) {
    throw new Error('JEE nature classification differs from the canonical dataset.');
  }
  if (!manifest.importReady) readinessBlockers.push('Release manifest importReady is false.');
  if (options.requireReady && readinessBlockers.length) throw new Error(readinessBlockers.join('\n'));
  return { questions, quarantine, manifest, releaseSha256: jeeArtifactHash(releaseBytes), artifactHashes, readinessBlockers };
}

function databaseProject(url: URL): string {
  const directSupabase = /^db\.([a-z0-9]+)\.supabase\.co$/i.exec(url.hostname);
  if (directSupabase) return `supabase:${directSupabase[1].toLowerCase()}`;
  if (/\.pooler\.supabase\.com$/i.test(url.hostname)) {
    const pooledUser = /^postgres\.([a-z0-9]+)$/i.exec(decodeURIComponent(url.username));
    if (!pooledUser) throw new Error('Cannot establish Supabase project identity from the pooled URL.');
    return `supabase:${pooledUser[1].toLowerCase()}`;
  }
  return url.hostname.toLowerCase().replace(/-pooler(?=\.)/g, '');
}

/** Do not print credentials. Supabase pooled and direct hosts must resolve to the same project. */
export function assertJeeDatabaseTargets(databaseUrl: string, directUrl: string) {
  const first = new URL(databaseUrl);
  const second = new URL(directUrl);
  if (![first, second].every(url => ['postgres:', 'postgresql:'].includes(url.protocol))) throw new Error('JEE release requires PostgreSQL URLs.');
  const database = inspectDatabaseTarget(databaseUrl);
  const direct = inspectDatabaseTarget(directUrl);
  if (database.database !== direct.database || database.classification !== direct.classification
    || databaseProject(first) !== databaseProject(second) || !direct.direct
    || second.searchParams.get('pgbouncer') === 'true' || second.port === '6543') {
    throw new Error('DATABASE_URL and DIRECT_URL must identify the same project/database; DIRECT_URL must be non-pooled.');
  }
  return { database, direct };
}

export function assertJeeWriteAuthorization(args: { execute: boolean; releaseSha256: string; confirmation?: string; confirmedHash?: string; action: 'IMPORT' | 'APPROVE' }) {
  if (!args.execute) return;
  const expected = args.action === 'IMPORT' ? JEE_IMPORT_CONFIRMATION : JEE_APPROVAL_CONFIRMATION;
  if (args.confirmation !== expected || args.confirmedHash !== args.releaseSha256) {
    throw new Error(`JEE write refused: exact ${args.action} confirmation and JEE_HISTORICAL_RELEASE_SHA256 are required.`);
  }
}

type TaxonomySubject = { id: string; code: string };
type TaxonomyChapter = { id: string; subjectId: string; name: Prisma.JsonValue };
export type ExistingJeeReleaseQuestion = Prisma.QuestionGetPayload<{ include: { translations: true } }>;

export function jeeQuestionData(question: JeeHistoricalQuestion, subjectId: string, chapterId: string): Prisma.QuestionCreateInput {
  return {
    externalId: question.externalId, subject: { connect: { id: subjectId } }, chapter: { connect: { id: chapterId } },
    topic: question.topic, difficulty: question.difficulty, year: question.year,
    tags: ['jee-pyq', `jee-${question.year}`, question.paperId, `nta-question-${question.questionId}`],
    questionType: question.questionType, questionNature: question.questionNature,
    status: 'REVIEW', contentClass: 'PRODUCTION', sourceType: 'HISTORICAL_VERIFIED',
    sourceName: question.sourceName, sourceUrl: question.sourceUrl,
    officialAnswerKeyReference: question.officialAnswerKeyReference, importedAt: new Date(),
    exam: 'JEE', examYear: question.examYear, paperSession: question.paperSession,
    reviewState: 'DRAFT', isActive: false,
    translations: { create: {
      language: 'en', questionText: question.questionText,
      optionA: question.options?.[0] ?? null, optionB: question.options?.[1] ?? null,
      optionC: question.options?.[2] ?? null, optionD: question.options?.[3] ?? null,
      correctOption: question.correctOption ?? null,
      numericAnswer: question.numericAnswer === undefined ? null : new Prisma.Decimal(question.numericAnswer),
      numericTolerance: question.questionType === 'NUMERICAL_VALUE' ? new Prisma.Decimal(0) : null,
      explanation: question.explanation, reviewed: true,
    } },
  };
}

function sameDecimal(value: Prisma.Decimal | null, expected: number | null): boolean {
  return expected === null ? value === null : value !== null && value.equals(new Prisma.Decimal(expected));
}

/** Identity is paper + exact NTA ID, never global wording deduplication. */
export function jeeExistingContentIssues(question: JeeHistoricalQuestion, prior: ExistingJeeReleaseQuestion, subjectId: string, chapterId: string): string[] {
  const data = jeeQuestionData(question, subjectId, chapterId);
  const fields = ['externalId', 'topic', 'difficulty', 'year', 'questionType', 'questionNature', 'contentClass', 'sourceType', 'sourceName', 'sourceUrl', 'officialAnswerKeyReference', 'exam', 'examYear', 'paperSession'] as const;
  const issues = fields.filter(field => prior[field] !== data[field]).map(field => `Existing ${field} differs from canonical content.`);
  if (prior.subjectId !== subjectId || prior.chapterId !== chapterId) issues.push('Existing subject/chapter differs from canonical mapping.');
  if (JSON.stringify(prior.tags) !== JSON.stringify(data.tags)) issues.push('Existing tags differ from canonical identity.');
  if (prior.imageUrl !== null || prior.licenseReference !== null || prior.importedAt === null) issues.push('Existing media/license/import metadata differs from the release.');
  const en = prior.translations.find(translation => translation.language === 'en');
  // Translation-only history can add TA/HI rows without changing this release.
  // English identity/content/answers remain the exact canonical reconciliation.
  if (!en || prior.translations.filter(translation => translation.language === 'en').length !== 1) issues.push('Existing canonical English translation differs from the release.');
  else {
    if (en.questionText !== question.questionText || en.explanation !== question.explanation || !en.reviewed
      || en.optionA !== (question.options?.[0] ?? null) || en.optionB !== (question.options?.[1] ?? null)
      || en.optionC !== (question.options?.[2] ?? null) || en.optionD !== (question.options?.[3] ?? null)
      || en.correctOption !== (question.correctOption ?? null)
      || !sameDecimal(en.numericAnswer, question.numericAnswer ?? null)
      || !sameDecimal(en.numericTolerance, question.questionType === 'NUMERICAL_VALUE' ? 0 : null)) issues.push('Existing English content/answer differs from canonical content.');
  }
  const approved = prior.reviewState === 'APPROVED';
  if (!['DRAFT', 'REVIEW_REQUIRED', 'APPROVED'].includes(prior.reviewState)
    || prior.status !== (approved ? 'PUBLISHED' : 'REVIEW') || prior.isActive !== approved) issues.push('Existing release lifecycle state is unexpected.');
  return issues;
}

export function projectJeeReleaseCounts(states: readonly ('MISSING' | 'DRAFT' | 'REVIEW_REQUIRED' | 'APPROVED')[]) {
  const count = (state: typeof states[number]) => states.filter(value => value === state).length;
  const questionsToImport = count('MISSING');
  const reviewTransitions = questionsToImport + count('DRAFT');
  const questionsToApprove = states.length - count('APPROVED');
  return {
    selected: states.length, questionsToImport, questionsToApprove, reviewTransitions,
    questionVersionRecords: questionsToImport + reviewTransitions + questionsToApprove,
    auditLogRecords: questionsToImport + reviewTransitions + questionsToApprove,
    importBatches: Math.ceil(questionsToImport / JEE_RELEASE_BATCH_SIZE), batchSize: JEE_RELEASE_BATCH_SIZE,
    taxonomyWrites: 0, migrations: 0, unrelatedRecordsModified: 0,
  };
}

export function prepareJeeRelease(questions: readonly JeeHistoricalQuestion[], subjects: readonly TaxonomySubject[], chapters: readonly TaxonomyChapter[], existing: readonly ExistingJeeReleaseQuestion[]) {
  const blockers: string[] = [];
  const byId = new Map(existing.map(question => [question.externalId, question]));
  const prepared = questions.map(question => {
    const matchingSubjects = subjects.filter(subject => subject.code === question.subjectCode);
    const subject = matchingSubjects.length === 1 ? matchingSubjects[0] : undefined;
    const taxonomy = QUESTION_BANK_V1_TAXONOMY.find(unit => unit.exam === 'JEE' && unit.subjectCode === question.subjectCode && unit.unitSlug === question.chapterSlug);
    const matchingChapters = subject && taxonomy ? chapters.filter(chapter => chapter.subjectId === subject.id
      && typeof chapter.name === 'object' && chapter.name !== null && !Array.isArray(chapter.name)
      && typeof chapter.name.en === 'string' && normalizeTaxonomyName(chapter.name.en) === normalizeTaxonomyName(taxonomy.unitName)) : [];
    const chapter = matchingChapters.length === 1 ? matchingChapters[0] : undefined;
    if (!subject) blockers.push(`${question.externalId}: canonical subject is missing or ambiguous.`);
    if (!chapter) blockers.push(`${question.externalId}: canonical chapter is missing or ambiguous.`);
    const prior = byId.get(question.externalId);
    if (prior && subject && chapter) blockers.push(...jeeExistingContentIssues(question, prior, subject.id, chapter.id).map(issue => `${question.externalId}: ${issue}`));
    // Validate the same approval contract before import, using the canonical projected row.
    const projection = {
      id: prior?.id ?? question.externalId, externalId: question.externalId, exam: 'JEE', examYear: question.year,
      topic: question.topic, chapterId: chapter?.id ?? 'CANONICAL_MAPPING_PENDING', questionType: question.questionType,
      sourceType: 'HISTORICAL_VERIFIED', sourceName: question.sourceName, sourceUrl: question.sourceUrl,
      officialAnswerKeyReference: question.officialAnswerKeyReference, reviewState: 'REVIEW_REQUIRED',
      translations: [{ language: 'en', questionText: question.questionText, explanation: question.explanation,
        optionA: question.options?.[0] ?? null, optionB: question.options?.[1] ?? null,
        optionC: question.options?.[2] ?? null, optionD: question.options?.[3] ?? null,
        correctOption: question.correctOption ?? null,
        numericAnswer: question.numericAnswer === undefined ? null : new Prisma.Decimal(question.numericAnswer), numericTolerance: null,
      }],
    } as Parameters<typeof approvalIssues>[0];
    blockers.push(...approvalIssues(projection, { allowChapterOnly: true }).map(issue => `${question.externalId}: ${issue}`));
    return { question, subjectId: subject?.id, chapterId: chapter?.id, prior };
  });
  const counts = projectJeeReleaseCounts(prepared.map(entry => entry.prior?.reviewState as 'DRAFT' | 'REVIEW_REQUIRED' | 'APPROVED' ?? 'MISSING'));
  return { prepared, blockers, counts };
}

export async function selectJeeReleaseAdmin(client: PrismaClient) {
  const admins = await client.admin.findMany({ where: { isActive: true, role: 'SUPER_ADMIN' }, select: { id: true, name: true } });
  if (admins.length !== 1) throw new Error('JEE release requires exactly one active SUPER_ADMIN.');
  return { sub: admins[0].id, name: admins[0].name };
}

/** A resumed run may advance only rows with the exact prior release history. */
export async function jeeReleaseHistoryIssues(client: PrismaClient, existing: readonly ExistingJeeReleaseQuestion[], releaseSha256: string) {
  if (!existing.length) return [];
  const ids = existing.map(question => question.id);
  const [versions, audits] = await Promise.all([
    client.questionVersion.findMany({ where: { questionId: { in: ids } }, select: { questionId: true, version: true, action: true } }),
    client.auditLog.findMany({ where: { entityType: 'Question', entityId: { in: ids } }, select: { entityId: true, action: true, details: true } }),
  ]);
  const issues: string[] = [];
  for (const question of existing) {
    const stage = question.reviewState === 'APPROVED' ? 3 : question.reviewState === 'REVIEW_REQUIRED' ? 2 : 1;
    const history = versions.filter(version => version.questionId === question.id).sort((a, b) => a.version - b.version);
    const records = audits.filter(audit => audit.entityId === question.id);
    const expectedVersions = ['jee-historical:imported', 'updated', 'review:APPROVED'].slice(0, stage);
    const expectedAudits = ['question.jeeHistoricalImport', 'question.update', 'question.review.approved'].slice(0, stage);
    if (history.length !== stage || history.some((version, index) => version.version !== index + 1 || version.action !== expectedVersions[index])
      || records.length !== stage || expectedAudits.some(action => records.filter(audit => audit.action === action).length !== 1)) {
      issues.push(`${question.externalId}: existing version/audit history is not the exact release lifecycle.`);
    }
    const imported = records.find(audit => audit.action === 'question.jeeHistoricalImport');
    if (!imported?.details || typeof imported.details !== 'object' || Array.isArray(imported.details)
      || imported.details.releaseSha256 !== releaseSha256) issues.push(`${question.externalId}: existing import belongs to a different release hash.`);
  }
  return issues;
}

export async function readJeeReleaseDatabase(client: PrismaClient, questions: readonly JeeHistoricalQuestion[], releaseSha256: string) {
  const codes = ['JEE_PHYSICS', 'JEE_CHEMISTRY', 'JEE_MATHEMATICS'];
  const [subjects, chapters, existing, admin] = await Promise.all([
    client.subject.findMany({ where: { code: { in: codes } }, select: { id: true, code: true } }),
    client.chapter.findMany({ where: { subject: { code: { in: codes } } }, select: { id: true, subjectId: true, name: true } }),
    client.question.findMany({ where: { externalId: { in: questions.map(question => question.externalId) } }, include: { translations: true } }),
    selectJeeReleaseAdmin(client),
  ]);
  const preflight = prepareJeeRelease(questions, subjects, chapters, existing);
  preflight.blockers.push(...await jeeReleaseHistoryIssues(client, existing, releaseSha256));
  return { ...preflight, admin, existing };
}
