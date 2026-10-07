import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { localizedName } from '@/lib/admin/format';
import { AdminPageHeader } from '@/components/admin/ui';
import QuestionForm, { type QuestionInitial } from '@/components/admin/QuestionForm';
import QuestionReviewActions from '@/components/admin/QuestionReviewActions';
import Link from 'next/link';

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
    externalId: question.externalId ?? '',
    chapterId: question.chapterId,
    topic: question.topic ?? '',
    difficulty: question.difficulty,
    questionType: question.questionType,
    questionNature: question.questionNature,
    status: question.status,
    contentClass: question.contentClass,
    sourceType: question.sourceType ?? '',
    sourceName: question.sourceName ?? '',
    sourceUrl: question.sourceUrl ?? '',
    officialAnswerKeyReference: question.officialAnswerKeyReference ?? '',
    exam: question.exam ?? '',
    examYear: question.examYear != null ? String(question.examYear) : '',
    paperSession: question.paperSession ?? '',
    licenseReference: question.licenseReference ?? '',
    reviewer: question.reviewer ?? '',
    reviewedAt: question.reviewedAt?.toISOString() ?? '',
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
          optionA: ta.optionA ?? '',
          optionB: ta.optionB ?? '',
          optionC: ta.optionC ?? '',
          optionD: ta.optionD ?? '',
          explanation: ta.explanation ?? '',
          reviewed: ta.reviewed,
        }
      : null,
  };

  return (
    <div>
      <AdminPageHeader title="Edit question" description="Update content, translation and metadata." />
      <p className="mb-4"><Link className="text-brand underline" href={`/admin/question-bank/${id}/translations`}>Tamil / Hindi translations and independent review</Link></p>
      <QuestionReviewActions questionId={question.id} reviewState={question.reviewState} reviewNote={question.reviewNote ?? ''} />
      {question.questionType === 'NUMERICAL_VALUE' ? <section className="rounded-xl border border-border p-4"><h2 className="font-bold">Canonical English (numerical question)</h2><p className="whitespace-pre-wrap">{en?.questionText}</p><p className="mt-2 text-sm">Use the translation workflow above to edit translated wording. The canonical numerical answer remains unchanged.</p></section> : <QuestionForm subjects={subjectOptions} initial={initial} />}
    </div>
  );
}
