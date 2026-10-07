import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AdminPageHeader } from '@/components/admin/ui';
import QuestionTranslationEditor from '@/components/admin/QuestionTranslationEditor';

export default async function TranslationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const question = await prisma.question.findUnique({ where: { id }, include: { translations: { include: {
    versions: { orderBy: { revision: 'desc' }, take: 10 },
  } } } });
  if (!question) notFound();
  const en = question.translations.find(row => row.language === 'en');
  if (!en) notFound();
  return <div className="space-y-5">
    <AdminPageHeader title="Question translations" description="English is canonical. Translation edits and reviews do not change the canonical question or its answer." />
    <Link className="text-brand underline" href={`/admin/question-bank/${id}`}>Back to question</Link>
    <section className="rounded-xl border border-border p-4" lang="en"><h2 className="font-bold">Canonical English · {question.questionType}</h2>
      <p className="mt-2 whitespace-pre-wrap">{en.questionText}</p>
      {(['A', 'B', 'C', 'D'] as const).map(option => en[`option${option}`] ? <p key={option} className="mt-2">{option}: {en[`option${option}`]}</p> : null)}
      <p className="mt-3 whitespace-pre-wrap text-sm">{en.explanation}</p>
    </section>
    <div className="grid items-start gap-4 xl:grid-cols-2">{(['ta', 'hi'] as const).map(language => {
      const row = question.translations.find(item => item.language === language);
      return <div key={language}><QuestionTranslationEditor questionId={id} language={language} numerical={question.questionType === 'NUMERICAL_VALUE'} initial={row ? {
        questionText: row.questionText, optionA: row.optionA, optionB: row.optionB, optionC: row.optionC, optionD: row.optionD, explanation: row.explanation,
        revision: row.revision, reviewState: row.reviewState, translationSource: row.translationSource, sourceReference: row.sourceReference,
        reviewNote: row.reviewNote, reviewedByName: row.reviewedByName, reviewedAt: row.reviewedAt?.toISOString() ?? null,
      } : null} />
      {row?.versions.length ? <details className="mt-3 rounded-xl border border-border p-3"><summary>Translation history (latest 10)</summary>
        <ul className="space-y-2 pt-2">{row.versions.map(version => <li key={version.id}><details><summary className="text-sm">Revision {version.revision}: {version.action} · {version.editedByName} · {version.createdAt.toISOString()}</summary><pre className="overflow-auto whitespace-pre-wrap break-words text-xs">{JSON.stringify(version.snapshot, null, 2)}</pre></details></li>)}</ul>
      </details> : null}</div>;
    })}</div>
  </div>;
}
