import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import { inspectDatabaseTarget } from '../lib/question-bank/taxonomy-sync';
import { questionTextHash } from '../lib/admin/bulk';
import { NEET_PYQ_YEARS, neetContentIssues, neetDuplicateOwners, neetPracticeYear, neetProductionEligible,
  type NeetCandidate } from '../lib/previous-year/neet-release-readiness';
import { previousYearExam, previousYearMode } from '../lib/previous-year/modes';
import natureManifest from '../data/previous-year/neet/question-nature.json';

// SELECT-only transaction. This command has no approval/import/publish/execute mode.
const envArg = process.argv.indexOf('--env-dir');
loadEnvConfig(envArg < 0 ? process.cwd() : path.resolve(process.argv[envArg + 1]));
const output = 'data/previous-year/neet/release-2013-2025';
const read = (file: string) => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const sha = (file: string) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const sources = NEET_PYQ_YEARS.filter(year => fs.existsSync(`data/previous-year/neet/${year}/questions.json`));
const candidates = sources.flatMap(year => read(`data/previous-year/neet/${year}/questions.json`) as NeetCandidate[]);
if (candidates.length !== 1083 || new Set(candidates.map(q => q.externalId)).size !== candidates.length) {
  throw Error('Expected 1083 unique validated 2019–2025 candidates. Review source selection explicitly before changing this gate.');
}
const fileHashes = sources.map(year => ({ year, sha256: sha(`data/previous-year/neet/${year}/questions.json`) }));
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw Error('Read-only database connection is unavailable. No release package generated.');
const target = inspectDatabaseTarget(url);
if (process.env.DIRECT_URL && process.env.DATABASE_URL) {
  const pooled = inspectDatabaseTarget(process.env.DATABASE_URL);
  if (pooled.database !== target.database || pooled.classification !== target.classification) throw Error('Database targets disagree.');
}
const client = new PrismaClient({ datasourceUrl: url, log: [] });

