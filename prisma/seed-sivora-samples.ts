/** Additive, deterministic student-engine fixtures. Never alters production questions. */
import { PrismaClient } from '@prisma/client';
import { JEE_DEMO_QUESTIONS, JEE_DEMO_SUBJECTS } from '../lib/exams/jee-demo';

const prisma = new PrismaClient();
const rows = [
  ['PHYSICS', 'SIVORA Sample Physics', 'Which quantity is measured in newtons?', ['Energy', 'Force', 'Power', 'Charge'], 'B'],
  ['CHEMISTRY', 'SIVORA Sample Chemistry', 'The chemical symbol for oxygen is:', ['O', 'Ox', 'Og', 'C'], 'A'],
  ['BOTANY', 'SIVORA Sample Biology', 'The basic unit of life is the:', ['Atom', 'Tissue', 'Cell', 'Organ'], 'C'],
] as const;

async function main() {
  const controlledTestIds = ['sivora-neet-sample-practice', 'sivora-jee-sample-practice'];
  const controlledQuestionIds = [
    ...rows.map(([code]) => `sivora-neet-sample-${code.toLowerCase()}`),
    ...JEE_DEMO_QUESTIONS.map((_, index) => `sivora-jee-sample-${index + 1}`),
  ];
  const [testCollisions, questionCollisions] = await Promise.all([
    prisma.test.findMany({ where: { id: { in: controlledTestIds }, contentClass: { not: 'SAMPLE' } }, select: { id: true, contentClass: true } }),
    prisma.question.findMany({ where: { externalId: { in: controlledQuestionIds }, contentClass: { not: 'SAMPLE' } }, select: { externalId: true, contentClass: true } }),
  ]);
  if (testCollisions.length || questionCollisions.length) throw new Error(`Refusing sample seed because controlled IDs collide with non-sample records: ${JSON.stringify({ testCollisions, questionCollisions })}`);

  const questionIds: string[] = [];
  for (const [code, chapterName, prompt, options, correct] of rows) {
    const subject = await prisma.subject.upsert({ where: { code }, update: {}, create: { code, name: { en: code === 'BOTANY' ? 'Biology' : code[0] + code.slice(1).toLowerCase() }, order: 1 } });
    const chapter = await prisma.chapter.findFirst({ where: { subjectId: subject.id, name: { path: ['en'], equals: chapterName } } }) ?? await prisma.chapter.create({ data: { subjectId: subject.id, name: { en: chapterName }, class: 11, weightage: 1, order: 1 } });
    const externalId = `sivora-neet-sample-${code.toLowerCase()}`;
    const question = await prisma.question.upsert({
      where: { externalId },
      update: { subjectId: subject.id, chapterId: chapter.id, exam: 'NEET', status: 'PUBLISHED', isActive: true, contentClass: 'SAMPLE' },
      create: { externalId, subjectId: subject.id, chapterId: chapter.id, exam: 'NEET', difficulty: 'EASY', status: 'PUBLISHED', isActive: true, contentClass: 'SAMPLE', sourceType: 'SIVORA_AUTHORED', sourceName: 'SIVORA sample', translations: { create: { language: 'en', questionText: prompt, optionA: options[0], optionB: options[1], optionC: options[2], optionD: options[3], correctOption: correct, explanation: 'Original SIVORA sample question.', reviewed: true } } },
    });
    await prisma.questionTranslation.upsert({ where: { questionId_language: { questionId: question.id, language: 'en' } }, update: { questionText: prompt, optionA: options[0], optionB: options[1], optionC: options[2], optionD: options[3], correctOption: correct, explanation: 'Original SIVORA sample question.', reviewed: true }, create: { questionId: question.id, language: 'en', questionText: prompt, optionA: options[0], optionB: options[1], optionC: options[2], optionD: options[3], correctOption: correct, explanation: 'Original SIVORA sample question.', reviewed: true } });
    questionIds.push(question.id);
  }
  const test = await prisma.test.upsert({
    where: { id: 'sivora-neet-sample-practice' },
    update: { title: { en: 'SIVORA NEET Sample Practice Test' }, description: { en: 'Original SIVORA sample questions for testing the student exam experience. Not an official NTA paper or full mock.' }, testType: 'MINI_TEST', totalQuestions: 3, durationMinutes: 10, price: 0, isRandom: false, isPublished: true, contentClass: 'SAMPLE', availableLanguages: ['en'], rules: { exam: 'NEET', mode: 'SAMPLE_PRACTICE' } },
    create: { id: 'sivora-neet-sample-practice', title: { en: 'SIVORA NEET Sample Practice Test' }, description: { en: 'Original SIVORA sample questions for testing the student exam experience. Not an official NTA paper or full mock.' }, testType: 'MINI_TEST', totalQuestions: 3, durationMinutes: 10, price: 0, isRandom: false, isPublished: true, contentClass: 'SAMPLE', availableLanguages: ['en'], rules: { exam: 'NEET', mode: 'SAMPLE_PRACTICE' } },
  });
  for (const [order, questionId] of questionIds.entries()) await prisma.testQuestion.upsert({ where: { testId_questionId: { testId: test.id, questionId } }, update: { order: order + 1 }, create: { testId: test.id, questionId, order: order + 1 } });
  console.log(`NEET sample ready: ${test.id} (${questionIds.length} questions)`);

  const jeeSubjectIds = new Map<string, string>();
  for (const [code, name] of JEE_DEMO_SUBJECTS) {
    const subject = await prisma.subject.upsert({ where: { code }, update: {}, create: { code, name, order: 10 + jeeSubjectIds.size } });
    jeeSubjectIds.set(code, subject.id);
  }
  const jeeQuestionIds: string[] = [];
  for (const [index, [code, chapterName, prompt, options, correct]] of JEE_DEMO_QUESTIONS.entries()) {
    const subjectId = jeeSubjectIds.get(code)!;
    const chapter = await prisma.chapter.findFirst({ where: { subjectId, name: { path: ['en'], equals: chapterName } } }) ?? await prisma.chapter.create({ data: { subjectId, name: { en: chapterName }, class: 11, weightage: 1, order: 1 } });
    const externalId = `sivora-jee-sample-${index + 1}`;
    const question = await prisma.question.upsert({
      where: { externalId },
      update: { subjectId, chapterId: chapter.id, exam: 'JEE', status: 'PUBLISHED', isActive: true, contentClass: 'SAMPLE' },
      create: { externalId, subjectId, chapterId: chapter.id, exam: 'JEE', difficulty: 'EASY', status: 'PUBLISHED', isActive: true, contentClass: 'SAMPLE', sourceType: 'SIVORA_AUTHORED', sourceName: 'SIVORA sample', translations: { create: { language: 'en', questionText: prompt, optionA: options[0], optionB: options[1], optionC: options[2], optionD: options[3], correctOption: correct, explanation: 'Original SIVORA sample question.', reviewed: true } } },
    });
    await prisma.questionTranslation.upsert({ where: { questionId_language: { questionId: question.id, language: 'en' } }, update: { questionText: prompt, optionA: options[0], optionB: options[1], optionC: options[2], optionD: options[3], correctOption: correct, explanation: 'Original SIVORA sample question.', reviewed: true }, create: { questionId: question.id, language: 'en', questionText: prompt, optionA: options[0], optionB: options[1], optionC: options[2], optionD: options[3], correctOption: correct, explanation: 'Original SIVORA sample question.', reviewed: true } });
    jeeQuestionIds.push(question.id);
  }
  const jeeTest = await prisma.test.upsert({
    where: { id: 'sivora-jee-sample-practice' },
    update: { title: { en: 'SIVORA JEE Sample Practice Test' }, description: { en: 'Original SIVORA sample questions for testing the student exam experience. Not an official JEE paper or full mock.' }, testType: 'MINI_TEST', totalQuestions: 15, durationMinutes: 30, price: 0, isRandom: false, isPublished: true, contentClass: 'SAMPLE', availableLanguages: ['en'], rules: { exam: 'JEE', mode: 'SAMPLE_PRACTICE' } },
    create: { id: 'sivora-jee-sample-practice', title: { en: 'SIVORA JEE Sample Practice Test' }, description: { en: 'Original SIVORA sample questions for testing the student exam experience. Not an official JEE paper or full mock.' }, testType: 'MINI_TEST', totalQuestions: 15, durationMinutes: 30, price: 0, isRandom: false, isPublished: true, contentClass: 'SAMPLE', availableLanguages: ['en'], rules: { exam: 'JEE', mode: 'SAMPLE_PRACTICE' } },
  });
  for (const [order, questionId] of jeeQuestionIds.entries()) await prisma.testQuestion.upsert({ where: { testId_questionId: { testId: jeeTest.id, questionId } }, update: { order: order + 1 }, create: { testId: jeeTest.id, questionId, order: order + 1 } });
  console.log(`JEE sample ready: ${jeeTest.id} (${jeeQuestionIds.length} questions)`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
