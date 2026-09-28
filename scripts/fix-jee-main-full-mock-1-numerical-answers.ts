/**
 * Guarded correction for two JEE Main Paper 1 numerical-value questions whose
 * original answers were decimal values.  The 2026 bulletin requires nearest-
 * integer Section B responses.  This command follows the normal edit → review
 * → approval lifecycle; it never writes APPROVED directly.
 */
import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import { approveQuestion } from '../lib/admin/question-approval';
import { logAudit } from '../lib/audit';
import { writeQuestionVersion } from '../lib/admin/question-version';
import { inspectDatabaseTarget } from '../lib/question-bank/taxonomy-sync';

loadEnvConfig(process.cwd());

const CONFIRMATION = 'FIX_JEE_MAIN_FULL_MOCK_1_NUMERICAL_ANSWERS';
const dryRun = !process.argv.includes('--execute');
const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;
if (!databaseUrl || !directUrl) throw new Error('DATABASE_URL and DIRECT_URL are required.');

const database = inspectDatabaseTarget(databaseUrl);
const direct = inspectDatabaseTarget(directUrl);
if (database.database !== direct.database || database.classification !== direct.classification || !direct.direct) {
  throw new Error('DATABASE_URL and DIRECT_URL must target the same database and DIRECT_URL must be non-pooled.');
}
if (!dryRun && direct.classification === 'PRODUCTION' && process.env.JEE_NUMERICAL_FIX_CONFIRM !== CONFIRMATION) {
  throw new Error(`Production write refused. Set JEE_NUMERICAL_FIX_CONFIRM=${CONFIRMATION}.`);
}

const corrections = [
  {
    externalId: 'sivora-authored:f344b91948a8a2fd4c124385',
    previousText: 'The number of moles in 9 g of water (molar mass 18 g mol⁻¹) is:',
    previousAnswer: '0.5',
    questionText: 'The number of moles in 18 g of water (molar mass 18 g mol⁻¹) is:',
    numericAnswer: '1',
    explanation: 'n=m/M=18/18=1 mol.',
  },
  {
    externalId: 'sivora-authored:f5e5406a83c1d7390765f25f',
    previousText: 'For a first-order reaction with k=0.20 min⁻¹, the initial rate when [A]=0.50 mol L⁻¹, in mol L⁻¹ min⁻¹, is:',
    previousAnswer: '0.1',
    questionText: 'For a first-order reaction with k=0.20 min⁻¹, the initial rate when [A]=5.0 mol L⁻¹, in mol L⁻¹ min⁻¹, is:',
    numericAnswer: '1',
    explanation: 'Rate=k[A]=0.20×5.0=1.0 mol L⁻¹ min⁻¹.',
  },
] as const;

const prisma = new PrismaClient({ datasourceUrl: directUrl });

async function main() {
  const rows = await prisma.question.findMany({
    where: { externalId: { in: corrections.map((correction) => correction.externalId) } },
    select: { id: true, externalId: true, exam: true, questionType: true, reviewState: true, status: true, contentClass: true, isActive: true, reviewer: true, translations: { where: { language: 'en' }, select: { questionText: true, numericAnswer: true, explanation: true } } },
  });
  if (rows.length !== corrections.length) throw new Error(`Expected ${corrections.length} exact questions; found ${rows.length}.`);

  const byExternalId = new Map(rows.map((row) => [row.externalId, row]));
  const planned = corrections.map((correction) => {
    const row = byExternalId.get(correction.externalId);
    const en = row?.translations[0];
    const alreadyCorrect = en?.questionText === correction.questionText && en.numericAnswer?.toString() === correction.numericAnswer && en.explanation === correction.explanation;
    const eligible = row?.exam === 'JEE' && row.questionType === 'NUMERICAL_VALUE' && (alreadyCorrect || (row.reviewState === 'APPROVED' && row.status === 'PUBLISHED' && row.contentClass === 'PRODUCTION' && row.isActive && en?.questionText === correction.previousText && en.numericAnswer?.toString() === correction.previousAnswer));
    return { correction, row, alreadyCorrect, eligible };
  });
  const unexpected = planned.filter((entry) => !entry.eligible);
  console.log(JSON.stringify({ mode: dryRun ? 'DRY_RUN' : 'EXECUTE', target: { database, direct }, selected: corrections.length, eligible: planned.filter((entry) => entry.eligible).length, alreadyCorrect: planned.filter((entry) => entry.alreadyCorrect).length, unexpected: unexpected.map((entry) => entry.correction.externalId), unrelated: 0 }, null, 2));
  if (unexpected.length) throw new Error('Unexpected question state; refusing to modify content.');
  if (dryRun || planned.every((entry) => entry.alreadyCorrect)) return;

  const activeAdmins = await prisma.admin.findMany({ where: { isActive: true }, select: { id: true, name: true, email: true } });
  const email = process.env.JEE_NUMERICAL_FIX_REVIEWER_EMAIL?.trim().toLowerCase();
  const originalReviewers = new Set(planned.map((entry) => entry.row?.reviewer?.trim()).filter((name): name is string => Boolean(name)));
  const matches = email
    ? activeAdmins.filter((admin) => admin.email.toLowerCase() === email)
    : originalReviewers.size === 1
      ? activeAdmins.filter((admin) => admin.name === [...originalReviewers][0])
      : [];
  const reviewer = matches.length === 1 ? matches[0] : undefined;
  if (!reviewer) {
    throw new Error('Set JEE_NUMERICAL_FIX_REVIEWER_EMAIL to the active administrator when the original reviewer cannot be identified uniquely.');
  }

  for (const entry of planned) {
    if (entry.alreadyCorrect) continue;
    const { correction, row } = entry;
    await prisma.$transaction(async (tx) => {
      await tx.question.update({ where: { id: row!.id }, data: { reviewState: 'REVIEW_REQUIRED', reviewNote: null, reviewer: null, reviewedAt: null, status: 'REVIEW', isActive: false } });
      await tx.questionTranslation.update({ where: { questionId_language: { questionId: row!.id, language: 'en' } }, data: { questionText: correction.questionText, numericAnswer: correction.numericAnswer, explanation: correction.explanation, reviewed: true } });
      await writeQuestionVersion(tx, row!.id, 'updated', { sub: reviewer.id, name: reviewer.name });
    });
    await logAudit({ sub: reviewer.id, name: reviewer.name }, { action: 'question.update', entityType: 'Question', entityId: row!.id, details: { jeeMainNumericalFormatCorrection: true } });
    await approveQuestion(row!.id, { sub: reviewer.id, name: reviewer.name });
  }

  const verified = await prisma.question.findMany({ where: { externalId: { in: corrections.map((correction) => correction.externalId) } }, select: { externalId: true, reviewState: true, status: true, contentClass: true, isActive: true, translations: { where: { language: 'en' }, select: { questionText: true, numericAnswer: true, explanation: true } } } });
  const complete = corrections.every((correction) => {
    const row = verified.find((question) => question.externalId === correction.externalId);
    const en = row?.translations[0];
    return row?.reviewState === 'APPROVED' && row.status === 'PUBLISHED' && row.contentClass === 'PRODUCTION' && row.isActive && en?.questionText === correction.questionText && en.numericAnswer?.toString() === correction.numericAnswer && en.explanation === correction.explanation;
  });
  console.log(JSON.stringify({ corrected: complete ? corrections.length : 0, approved: verified.filter((row) => row.reviewState === 'APPROVED').length, unrelatedModified: 0 }, null, 2));
  if (!complete) throw new Error('Post-correction verification failed.');
}

main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
