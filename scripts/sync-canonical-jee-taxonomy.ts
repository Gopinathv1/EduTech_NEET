import { PrismaClient } from '@prisma/client';
import { loadEnvConfig } from '@next/env';
import { JEE_SUBJECT_CODES, inspectDatabaseTarget, normalizeTaxonomyName, planCanonicalJeeTaxonomySync, type ExistingSubject } from '../lib/question-bank/taxonomy-sync';

loadEnvConfig(process.cwd());
const dryRun = !process.argv.includes('--execute');
const databaseUrl = process.env.DATABASE_URL, directUrl = process.env.DIRECT_URL;
if (!databaseUrl || !directUrl) throw new Error('DATABASE_URL and DIRECT_URL are required.');
const database = inspectDatabaseTarget(databaseUrl), direct = inspectDatabaseTarget(directUrl);
if (database.database !== direct.database || database.classification !== direct.classification || !direct.direct) throw new Error('Unsafe database target.');
if (!dryRun && direct.classification === 'PRODUCTION' && process.env.JEE_TAXONOMY_SYNC_CONFIRM !== 'SYNC_CANONICAL_JEE_TAXONOMY') throw new Error('Production write refused. Set JEE_TAXONOMY_SYNC_CONFIRM=SYNC_CANONICAL_JEE_TAXONOMY.');
const prisma = new PrismaClient({ datasourceUrl: directUrl });
const english = (value: unknown) => ((value as { en?: string } | null)?.en ?? '').trim();
async function loadExisting(): Promise<ExistingSubject[]> {
  const rows = await prisma.subject.findMany({ where: { code: { in: [...JEE_SUBJECT_CODES] } }, select: { id: true, code: true, chapters: { select: { id: true, name: true } } } });
  return rows.map((row) => ({ id: row.id, code: row.code, chapters: row.chapters.map((chapter) => ({ id: chapter.id, name: english(chapter.name) })) }));
}
async function main() {
  const subjects = await loadExisting();
  if (subjects.length !== 3) throw new Error(`Expected all three JEE subjects; found ${subjects.length}.`);
  const before = planCanonicalJeeTaxonomySync(subjects);
  if (before.duplicateCanonicalChapters.length) throw new Error('Duplicate canonical JEE chapters must be resolved first.');
  console.log(JSON.stringify({ mode: dryRun ? 'DRY_RUN' : 'EXECUTE', target: { database, direct }, before }, null, 2));
  if (dryRun) return;
  let created = 0;
  await prisma.$transaction(async (tx) => {
    const current = await tx.subject.findMany({ where: { code: { in: [...JEE_SUBJECT_CODES] } }, select: { id: true, code: true, chapters: { select: { name: true } } } });
    for (const definition of before.chaptersMissing) {
      const subject = current.find((row) => row.code === definition.subjectCode);
      if (!subject) throw new Error(`Missing subject ${definition.subjectCode}.`);
      if (subject.chapters.some((chapter) => normalizeTaxonomyName(english(chapter.name)) === normalizeTaxonomyName(definition.name))) continue;
      await tx.chapter.create({ data: { subjectId: subject.id, name: { en: definition.name, ta: '' }, class: 11, weightage: 0, order: definition.order } });
      created += 1;
    }
  }, { maxWait: 10_000, timeout: 30_000 });
  const after = planCanonicalJeeTaxonomySync(await loadExisting());
  if (after.writesRequired || after.duplicateCanonicalChapters.length) throw new Error('JEE taxonomy remains incomplete.');
  console.log(JSON.stringify({ created, after }, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
