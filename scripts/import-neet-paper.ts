import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient, type Difficulty, type AnswerOption } from '@prisma/client';

const prisma = new PrismaClient();

const EXPECTED_YEAR = 2025;
const EXPECTED_DURATION_MINUTES = 180;
const EXPECTED_QUESTION_COUNT = 180;
const TEST_TITLE = 'NEET 2025 Previous Year Paper';
const SUBJECT_CODES = ['PHYSICS', 'CHEMISTRY', 'BOTANY', 'ZOOLOGY'] as const;
const DIFFICULTIES = new Set(['EASY', 'MEDIUM', 'HARD']);
const ANSWER_OPTIONS = new Set(['A', 'B', 'C', 'D']);

type SubjectCode = (typeof SUBJECT_CODES)[number];

type PaperQuestion = {
  order: number;
  subjectCode: string;
  chapterName: string;
  topic?: string;
  difficulty: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation?: string;
};

type PaperFile = {
  title: string;
  year: number;
  durationMinutes: number;
  questions: PaperQuestion[];
};

type ValidationSummary = {
  questions: number;
  bySubject: Record<SubjectCode, number>;
  missingSubjects: string[];
  missingChapters: string[];
  duplicateQuestions: string[];
  invalidAnswers: string[];
  invalidOrders: string[];
  invalidDifficulties: string[];
  missingFields: string[];
  invalidPaper: string[];
};

