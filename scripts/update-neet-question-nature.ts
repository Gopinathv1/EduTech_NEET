import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadEnvConfig } from '@next/env';
import { PrismaClient, Prisma } from '@prisma/client';
import { inspectDatabaseTarget } from '../lib/question-bank/taxonomy-sync';
import { questionVersionSnapshot } from '../lib/admin/question-version';
import { questionNatureSchema, type QuestionNature } from '../lib/previous-year/question-nature';
import { QUESTION_BANK_V1_TAXONOMY } from '../lib/question-bank/taxonomy';

loadEnvConfig(process.cwd());
const YEARS = [2021, 2022, 2023, 2024, 2025];
const CONFIRM = 'CLASSIFY_EXACT_780_NEET_PYQS_QUESTION_NATURE_ONLY';
const execute = process.argv.includes('--execute');
const sha = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const read = async (file: string) => JSON.parse(await readFile(file, 'utf8'));
type Source = { externalId: string; year: number; examYear: number; subjectCode: string; chapterSlug: string;
  questionText: string; options: string[]; correctOption: string; sourceUrl: string; officialAnswerKeyReference: string; topic: string };
type Row = { externalId: string; sourceSha256: string; questionNature: QuestionNature; reviewStatus: string };

async function main() {
  const sources: Source[] = (await Promise.all(YEARS.map(y => read(`data/previous-year/neet/${y}/questions.json`)))).flat();
  const artifact = await read('data/previous-year/neet/question-nature.json') as {
    manifestSha256: string; distribution: unknown; rows: Row[] };
  const sourceById = new Map(sources.map(q => [q.externalId, q]));
  const rows = artifact.rows;
  if (sources.length !== 780 || sourceById.size !== 780 || rows.length !== 780
    || new Set(rows.map(row => row.externalId)).size !== 780 || artifact.manifestSha256 !== sha(sources)) throw Error('Exact manifest fingerprint/inventory mismatch');
  for (const row of rows) {
    const source = sourceById.get(row.externalId);
    if (!source || row.sourceSha256 !== sha(source) || !questionNatureSchema.safeParse(row.questionNature).success
      || row.reviewStatus !== 'CLASSIFIED') throw Error(`Unexpected, changed or unresolved classification: ${row.externalId}`);
  }
  console.log(JSON.stringify({ classificationDistribution: artifact.distribution, selected: 780, dryRun: !execute }));
  const url = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;
  if (!url || !directUrl) throw Error('DATABASE_URL and DIRECT_URL required');
  const database = inspectDatabaseTarget(url), direct = inspectDatabaseTarget(directUrl);
  if (!direct.direct || database.database !== direct.database || database.classification !== direct.classification) throw Error('Database targets must agree and DIRECT_URL must be non-pooled');
  if (execute && direct.classification === 'PRODUCTION' && (process.env.NEET_NATURE_CONFIRM !== CONFIRM
    || process.env.NEET_NATURE_EXPECTED_HOST !== direct.host)) throw Error(`Production requires NEET_NATURE_CONFIRM=${CONFIRM} and NEET_NATURE_EXPECTED_HOST matching the verified direct production host`);
  console.log(JSON.stringify({ target: direct }));
  const prisma = new PrismaClient({ datasourceUrl: directUrl });
  try {
    const [column] = await prisma.$queryRaw<Array<{ exists: boolean }>>`SELECT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Question' AND column_name = 'questionNature')`;
    const hasNatureColumn = column.exists;
    if (execute && !hasNatureColumn) throw Error('Additive Question Nature migration must be deployed before execute');
    const inspect = async (tx: Prisma.TransactionClient) => {
      const questions = await tx.question.findMany({ where: { OR: [
        { externalId: { in: rows.map(row => row.externalId) } },
        { exam: 'NEET', examYear: { in: YEARS }, sourceType: 'HISTORICAL_VERIFIED' },
      ] }, select: { id: true, externalId: true, questionNature: hasNatureColumn, exam: true, examYear: true, year: true,
        sourceType: true, sourceUrl: true, officialAnswerKeyReference: true, topic: true, reviewState: true,
        isActive: true, status: true, contentClass: true, translations: true, subject: true, chapter: true } });
      if (questions.length !== 780) throw Error(`Expected exact historical inventory 780; found ${questions.length}`);
      for (const q of questions) {
        const source = sourceById.get(q.externalId ?? '');
        const en = q.translations.find(t => t.language === 'en');
        const taxonomy = source && QUESTION_BANK_V1_TAXONOMY.find(entry => entry.exam === 'NEET' && entry.subjectCode === source.subjectCode && entry.unitSlug === source.chapterSlug);
        if (!source || q.exam !== 'NEET' || q.examYear !== source.year || q.year !== source.year
          || q.sourceType !== 'HISTORICAL_VERIFIED' || q.subject.code !== source.subjectCode
          || !taxonomy || (q.chapter.name as { en?: string }).en?.trim().toLowerCase() !== taxonomy.unitName.trim().toLowerCase()
          || q.topic !== source.topic || q.sourceUrl !== source.sourceUrl || q.officialAnswerKeyReference !== source.officialAnswerKeyReference
          || q.reviewState !== 'APPROVED' || !q.isActive || q.status !== 'PUBLISHED' || q.contentClass !== 'PRODUCTION'
          || !en || en.questionText !== source.questionText || en.correctOption !== source.correctOption
          || JSON.stringify([en.optionA,en.optionB,en.optionC,en.optionD]) !== JSON.stringify(source.options)) throw Error(`Inventory/content drift: ${q.externalId}`);
      }
      return questions;
    };
    await prisma.$transaction(async tx => {
      if (execute) await tx.$executeRaw`SELECT pg_advisory_xact_lock(78020212025::bigint)`;
      const questions = await inspect(tx);
      const before = questions.reduce<Record<string, number>>((counts, q) => {
        const key = q.questionNature ?? 'UNCLASSIFIED'; counts[key] = (counts[key] ?? 0) + 1; return counts;
      }, {});
      const decisions = new Map(rows.map(row => [row.externalId, row.questionNature]));
      const changes = questions.filter(q => q.questionNature !== decisions.get(q.externalId!));
      console.log(JSON.stringify({ before, updatesRequired: changes.length, questionRowsAffected: changes.length,
        unrelatedRecordsModified: 0, contentChanges: ['questionNature'], auditVersions: changes.length }));
      if (!execute) return;
      const email = process.env.NEET_HISTORICAL_ADMIN_EMAIL;
      const admins = await tx.admin.findMany({ where: { isActive: true, ...(email ? { email } : {}) }, select: { id: true, name: true } });
      if (admins.length !== 1) throw Error('Identify exactly one active administrator with NEET_HISTORICAL_ADMIN_EMAIL');
      const admin = { sub: admins[0].id, name: admins[0].name };
      if (changes.length) {
        const values = changes.map(q => Prisma.sql`(${q.id}, ${decisions.get(q.externalId!)!}::"QuestionNature")`);
        // One exact-field statement avoids @updatedAt changes and per-row
        // round trips; the entire update and history remain atomic.
        const affected = await tx.$executeRaw(Prisma.sql`UPDATE "Question" q SET "questionNature" = v.nature
          FROM (VALUES ${Prisma.join(values)}) AS v(id, nature) WHERE q.id = v.id`);
        if (affected !== changes.length) throw Error('Unexpected affected row count');
        const [snapshots, versions] = await Promise.all([
          tx.question.findMany({where:{id:{in:changes.map(q=>q.id)}},include:{translations:true}}),
          tx.questionVersion.groupBy({by:['questionId'],where:{questionId:{in:changes.map(q=>q.id)}},_max:{version:true}}),
        ]);
        const previousVersions = new Map(versions.map(v=>[v.questionId,v._max.version ?? 0]));
        await tx.questionVersion.createMany({data:snapshots.map(q=>({questionId:q.id,
          version:(previousVersions.get(q.id) ?? 0)+1,action:'questionNature:classified',
          editedById:admin.sub,editedByName:admin.name,snapshot:questionVersionSnapshot(q)}))});
        await tx.auditLog.createMany({data:changes.map(q=>({adminId:admin.sub,adminName:admin.name,
          action:'question.nature.classified',entityType:'Question',entityId:q.id,
          details:{before:q.questionNature,after:decisions.get(q.externalId!)!,classificationMethod:'EXACT_PAPER_REASONING_TABLE_V1',manifestSha256:artifact.manifestSha256}}))});
      }
      const after = await inspect(tx);
      if (after.some(q => q.questionNature !== decisions.get(q.externalId!))) throw Error('Post-update classification mismatch');
      console.log(JSON.stringify({ verified: after.length, updated: changes.length, after: artifact.distribution, unrelatedRecordsModified: 0 }));
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 180000 });
  } finally { await prisma.$disconnect(); }
}
main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