async function main() {
  const snapshot = await client.$transaction(async tx => {
    await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
    const rows = await tx.question.findMany({ where: { exam: 'NEET' }, include: {
      translations: { where: { language: 'en' } }, subject: { select: { code: true } }, chapter: { select: { name: true } },
    } });
    const tests = await tx.test.findMany({ where: { contentClass: 'PRODUCTION', isPublished: true,
      availableLanguages: { has: 'en' } }, include: { testQuestions: { select: { questionId: true, order: true }, orderBy: { order: 'asc' } } } });
    return { rows, tests };
  }, { timeout: 60000 });
  const byId = new Map(snapshot.rows.map(q => [q.externalId, q]));
  const owners = neetDuplicateOwners(snapshot.rows.flatMap(q => q.translations.map(t => ({ id: q.id, questionText: t.questionText }))));
  const repoOwners = neetDuplicateOwners(candidates.map(q => ({ id: q.externalId, questionText: q.questionText })));
  const natureIds = new Set(natureManifest.rows.map(q => q.externalId));
  const neetTests = snapshot.tests.filter(t => previousYearExam(t.rules) === 'NEET' && previousYearMode(t));
  const reviewed = candidates.map(q => {
    const db = byId.get(q.externalId);
    const issues = db ? neetContentIssues(q, db) : ['NOT_STORED'];
    const hash = questionTextHash(q.questionText);
    const duplicateIds = [...(owners.get(hash) ?? [])].filter(id => id !== db?.id);
    const repositoryDuplicates = [...(repoOwners.get(hash) ?? [])].filter(id => id !== q.externalId);
    if (duplicateIds.length || repositoryDuplicates.length) issues.push('NORMALIZED_STEM_COLLISION_REQUIRES_REVIEW');
    const approved = db?.reviewState === 'APPROVED';
    const eligible = !!db && neetProductionEligible(db);
    if (db && !approved) issues.push('NOT_APPROVED');
    if (db && !eligible) issues.push('NOT_PRODUCTION_ELIGIBLE');
    return { q, db, issues, duplicateIds, repositoryDuplicates, approved: !!approved, eligible };
  });
  const exactEligibleIds = new Set(reviewed.filter(r => !r.issues.length && r.eligible).map(r => r.db!.id));
  const reachable = new Set<string>();
  for (const t of neetTests) {
    const rules = t.rules as { historical?: { years?: number[] }; random?: { subjectIds?: string[]; chapterIds?: string[] } };
    const pool = reviewed.filter(r => r.db && exactEligibleIds.has(r.db.id) && natureIds.has(r.q.externalId)
      && (t.isRandom ? (rules.historical?.years ?? []).includes(r.q.year)
        && (!rules.random?.subjectIds?.length || rules.random.subjectIds.includes(r.db.subjectId))
        && (!rules.random?.chapterIds?.length || rules.random.chapterIds.includes(r.db.chapterId))
        : t.testQuestions.some(m => m.questionId === r.db!.id)));
    // Fixed tests must be complete. Random tests are only reported reachable when their all-question pool can fill the plan.
    if (t.totalQuestions > 0 && (t.isRandom ? pool.length >= t.totalQuestions
      : t.testQuestions.length === t.totalQuestions && pool.length === t.totalQuestions)) pool.forEach(r => reachable.add(r.db!.id));
  }
  const release = reviewed.filter(r => !r.issues.length && r.approved && r.eligible).map(r => ({ ...r.q,
    databaseQuestionId: r.db!.id, approvalEvidence: { reviewState: r.db!.reviewState, reviewerPresent: !!r.db!.reviewer,
      reviewedAt: r.db!.reviewedAt, status: r.db!.status, isActive: r.db!.isActive },
    studentReachable: reachable.has(r.db!.id) }));
  const byYear = NEET_PYQ_YEARS.map(year => {
    const rows = reviewed.filter(r => r.q.year === year);
    const quarantineFile = `data/previous-year/neet/${year}/quarantine.json`;
    const quarantined = fs.existsSync(quarantineFile) ? read(quarantineFile).length : 0;
    return { year, verified: rows.length, stored: rows.filter(r => r.db).length, approved: rows.filter(r => r.approved).length,
      exactApproved: rows.filter(r => r.approved && !r.issues.length).length,
      studentVisible: rows.filter(r => r.db && reachable.has(r.db.id)).length,
      releaseReady: release.filter(q => q.year === year).length, quarantined,
      blockedValidated: rows.filter(r => r.issues.length).length,
      blockedKnownRecords: quarantined + rows.filter(r => r.issues.length).length,
      duplicateCandidates: rows.filter(r => r.duplicateIds.length || r.repositoryDuplicates.length).length };
  });
  fs.mkdirSync(output, { recursive: true });
  const write = (file: string, value: unknown) => fs.writeFileSync(`${output}/${file}`, JSON.stringify(value, null, 2) + '\n');
  write('questions.json', release);
  write('blocked.json', reviewed.filter(r => r.issues.length).map(r => ({ externalId: r.q.externalId, year: r.q.year,
    databaseQuestionId: r.db?.id ?? null, issues: r.issues, duplicateIds: r.duplicateIds, repositoryDuplicates: r.repositoryDuplicates })));
  write('manifest.json', { schemaVersion: 1, checkedAt: new Date().toISOString(), scope: 'ENGLISH_NEET_2013_2025',
    databaseEvidence: 'LIVE_SELECT_ONLY_READ_ONLY_TRANSACTION', targetClassification: target.classification,
    targetFingerprint: createHash('sha256').update(`${target.host}:${target.port}/${target.database}`).digest('hex'),
    fileHashes, byYear, releaseReadyCount: release.length,
    yearPractices: neetTests.filter(t => !t.isRandom && previousYearMode(t) === 'YEAR_WISE' && t.totalQuestions > 0
      && t.testQuestions.length === t.totalQuestions && t.testQuestions.every(m => exactEligibleIds.has(m.questionId)))
      .map(t => ({ id: t.id, year: neetPracticeYear(t), totalQuestions: t.totalQuestions, questionIds: t.testQuestions.map(m => m.questionId) })),
    unmatchedHistoricalRows: snapshot.rows.filter(q => q.sourceType === 'HISTORICAL_VERIFIED' && !candidates.some(c => c.externalId === q.externalId))
      .map(q => ({ externalId: q.externalId, examYear: q.examYear, reviewState: q.reviewState, eligible: neetProductionEligible(q) })),
    batches: Array.from({ length: Math.ceil(release.length / 25) }, (_, i) => ({ id: `neet-approved-${String(i + 1).padStart(2, '0')}`,
      externalIds: release.slice(i * 25, (i + 1) * 25).map(q => q.externalId), status: 'LOCAL_REVIEW_ONLY' })),
    questionsSha256: sha(`${output}/questions.json`),
    blockedSha256: sha(`${output}/blocked.json`), releaseGate: { productionReleaseAuthorized: false, importReady: false,
      approvalWrites: 0, productionWrites: 0, published: false },
    visibilityDefinition: 'Exact source/content/answer match, approved production gate, unique normalized stem, English, reachable in a published compatible NEET PYQ all-question pool. Not proof of checkout/attempt/scoring E2E.',
    duplicateDefinition: 'Normalized English stem only; historical repeat identities remain separate and require editorial review, never automatic merge.',
    limitations: ['Current snapshot only: re-run before any release.', 'Random-plan per-subject/difficulty feasibility and live student E2E remain release checks.',
      'Years without datasets have no claimed approval count outside the source-verified candidate selection. Missing source slots are not quarantine records.'],
  });
  console.log(JSON.stringify({ targetClassification: target.classification, byYear, releaseReadyCount: release.length, output }, null, 2));
}
main().catch(() => { console.error('Read-only reconciliation failed; no current database approval claim is available. Inspect connectivity/schema without printing credentials.'); process.exitCode = 1; })
  .finally(() => client.$disconnect());
