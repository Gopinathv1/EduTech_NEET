import { PrismaClient } from '@prisma/client';
import { loadEnvConfig } from '@next/env';
import {
  NEET_SUBJECT_CODES,
  assertSafeSyncTarget,
  normalizeTaxonomyName,
  planCanonicalTaxonomySync,
  type ExistingSubject,
} from '../lib/question-bank/taxonomy-sync';

loadEnvConfig(process.cwd());

const dryRun = process.argv.includes('--dry-run');
const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;
if (!databaseUrl || !directUrl) throw new Error('DATABASE_URL and DIRECT_URL are required.');
const targets = assertSafeSyncTarget({
  databaseUrl,
  directUrl,
  dryRun,
  confirmation: process.env.CANONICAL_TAXONOMY_SYNC_CONFIRM,
});
const prisma = new PrismaClient({ datasourceUrl: directUrl });

const englishName = (name: unknown) => ((name as { en?: string } | null)?.en ?? '').trim();

async function loadExisting(client: PrismaClient): Promise<ExistingSubject[]> {
  const subjects = await client.subject.findMany({
    where: { code: { in: [...NEET_SUBJECT_CODES] } },
    select: { id: true, code: true, chapters: { select: { id: true, name: true } } },
  });
  return subjects.map((subject) => ({
    id: subject.id,
    code: subject.code,
    chapters: subject.chapters.map((chapter) => ({ id: chapter.id, name: englishName(chapter.name) })),
  }));
}

async function main() {
  const before = planCanonicalTaxonomySync(await loadExisting(prisma));
  const safeTarget = {
    databaseUrl: targets.database,
    directUrl: targets.direct,
  };
  if (before.duplicateCanonicalChapters.length || before.ambiguousMatches.length) {
    console.log(JSON.stringify({ mode: dryRun ? 'DRY_RUN' : 'WRITE', target: safeTarget, before }, null, 2));
    throw new Error('Canonical duplicate or ambiguous chapter matches must be resolved before synchronization.');
  }
  if (dryRun) {
    console.log(JSON.stringify({ mode: 'DRY_RUN', target: safeTarget, before, writesPerformed: 0 }, null, 2));
    return;
  }

  const created = await prisma.$transaction(async (tx) => {
    let subjects = 0;
    let chapters = 0;
    for (const definition of before.subjectsMissing) {
      await tx.subject.create({ data: { code: definition.code, name: { en: definition.name, ta: '' }, order: definition.order } });
      subjects += 1;
    }
    const currentSubjects = await tx.subject.findMany({
      where: { code: { in: [...NEET_SUBJECT_CODES] } },
      select: { id: true, code: true, chapters: { select: { id: true, name: true } } },
    });
    for (const definition of before.chaptersMissing) {
      const subject = currentSubjects.find((candidate) => candidate.code === definition.subjectCode);
      if (!subject) throw new Error(`Subject ${definition.subjectCode} is unavailable after subject synchronization.`);
      const matches = subject.chapters.filter((chapter) => normalizeTaxonomyName(englishName(chapter.name)) === normalizeTaxonomyName(definition.name));
      if (matches.length > 1) throw new Error(`Duplicate canonical chapter appeared during sync: ${definition.subjectCode}/${definition.name}`);
      if (matches.length === 0) {
        await tx.chapter.create({
          data: {
            subjectId: subject.id,
            name: { en: definition.name, ta: '' },
            class: 11,
            weightage: 0,
            order: definition.order,
          },
        });
        chapters += 1;
      }
    }
    return { subjects, chapters };
  });

  const after = planCanonicalTaxonomySync(await loadExisting(prisma));
  if (after.subjectsMissing.length || after.chaptersMissing.length || after.duplicateCanonicalChapters.length) {
    throw new Error('Canonical taxonomy remains incomplete after synchronization.');
  }
  console.log(JSON.stringify({ mode: 'WRITE', target: safeTarget, before, created, after, writesPerformed: created.subjects + created.chapters }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

