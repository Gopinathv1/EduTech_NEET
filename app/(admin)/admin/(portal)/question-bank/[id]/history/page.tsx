import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdminPage } from '@/lib/auth/admin';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type Snapshot = {
  topic?: string | null;
  difficulty?: string;
  questionType?: string;
  status?: string;
  year?: number | null;
  tags?: string[];
  translations?: { language: string; questionText: string; correctOption: string }[];
};

const ACTION_LABEL: Record<string, string> = {
  created: 'Created',
  updated: 'Updated',
  'status:PUBLISHED': 'Published',
  'status:DRAFT': 'Unpublished (Draft)',
};

/** Version history for a single question — an immutable audit of every change. */
export default async function QuestionHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;

  const question = await prisma.question.findUnique({
    where: { id },
    select: { id: true, versions: { orderBy: { version: 'desc' } } },
  });
  if (!question) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-textPrimary">Version history</h1>
          <p className="text-sm text-textSecondary">Every change to this question, most recent first.</p>
        </div>
        <Link href={`/admin/question-bank/${id}`} className="text-sm font-medium text-brand hover:text-red-200">
          ← Back to edit
        </Link>
      </div>

      {question.versions.length === 0 ? (
        <p className="rounded-xl border border-border bg-surfaceElevated p-6 text-sm text-textSecondary">
          No history yet. Versions are recorded from the next edit onward.
        </p>
      ) : (
        <ol className="space-y-3">
          {question.versions.map((v) => {
            const snap = v.snapshot as Snapshot;
            const en = snap.translations?.find((t) => t.language === 'en');
            return (
              <li key={v.id} className="rounded-xl border border-border bg-surfaceElevated p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-soft px-2 text-xs font-bold text-brand">
                      v{v.version}
                    </span>
                    <span className="text-sm font-semibold text-textPrimary">
                      {ACTION_LABEL[v.action] ?? v.action}
                    </span>
                    {snap.status ? (
                      <span className="rounded-full bg-surfaceElevated px-2 py-0.5 text-[11px] font-medium text-textSecondary">
                        {snap.status}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-xs text-slate-400">
                    {v.editedByName ?? 'Unknown'} · {v.createdAt.toLocaleString()}
                  </span>
                </div>
                {en ? (
                  <p className="mt-2 line-clamp-2 text-sm text-textSecondary">{en.questionText}</p>
                ) : null}
                <p className="mt-1 text-xs text-slate-400">
                  {[snap.difficulty, snap.questionType, snap.topic, en ? `Answer: ${en.correctOption}` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
