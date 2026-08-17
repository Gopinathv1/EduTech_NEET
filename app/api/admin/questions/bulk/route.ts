import { z } from 'zod';
import Papa from 'papaparse';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth/admin';
import { validateRows, normalizeText, questionTextHash, BULK_COLUMNS } from '@/lib/admin/bulk';
import { logAudit } from '@/lib/audit';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

// Envelope schema: bound the CSV size (~5 MB of text) so a huge payload can't
// exhaust memory, and default `commit` to false (validate-only).
const bulkImportSchema = z.object({
  csv: z.string().min(1).max(5_000_000),
  commit: z.boolean().optional().default(false),
});

// POST /api/admin/questions/bulk — validate a CSV (commit:false) or import it
// (commit:true). Valid rows are inserted together in a single transaction.
export async function POST(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return fail('unauthorized', 401);

  const body = bulkImportSchema.safeParse(await readJson(req));
  if (!body.success) return fail('invalidCsv', 400);
  const { csv, commit } = body.data;

  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  });

  const fields = parsed.meta.fields ?? [];
  if (!fields.includes('en_questionText') || !fields.includes('subjectCode')) {
    return fail('badHeaders', 400, { expected: BULK_COLUMNS });
  }

  const rows = (parsed.data ?? []).filter((r) => Object.values(r).some((v) => (v ?? '').trim() !== ''));
  if (rows.length === 0) return fail('emptyCsv', 400);

  // Build lookup context from the DB.
  const [subjects, chapters, enTranslations] = await Promise.all([
    prisma.subject.findMany({ select: { id: true, code: true } }),
    prisma.chapter.findMany({ select: { id: true, subjectId: true, name: true } }),
    prisma.questionTranslation.findMany({ where: { language: 'en' }, select: { questionText: true } }),
  ]);
  const subjectIdByCode = new Map(subjects.map((s) => [s.code, s.id]));
  const chapterIdByKey = new Map(
    chapters.map((c) => {
      const nameEn = (c.name as { en?: string })?.en ?? '';
      return [`${c.subjectId}::${normalizeText(nameEn)}`, c.id];
    }),
  );
  const existingHashes = new Set(enTranslations.map((t) => questionTextHash(t.questionText)));

  const results = validateRows(rows, { subjectIdByCode, chapterIdByKey, existingHashes });
  const validRows = results.filter((r) => r.status === 'valid' && r.data);
  const summary = { total: results.length, valid: validRows.length, errors: results.length - validRows.length };

  // Response rows never include the heavy normalised `data` payload.
  const publicRows = (committed: boolean) =>
    results.map((r) => ({
      line: r.line,
      status: r.status === 'valid' && committed ? 'committed' : r.status,
      errors: r.errors,
      preview: r.preview,
    }));

  if (!commit) {
    return ok({ committed: false, summary, results: publicRows(false) });
  }

  let committed = 0;
  if (validRows.length > 0) {
    await prisma.$transaction(async (tx) => {
      for (const r of validRows) {
        const d = r.data!;
        await tx.question.create({
          data: {
            subjectId: d.subjectId,
            chapterId: d.chapterId,
            difficulty: d.difficulty,
            questionType: 'SINGLE_CORRECT',
            year: d.year,
            tags: d.tags,
            status: 'PUBLISHED',
            isActive: true,
            translations: {
              create: [
                {
                  language: 'en',
                  questionText: d.en.questionText,
                  optionA: d.en.optionA,
                  optionB: d.en.optionB,
                  optionC: d.en.optionC,
                  optionD: d.en.optionD,
                  correctOption: d.correctOption,
                  explanation: d.en.explanation || null,
                  reviewed: true,
                },
                ...(d.ta
                  ? [
                      {
                        language: 'ta',
                        questionText: d.ta.questionText,
                        optionA: d.ta.optionA,
                        optionB: d.ta.optionB,
                        optionC: d.ta.optionC,
                        optionD: d.ta.optionD,
                        correctOption: d.correctOption,
                        explanation: d.ta.explanation || null,
                        reviewed: d.ta.reviewed,
                      },
                    ]
                  : []),
              ],
            },
          },
        });
        committed += 1;
      }
    });
  }

  await logAudit(admin, {
    action: 'question.bulkImport',
    entityType: 'Question',
    entityId: null,
    details: { ...summary, committed },
  });

  return ok({ committed: true, summary: { ...summary, committed }, results: publicRows(true) });
}
