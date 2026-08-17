import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { localizedName } from '@/lib/admin/format';
import { AdminPageHeader } from '@/components/admin/ui';
import QuestionForm, { type QuestionInitial } from '@/components/admin/QuestionForm';

export default async function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [question, subjects] = await Promise.all([
    prisma.question.findUnique({ where: { id }, include: { translations: true } }),
    prisma.subject.findMany({ orderBy: { order: 'asc' }, include: { chapters: { orderBy: { order: 'asc' } } } }),
  ]);
  if (!question) notFound();

  const subjectOptions = subjects.map((s) => ({
    id: s.id,
    name: localizedName(s.name) || s.code,
    chapters: s.chapters.map((c) => ({ id: c.id, name: localizedName(c.name) })),
  }));

  const en = question.translations.find((t) => t.language === 'en');
  const ta = question.translations.find((t) => t.language === 'ta');

  const initial: QuestionInitial = {
    id: question.id,
    subjectId: question.subjectId,
    chapterId: question.chapterId,
    topic: question.topic ?? '',
    difficulty: question.difficulty,
    questionType: question.questionType,
    status: question.status,
    year: question.year != null ? String(question.year) : '',
    tags: question.tags.join(', '),
    imageUrl: question.imageUrl ?? '',
    isActive: question.isActive,
    correctOption: (en?.correctOption ?? 'A') as 'A' | 'B' | 'C' | 'D',
    en: {
      questionText: en?.questionText ?? '',
      optionA: en?.optionA ?? '',
      optionB: en?.optionB ?? '',
      optionC: en?.optionC ?? '',
      optionD: en?.optionD ?? '',
      explanation: en?.explanation ?? '',
    },
    ta: ta
      ? {
          questionText: ta.questionText,
          optionA: ta.optionA,
          optionB: ta.optionB,
          optionC: ta.optionC,
          optionD: ta.optionD,
          explanation: ta.explanation ?? '',
          reviewed: ta.reviewed,
        }
      : null,
  };

  return (
    <div>
      <AdminPageHeader title="Edit question" description="Update content, translation and metadata." />
      <QuestionForm subjects={subjectOptions} initial={initial} />
    </div>
  );
}
