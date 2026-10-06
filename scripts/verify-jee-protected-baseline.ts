import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import nature from '../data/previous-year/neet/question-nature.json';
import { assertJeeDatabaseTargets } from '../lib/previous-year/jee-release';

loadEnvConfig(process.cwd());
const hash = (value: unknown) => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');

/** Scoped content fingerprints only; never exports database rows, users or credentials. */
async function main() {
  if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) throw new Error('Both database URLs are required.');
  assertJeeDatabaseTargets(process.env.DATABASE_URL, process.env.DIRECT_URL);
  const client = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL });
  try {
    const mockIds = ['sivora-neet-full-mock-1', 'sivora-jee-main-full-mock-1'];
    const sampleIds = ['sivora-neet-sample-practice', 'sivora-jee-sample-practice'];
    const tests = await client.test.findMany({ where: { OR: [{ id: { startsWith: 'neet-pyq-' } }, { id: { in: [...mockIds, ...sampleIds] } }] },
      include: { testQuestions: { orderBy: { order: 'asc' } } }, orderBy: { id: 'asc' } });
    const memberIds = tests.flatMap(test => test.testQuestions.map(row => row.questionId));
    const questions = await client.question.findMany({ where: { OR: [
      { externalId: { in: nature.rows.map(row => row.externalId) } }, { id: { in: memberIds } },
    ] }, include: { translations: { orderBy: { language: 'asc' } } }, orderBy: { id: 'asc' } });
    const selected = questions.filter(question => nature.rows.some(row => row.externalId === question.externalId));
    const neetTests = tests.filter(test => test.id.startsWith('neet-pyq-'));
    if (selected.length !== 780 || neetTests.length !== 278 || mockIds.some(id => !tests.some(test => test.id === id))
      || sampleIds.some(id => !tests.some(test => test.id === id))) throw new Error('Protected production baseline counts differ.');
    if (selected.some(question => question.questionNature !== nature.rows.find(row => row.externalId === question.externalId)!.questionNature
      || !question.isActive || question.reviewState !== 'APPROVED' || question.status !== 'PUBLISHED')) throw new Error('Protected NEET nature/lifecycle baseline differs.');
    const files: Record<string, string> = {};
    const scan = async (directory: string) => {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) await scan(file);
        else if (entry.name.endsWith('.json')) files[file.replaceAll('\\', '/')] = hash(await readFile(file, 'utf8'));
      }
    };
    await scan('data/previous-year/neet');
    const quarantine = (await Promise.all([2021, 2022, 2023, 2024, 2025].map(async year => JSON.parse(await readFile(`data/previous-year/neet/${year}/quarantine.json`, 'utf8')) as unknown[]))).flat();
    if (quarantine.length !== 200) throw new Error('Protected NEET quarantine differs.');
    const fingerprint = { questionsSha256: hash(questions), testsSha256: hash(tests), files };
    const report = { status: 'VERIFIED', neetQuestions: selected.length, neetPracticeTests: neetTests.length,
      neetQuarantine: quarantine.length, fullMocks: mockIds.length, sampleTests: sampleIds.length,
      conceptual: selected.filter(row => row.questionNature === 'CONCEPTUAL_THEORY').length,
      numerical: selected.filter(row => row.questionNature === 'NUMERICAL_PROBLEM_SOLVING').length,
      fingerprint, productionWrites: 0, unrelatedRecordsModified: 0 };
    await mkdir('tmp', { recursive: true });
    const destination = 'tmp/jee-protected-baseline.json';
    if (process.argv.includes('--compare')) {
      const baseline = JSON.parse(await readFile(destination, 'utf8')) as typeof report;
      if (JSON.stringify(fingerprint) !== JSON.stringify(baseline.fingerprint)) throw new Error('Protected production/content baseline changed.');
    } else await writeFile(destination, `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify({ ...report, fingerprint: undefined, comparison: process.argv.includes('--compare') ? 'UNCHANGED' : 'CAPTURED' }, null, 2));
  } finally { await client.$disconnect(); }
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Protected baseline verification failed.'); process.exitCode = 1; });