function usage(): never {
  console.error([
    'Usage:',
    '  tsx scripts/import-neet-paper.ts [path-to-json] [--import]',
    '',
    'Default mode is DRY RUN. The database is only written when --import is supplied.',
  ].join('\n'));
  process.exit(1);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const importMode = args.includes('--import');
  const fileArg = args.find((arg) => arg !== '--import');
  if (args.some((arg) => arg.startsWith('--') && arg !== '--import')) usage();

  return {
    importMode,
    filePath: path.resolve(process.cwd(), fileArg ?? 'data/neet-2025-template.json'),
  };
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function localizedEnName(value: unknown) {
  if (value && typeof value === 'object' && 'en' in value) {
    const en = (value as { en?: unknown }).en;
    return typeof en === 'string' ? en : '';
  }
  return '';
}

function emptySummary(): ValidationSummary {
  return {
    questions: 0,
    bySubject: { PHYSICS: 0, CHEMISTRY: 0, BOTANY: 0, ZOOLOGY: 0 },
    missingSubjects: [],
    missingChapters: [],
    duplicateQuestions: [],
    invalidAnswers: [],
    invalidOrders: [],
    invalidDifficulties: [],
    missingFields: [],
    invalidPaper: [],
  };
}

function assertPaperShape(raw: unknown): PaperFile {
  if (!raw || typeof raw !== 'object') {
    throw new Error('JSON root must be an object.');
  }
  const paper = raw as Partial<PaperFile>;
  if (!Array.isArray(paper.questions)) {
    throw new Error('JSON must contain questions[].');
  }
  return paper as PaperFile;
}

async function loadPaper(filePath: string) {
  const raw = await readFile(filePath, 'utf8');
  return assertPaperShape(JSON.parse(raw));
}

async function validatePaper(paper: PaperFile): Promise<{
  ok: boolean;
  summary: ValidationSummary;
  subjectIdByCode: Map<string, string>;
  chapterIdBySubjectAndName: Map<string, string>;
}> {
  const summary = emptySummary();
  summary.questions = paper.questions.length;

  if (paper.year !== EXPECTED_YEAR) {
    summary.invalidPaper.push(`year must be ${EXPECTED_YEAR}; got ${paper.year}`);
  }
  if (paper.durationMinutes !== EXPECTED_DURATION_MINUTES) {
    summary.invalidPaper.push(`durationMinutes must be ${EXPECTED_DURATION_MINUTES}; got ${paper.durationMinutes}`);
  }
  if (paper.questions.length !== EXPECTED_QUESTION_COUNT) {
    summary.invalidPaper.push(`questions[] must contain exactly ${EXPECTED_QUESTION_COUNT} questions; got ${paper.questions.length}`);
  }

  const [subjects, chapters] = await Promise.all([
    prisma.subject.findMany({ select: { id: true, code: true } }),
    prisma.chapter.findMany({ select: { id: true, subjectId: true, name: true } }),
  ]);

  const subjectIdByCode = new Map(subjects.map((subject) => [subject.code, subject.id]));
  const subjectIdToCode = new Map(subjects.map((subject) => [subject.id, subject.code]));
  const chapterIdBySubjectAndName = new Map(
    chapters.map((chapter) => [
      `${subjectIdToCode.get(chapter.subjectId) ?? chapter.subjectId}::${normalizeText(localizedEnName(chapter.name))}`,
      chapter.id,
    ]),
  );

  for (const code of SUBJECT_CODES) {
    if (!subjectIdByCode.has(code)) summary.missingSubjects.push(code);
  }

  const seenOrders = new Set<number>();
  const seenQuestionTexts = new Map<string, number>();
  const expectedOrders = new Set(Array.from({ length: EXPECTED_QUESTION_COUNT }, (_, index) => index + 1));

  for (const question of paper.questions) {
    const label = `order ${question.order}`;
    const subjectCode = String(question.subjectCode ?? '').trim().toUpperCase();
    if (SUBJECT_CODES.includes(subjectCode as SubjectCode)) {
      summary.bySubject[subjectCode as SubjectCode] += 1;
    }

    if (!Number.isInteger(question.order)) {
      summary.invalidOrders.push(`${label}: order must be an integer`);
    } else if (seenOrders.has(question.order)) {
      summary.invalidOrders.push(`${label}: duplicate order`);
    } else {
      seenOrders.add(question.order);
    }

    if (!subjectCode || !subjectIdByCode.has(subjectCode)) {
      summary.missingSubjects.push(subjectCode || `${label}: blank subjectCode`);
    }

    const chapterName = String(question.chapterName ?? '').trim();
    if (!chapterName) {
      summary.missingFields.push(`${label}: chapterName is required`);
    } else if (subjectCode && subjectIdByCode.has(subjectCode)) {
      const key = `${subjectCode}::${normalizeText(chapterName)}`;
      if (!chapterIdBySubjectAndName.has(key)) {
        summary.missingChapters.push(`${subjectCode} / ${chapterName}`);
      }
    }

    const difficulty = String(question.difficulty ?? '').trim().toUpperCase();
    if (!DIFFICULTIES.has(difficulty)) {
      summary.invalidDifficulties.push(`${label}: difficulty must be EASY, MEDIUM, or HARD`);
    }

    const correctOption = String(question.correctOption ?? '').trim().toUpperCase();
    if (!ANSWER_OPTIONS.has(correctOption)) {
      summary.invalidAnswers.push(`${label}: correctOption must be A, B, C, or D`);
    }

    for (const field of ['questionText', 'optionA', 'optionB', 'optionC', 'optionD'] as const) {
      if (!String(question[field] ?? '').trim()) {
        summary.missingFields.push(`${label}: ${field} is required`);
      }
    }

    const questionText = String(question.questionText ?? '').trim();
    if (questionText) {
      const hash = normalizeText(questionText);
      const firstOrder = seenQuestionTexts.get(hash);
      if (firstOrder) {
        summary.duplicateQuestions.push(`orders ${firstOrder} and ${question.order}: duplicate question text`);
      } else {
        seenQuestionTexts.set(hash, question.order);
      }
    }
  }

  for (const order of expectedOrders) {
    if (!seenOrders.has(order)) summary.invalidOrders.push(`missing order ${order}`);
  }
  for (const order of seenOrders) {
    if (!expectedOrders.has(order)) summary.invalidOrders.push(`order ${order}: outside 1-${EXPECTED_QUESTION_COUNT}`);
  }

  summary.missingSubjects = [...new Set(summary.missingSubjects)].sort();
  summary.missingChapters = [...new Set(summary.missingChapters)].sort();

  const ok = [
    summary.missingSubjects,
    summary.missingChapters,
    summary.duplicateQuestions,
    summary.invalidAnswers,
    summary.invalidOrders,
    summary.invalidDifficulties,
    summary.missingFields,
    summary.invalidPaper,
  ].every((items) => items.length === 0);

  return { ok, summary, subjectIdByCode, chapterIdBySubjectAndName };
}

function printList(title: string, items: string[]) {
  console.log(`${title}:`);
  if (items.length === 0) {
    console.log('  None');
    return;
  }
  for (const item of items.slice(0, 50)) console.log(`  - ${item}`);
  if (items.length > 50) console.log(`  ...and ${items.length - 50} more`);
}

function printSummary(summary: ValidationSummary) {
  console.log(`Questions: ${summary.questions}`);
  console.log(`Physics: ${summary.bySubject.PHYSICS}`);
  console.log(`Chemistry: ${summary.bySubject.CHEMISTRY}`);
  console.log(`Botany: ${summary.bySubject.BOTANY}`);
  console.log(`Zoology: ${summary.bySubject.ZOOLOGY}`);
  console.log('');
  printList('Missing subjects', summary.missingSubjects);
  printList('Missing chapters', summary.missingChapters);
  printList('Duplicate questions', summary.duplicateQuestions);
  printList('Invalid answers', summary.invalidAnswers);
  printList('Invalid orders', summary.invalidOrders);
  printList('Invalid difficulties', summary.invalidDifficulties);
  printList('Missing fields', summary.missingFields);
  printList('Invalid paper metadata', summary.invalidPaper);
}

async function assertNotAlreadyImported() {
  const existing = await prisma.test.findFirst({
    where: {
      year: EXPECTED_YEAR,
      testType: 'YEAR_PATTERN',
      title: { path: ['en'], equals: TEST_TITLE },
    },
    select: { id: true },
  });
  if (existing) {
    throw new Error(`Import aborted: "${TEST_TITLE}" already exists with id ${existing.id}.`);
  }
}

async function importPaper(
  paper: PaperFile,
  lookups: {
    subjectIdByCode: Map<string, string>;
    chapterIdBySubjectAndName: Map<string, string>;
  },
) {
  await assertNotAlreadyImported();

  return prisma.$transaction(async (tx) => {
    const createdQuestions: { id: string; order: number }[] = [];

    for (const source of [...paper.questions].sort((a, b) => a.order - b.order)) {
      const subjectCode = source.subjectCode.trim().toUpperCase();
      const subjectId = lookups.subjectIdByCode.get(subjectCode);
      const chapterId = lookups.chapterIdBySubjectAndName.get(`${subjectCode}::${normalizeText(source.chapterName)}`);
      if (!subjectId || !chapterId) {
        throw new Error(`Validated lookup missing during import for order ${source.order}.`);
      }

      const question = await tx.question.create({
        data: {
          subjectId,
          chapterId,
          topic: source.topic?.trim() || null,
          difficulty: source.difficulty.trim().toUpperCase() as Difficulty,
          questionType: 'SINGLE_CORRECT',
          status: 'PUBLISHED',
          year: paper.year,
          tags: ['neet-2025', 'previous-year-paper', 'pyq'],
          isActive: true,
          translations: {
            create: {
              language: 'en',
              questionText: source.questionText.trim(),
              optionA: source.optionA.trim(),
              optionB: source.optionB.trim(),
              optionC: source.optionC.trim(),
              optionD: source.optionD.trim(),
              correctOption: source.correctOption.trim().toUpperCase() as AnswerOption,
              explanation: source.explanation?.trim() || null,
              reviewed: true,
            },
          },
        },
        select: { id: true },
      });

      createdQuestions.push({ id: question.id, order: source.order });
    }

    const test = await tx.test.create({
      data: {
        title: { en: TEST_TITLE, ta: '' },
        description: { en: 'Complete NEET 2025 previous-year paper.', ta: '' },
        testType: 'YEAR_PATTERN',
        year: paper.year,
        totalQuestions: EXPECTED_QUESTION_COUNT,
        durationMinutes: paper.durationMinutes,
        price: 0,
        difficulty: 'MEDIUM',
        isRandom: false,
        isPublished: false,
        availableLanguages: ['en'],
        rules: {
          source: 'one-off-json-import',
          paper: TEST_TITLE,
        },
      },
      select: { id: true },
    });

    await tx.testQuestion.createMany({
      data: createdQuestions.map((question) => ({
        testId: test.id,
        questionId: question.id,
        order: question.order,
      })),
    });

    return { testId: test.id, questionsCreated: createdQuestions.length };
  });
}

async function main() {
  const { filePath, importMode } = parseArgs();
  console.log(importMode ? 'Mode: IMPORT' : 'Mode: DRY RUN');
  console.log(`File: ${filePath}`);
  console.log('');

  const paper = await loadPaper(filePath);
  const validation = await validatePaper(paper);
  printSummary(validation.summary);
  console.log('');

  if (!validation.ok) {
    console.log(importMode ? 'IMPORT BLOCKED: VALIDATION FAILED' : 'DRY RUN FAILED');
    process.exitCode = 1;
    return;
  }

  if (!importMode) {
    console.log('DRY RUN PASSED');
    return;
  }

  const result = await importPaper(paper, validation);
  console.log('IMPORT PASSED');
  console.log(`Created test: ${result.testId}`);
  console.log(`Created questions: ${result.questionsCreated}`);
  console.log('Published: false');
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
