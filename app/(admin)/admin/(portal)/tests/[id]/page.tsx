import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { localizedName } from '@/lib/admin/format';
import { AdminPageHeader } from '@/components/admin/ui';
import TestForm, { type TestFormInitial } from '@/components/admin/TestForm';

export default async function EditTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [test, subjects] = await Promise.all([
    prisma.test.findUnique({
      where: { id },
      include: {
        testQuestions: {
          orderBy: { order: 'asc' },
          include: {
            question: {
              include: {
                subject: true,
                chapter: true,
                translations: { where: { language: 'en' }, select: { questionText: true } },
              },
            },
          },
        },
      },
    }),
    prisma.subject.findMany({ orderBy: { order: 'asc' }, include: { chapters: { orderBy: { order: 'asc' } } } }),
  ]);
  if (!test) notFound();

  const subjectOptions = subjects.map((s) => ({
    id: s.id,
    name: localizedName(s.name) || s.code,
    chapters: s.chapters.map((c) => ({ id: c.id, name: localizedName(c.name) })),
  }));

  const rules = (test.rules ?? {}) as {
    difficultyMix?: { EASY?: number; MEDIUM?: number; HARD?: number };
    random?: { scope?: string; subjectIds?: string[]; chapterIds?: string[] };
  };

  const initial: TestFormInitial = {
    id: test.id,
    titleEn: localizedName(test.title, 'en'),
    titleTa: localizedName(test.title, 'ta'),
    descEn: localizedName(test.description, 'en'),
    descTa: localizedName(test.description, 'ta'),
    testType: test.testType,
    year: test.year != null ? String(test.year) : '',
    durationMinutes: String(test.durationMinutes),
    price: String(test.price),
    mix: {
      EASY: rules.difficultyMix?.EASY ?? 30,
      MEDIUM: rules.difficultyMix?.MEDIUM ?? 50,
      HARD: rules.difficultyMix?.HARD ?? 20,
    },
    ta: test.availableLanguages.includes('ta'),
    mode: test.isRandom ? 'RANDOM' : 'FIXED',
    totalQuestions: String(test.totalQuestions),
    scope: (rules.random?.scope as TestFormInitial['scope']) ?? 'FULL_SYLLABUS',
    subjectIds: rules.random?.subjectIds ?? [],
    chapterIds: rules.random?.chapterIds ?? [],
    subjectId: test.subjectId ?? '',
    chapterId: test.chapterId ?? '',
    fixed: test.testQuestions.map((tq) => ({
      id: tq.questionId,
      preview: (tq.question.translations[0]?.questionText ?? '').slice(0, 120),
      meta: `${localizedName(tq.question.subject.name)} · ${localizedName(tq.question.chapter.name)}`,
      hasTa: false,
    })),
  };

  return (
    <div>
      <AdminPageHeader title="Edit test" description={localizedName(test.title) || 'Test'} />
      <TestForm subjects={subjectOptions} initial={initial} />
    </div>
  );
}
