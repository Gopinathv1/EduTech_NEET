/** Idempotent, repository-controlled JEE demo content seed. Never run against production. */
import { PrismaClient } from '@prisma/client';
import { JEE_DEMO, JEE_DEMO_QUESTIONS as questions, JEE_DEMO_SUBJECTS as subjects } from '../lib/exams/jee-demo';

const prisma = new PrismaClient();
async function main() {
  if (process.env.ALLOW_JEE_DEMO_SEED !== 'true') throw new Error('Refusing to seed JEE demo without ALLOW_JEE_DEMO_SEED=true.');
  const productionTarget = process.env.NODE_ENV === 'production' || (process.env.NEXT_PUBLIC_SITE_URL ?? '').includes('sivora-uprising.com');
  if (productionTarget && process.env.ALLOW_PRODUCTION_JEE_DEMO_SEED !== 'true') throw new Error('Refusing production JEE demo seed without separate ALLOW_PRODUCTION_JEE_DEMO_SEED=true approval.');
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
    await prisma.questionTranslation.upsert({
      where: { questionId_language: { questionId: question.id, language: 'en' } },
      update: { questionText: prompt, optionA: options[0], optionB: options[1], optionC: options[2], optionD: options[3], correctOption: correct, explanation: 'Original SIVORA demonstration question.', reviewed: true },
      create: { questionId: question.id, language: 'en', questionText: prompt, optionA: options[0], optionB: options[1], optionC: options[2], optionD: options[3], correctOption: correct, explanation: 'Original SIVORA demonstration question.', reviewed: true },
    });
    questionIds.push(question.id);
  }
  const test = await prisma.test.upsert({
    where: { id: JEE_DEMO.id },
    update: { title: { en: JEE_DEMO.name }, description: { en: 'A small original SIVORA demo practice set. This is not an official JEE mock.' }, testType: 'MINI_TEST', totalQuestions: JEE_DEMO.totalQuestions, durationMinutes: JEE_DEMO.durationMinutes, isRandom: false, isPublished: true, contentClass: 'PRODUCTION', availableLanguages: ['en'], rules: { exam: 'JEE', mode: JEE_DEMO.mode } },
    create: { id: JEE_DEMO.id, title: { en: JEE_DEMO.name }, description: { en: 'A small original SIVORA demo practice set. This is not an official JEE mock.' }, testType: 'MINI_TEST', totalQuestions: JEE_DEMO.totalQuestions, durationMinutes: JEE_DEMO.durationMinutes, isRandom: false, isPublished: true, contentClass: 'PRODUCTION', availableLanguages: ['en'], rules: { exam: 'JEE', mode: JEE_DEMO.mode }, testQuestions: { create: questionIds.map((questionId, index) => ({ questionId, order: index + 1 })) } },
  });
  await prisma.testQuestion.deleteMany({ where: { testId: test.id } });
  await prisma.testQuestion.createMany({ data: questionIds.map((questionId, index) => ({ testId: test.id, questionId, order: index + 1 })), skipDuplicates: true });
  console.log(`JEE demo ready: ${test.id} (${questionIds.length} questions)`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
