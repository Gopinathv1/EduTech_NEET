/** Idempotent, repository-controlled JEE demo content seed. Never run against production. */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const subjects = [
  ['JEE_PHYSICS', 'JEE Physics'],
  ['JEE_CHEMISTRY', 'JEE Chemistry'],
  ['JEE_MATHEMATICS', 'JEE Mathematics'],
] as const;
const questions = [
  ['JEE_PHYSICS', 'Units', 'The dimensional formula of velocity is:', ['[LT⁻¹]', '[L⁻¹T]', '[MLT⁻¹]', '[T⁻¹]'], 'A'],
  ['JEE_PHYSICS', 'Units', 'A body travels 20 m in 4 s. Its average speed is:', ['2 m/s', '5 m/s', '8 m/s', '80 m/s'], 'B'],
  ['JEE_PHYSICS', 'Mechanics', 'The SI unit of work is:', ['Newton', 'Watt', 'Joule', 'Pascal'], 'C'],
  ['JEE_PHYSICS', 'Electrostatics', 'The force between two point charges varies as:', ['r', '1/r', 'r²', '1/r²'], 'D'],
  ['JEE_PHYSICS', 'Modern Physics', 'The energy of a photon is:', ['mc²', 'hν', '½mv²', 'qV'], 'B'],
  ['JEE_CHEMISTRY', 'Mole Concept', 'One mole contains approximately:', ['6.022×10²³ particles', '3.011×10²³ particles', '9.8 particles', '1.602×10⁻¹⁹ particles'], 'A'],
  ['JEE_CHEMISTRY', 'Atomic Structure', 'The charge on an electron is:', ['+1.602×10⁻¹⁹ C', '0 C', '-1.602×10⁻¹⁹ C', '1 C'], 'C'],
  ['JEE_CHEMISTRY', 'Chemical Bonding', 'The bond in NaCl is predominantly:', ['Metallic', 'Ionic', 'Hydrogen', 'Coordinate'], 'B'],
  ['JEE_CHEMISTRY', 'Equilibrium', 'At 25°C, neutral water has pH:', ['0', '1', '7', '14'], 'C'],
  ['JEE_CHEMISTRY', 'Organic Chemistry', 'The general formula of an alkane is:', ['CₙH₂ₙ₊₂', 'CₙH₂ₙ', 'CₙHₙ', 'CₙH₂ₙ₋₂'], 'A'],
  ['JEE_MATHEMATICS', 'Algebra', 'If x + 3 = 7, then x equals:', ['3', '4', '7', '10'], 'B'],
  ['JEE_MATHEMATICS', 'Coordinate Geometry', 'The slope of y = 2x + 1 is:', ['1', '2', '-2', '0'], 'B'],
  ['JEE_MATHEMATICS', 'Trigonometry', 'sin²θ + cos²θ equals:', ['0', '1', '2', 'sin θ'], 'B'],
  ['JEE_MATHEMATICS', 'Calculus', 'The derivative of x² is:', ['x', '2x', 'x³', '2'], 'B'],
  ['JEE_MATHEMATICS', 'Probability', 'The probability of a certain event is:', ['0', '½', '1', '2'], 'C'],
] as const;

async function main() {
  const subjectIds = new Map<string, string>();
  for (const [code, name] of subjects) {
    const subject = await prisma.subject.upsert({
      where: { code }, update: { name }, create: { code, name, order: 10 + subjectIds.size },
    });
    subjectIds.set(code, subject.id);
  }
  const questionIds: string[] = [];
  for (const [code, chapterName, prompt, options, correct] of questions) {
    const subjectId = subjectIds.get(code)!;
    const existingChapter = await prisma.chapter.findFirst({ where: { subjectId, name: { path: ['en'], equals: chapterName } } });
    const chapter = existingChapter ?? await prisma.chapter.create({ data: { subjectId, name: { en: chapterName }, class: 11, weightage: 1, order: 1 } });
    const question = await prisma.question.upsert({
      where: { externalId: `sivora-jee-demo-${questionIds.length + 1}` },
      update: { subjectId, chapterId: chapter.id, status: 'PUBLISHED', isActive: true, contentClass: 'PRODUCTION', sourceType: 'INTERNALLY_AUTHORED', sourceName: 'SIVORA editorial demo', reviewer: 'SIVORA editorial', reviewedAt: new Date() },
      create: { externalId: `sivora-jee-demo-${questionIds.length + 1}`, subjectId, chapterId: chapter.id, exam: 'JEE', difficulty: 'EASY', status: 'PUBLISHED', isActive: true, contentClass: 'PRODUCTION', sourceType: 'INTERNALLY_AUTHORED', sourceName: 'SIVORA editorial demo', reviewer: 'SIVORA editorial', reviewedAt: new Date(), translations: { create: { language: 'en', questionText: prompt, optionA: options[0], optionB: options[1], optionC: options[2], optionD: options[3], correctOption: correct, explanation: 'Original SIVORA demonstration question.', reviewed: true } } },
    });
    questionIds.push(question.id);
  }
  const test = await prisma.test.upsert({
    where: { id: 'sivora-jee-demo-practice' },
    update: { title: { en: 'JEE Main Demo Practice Test' }, description: { en: 'A small original SIVORA demo practice set. This is not an official JEE mock.' }, testType: 'MINI_TEST', totalQuestions: 15, durationMinutes: 30, isRandom: false, isPublished: true, contentClass: 'PRODUCTION', availableLanguages: ['en'], rules: { exam: 'JEE', mode: 'DEMO_PRACTICE' } },
    create: { id: 'sivora-jee-demo-practice', title: { en: 'JEE Main Demo Practice Test' }, description: { en: 'A small original SIVORA demo practice set. This is not an official JEE mock.' }, testType: 'MINI_TEST', totalQuestions: 15, durationMinutes: 30, isRandom: false, isPublished: true, contentClass: 'PRODUCTION', availableLanguages: ['en'], rules: { exam: 'JEE', mode: 'DEMO_PRACTICE' }, testQuestions: { create: questionIds.map((questionId, index) => ({ questionId, order: index + 1 })) } },
  });
  await prisma.testQuestion.deleteMany({ where: { testId: test.id } });
  await prisma.testQuestion.createMany({ data: questionIds.map((questionId, index) => ({ testId: test.id, questionId, order: index + 1 })), skipDuplicates: true });
  console.log(`JEE demo ready: ${test.id} (${questionIds.length} questions)`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
