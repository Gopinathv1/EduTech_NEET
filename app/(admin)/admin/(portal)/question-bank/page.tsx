import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { localizedName } from '@/lib/admin/format';
import { AdminPageHeader, Badge, PrimaryButtonLink, SecondaryButtonLink } from '@/components/admin/ui';
import QuestionBankTabs from '@/components/admin/QuestionBankTabs';
import QuestionFilters, { type FilterValues } from '@/components/admin/QuestionFilters';
import QuestionActiveToggle from '@/components/admin/QuestionActiveToggle';
import { EditIcon } from '@/components/admin/icons';

const PAGE_SIZE = 20;

const TYPE_LABEL: Record<string, string> = {
  SINGLE_CORRECT: 'Single',
  IMAGE_BASED: 'Image',
  ASSERTION_REASON: 'A/R',
};

type SP = Record<string, string | string[] | undefined>;

export default async function QuestionBankPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const g = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '');
  const filters: FilterValues = {
    subject: g('subject'),
    chapter: g('chapter'),
    difficulty: g('difficulty'),
    type: g('type'),
    year: g('year'),
    lang: g('lang'),
    active: g('active'),
    q: g('q'),
  };
  const page = Math.max(1, parseInt(g('page') || '1', 10) || 1);

  // Build the query.
  const where: Prisma.QuestionWhereInput = {};
  if (filters.subject) where.subjectId = filters.subject;
  if (filters.chapter) where.chapterId = filters.chapter;
  if (['EASY', 'MEDIUM', 'HARD'].includes(filters.difficulty)) {
    where.difficulty = filters.difficulty as 'EASY' | 'MEDIUM' | 'HARD';
  }
  if (['SINGLE_CORRECT', 'IMAGE_BASED', 'ASSERTION_REASON'].includes(filters.type)) {
    where.questionType = filters.type as 'SINGLE_CORRECT' | 'IMAGE_BASED' | 'ASSERTION_REASON';
  }
  if (filters.year) {
    const y = parseInt(filters.year, 10);
    if (!Number.isNaN(y)) where.year = y;
  }
  if (filters.active === 'true') where.isActive = true;
  else if (filters.active === 'false') where.isActive = false;

  const and: Prisma.QuestionWhereInput[] = [];
  if (filters.lang === 'enta') and.push({ translations: { some: { language: 'ta' } } });
  else if (filters.lang === 'en') and.push({ translations: { none: { language: 'ta' } } });
  if (filters.q) {
    and.push({ translations: { some: { language: 'en', questionText: { contains: filters.q, mode: 'insensitive' } } } });
  }
  if (and.length) where.AND = and;

  const [total, questions, subjects, yearRows] = await Promise.all([
    prisma.question.count({ where }),
    prisma.question.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        subject: true,
        chapter: true,
        translations: { select: { language: true, questionText: true, reviewed: true } },
      },
    }),
    prisma.subject.findMany({ orderBy: { order: 'asc' }, include: { chapters: { orderBy: { order: 'asc' } } } }),
    prisma.question.findMany({ where: { year: { not: null } }, distinct: ['year'], select: { year: true }, orderBy: { year: 'desc' } }),
  ]);

  const subjectOptions = subjects.map((s) => ({
    id: s.id,
    name: localizedName(s.name) || s.code,
    chapters: s.chapters.map((c) => ({ id: c.id, name: localizedName(c.name) })),
  }));
  const years = yearRows.map((r) => r.year).filter((y): y is number => y != null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, val] of Object.entries(filters)) if (val) params.set(k, val);
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return qs ? `/admin/question-bank?${qs}` : '/admin/question-bank';
  };

  return (
    <div>
      <AdminPageHeader
        title="Question Bank"
        description="Browse, filter and manage the question bank."
        actions={
          <>
            <PrimaryButtonLink href="/admin/question-bank/new">New question</PrimaryButtonLink>
            <SecondaryButtonLink href="/admin/question-bank/bulk-upload">Bulk upload</SecondaryButtonLink>
          </>
        }
      />
      <QuestionBankTabs />

      <QuestionFilters subjects={subjectOptions} years={years} initial={filters} />

      <p className="mb-3 text-sm text-textSecondary">
        {total} question{total === 1 ? '' : 's'} found
        {total > PAGE_SIZE ? ` · page ${page} of ${totalPages}` : ''}
      </p>

      <div className="overflow-x-auto rounded-xl border border-border bg-surfaceElevated shadow-sm">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-textSecondary">
              <th className="px-4 py-3 font-medium">Question</th>
              <th className="px-3 py-3 font-medium">Type</th>
              <th className="px-3 py-3 font-medium">Year</th>
              <th className="px-3 py-3 font-medium">Translation</th>
              <th className="px-3 py-3 font-medium">Active</th>
              <th className="px-4 py-3 text-right font-medium">Edit</th>
            </tr>
          </thead>
          <tbody>
            {questions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-textSecondary">
                  No questions match these filters.
                </td>
              </tr>
            ) : (
              questions.map((qn) => {
                const en = qn.translations.find((t) => t.language === 'en');
                const ta = qn.translations.find((t) => t.language === 'ta');
                const preview = (en?.questionText ?? '').slice(0, 110);
                return (
                  <tr key={qn.id} className="border-b border-border align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium text-textPrimary">
                        {preview || '(no English text)'}
                        {(en?.questionText.length ?? 0) > 110 ? '…' : ''}
                      </p>
                      <p className="mt-1 text-xs text-textSecondary">
                        {localizedName(qn.subject.name)} · {localizedName(qn.chapter.name)}
                        {qn.topic ? ` · ${qn.topic}` : ''} · {qn.difficulty.toLowerCase()}
                      </p>
                      <div className="mt-1.5">
                        <Badge
                          color={
                            qn.status === 'PUBLISHED' ? 'green' : qn.status === 'REVIEW' ? 'amber' : 'slate'
                          }
                        >
                          {qn.status === 'PUBLISHED' ? 'Published' : qn.status === 'REVIEW' ? 'In review' : 'Draft'}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-textSecondary">{TYPE_LABEL[qn.questionType] ?? qn.questionType}</td>
                    <td className="px-3 py-3 text-textSecondary">{qn.year ?? '—'}</td>
                    <td className="px-3 py-3">
                      {!ta ? (
                        <Badge color="slate">EN only</Badge>
                      ) : ta.reviewed ? (
                        <Badge color="green">EN + TA</Badge>
                      ) : (
                        <Badge color="amber">EN + TA (draft)</Badge>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <QuestionActiveToggle id={qn.id} initial={qn.isActive} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/question-bank/${qn.id}/history`}
                          className="text-textSecondary hover:text-textPrimary"
                        >
                          History
                        </Link>
                        <Link
                          href={`/admin/question-bank/${qn.id}`}
                          className="inline-flex items-center gap-1 text-brand hover:text-red-200"
                        >
                          <EditIcon className="h-4 w-4" />
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between">
          <Link
            href={pageHref(page - 1)}
            aria-disabled={page <= 1}
            className={`rounded-lg border border-border px-4 py-2 text-sm font-medium ${
              page <= 1 ? 'pointer-events-none opacity-50' : 'text-textSecondary hover:bg-surfaceElevated'
            }`}
          >
            ← Previous
          </Link>
          <span className="text-sm text-textSecondary">
            Page {page} of {totalPages}
          </span>
          <Link
            href={pageHref(page + 1)}
            aria-disabled={page >= totalPages}
            className={`rounded-lg border border-border px-4 py-2 text-sm font-medium ${
              page >= totalPages ? 'pointer-events-none opacity-50' : 'text-textSecondary hover:bg-surfaceElevated'
            }`}
          >
            Next →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
