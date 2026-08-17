import { requireAdminPage } from '@/lib/auth/admin';
import { prisma } from '@/lib/prisma';
import { parseRange, dateKey, parsePage, totalPages } from '@/lib/admin/reports/util';
import { questionDifficulty } from '@/lib/admin/reports/queries';
import { realDifficultyFromAccuracy, difficultyContradiction } from '@/lib/admin/reports/difficulty';
import ReportScaffold, { ReportTable } from '@/components/admin/reports/ReportScaffold';
import Pager from '@/components/admin/Pager';
import { Badge } from '@/components/admin/ui';

type SP = Record<string, string | string[] | undefined>;

export default async function QuestionDifficultyReport({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const g = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '');
  const range = parseRange(g('from'), g('to'));
  const initial = { from: dateKey(range.from), to: dateKey(range.to) };
  const { page, skip, take, perPage } = parsePage(g('page'), 20);

  const [rows, total] = await Promise.all([questionDifficulty(range, take, skip), prisma.question.count()]);
  const baseQuery = new URLSearchParams({ from: initial.from, to: initial.to }).toString();

  return (
    <ReportScaffold
      title="Question Difficulty"
      description="Observed accuracy per question. Rows are flagged when the real difficulty contradicts the labelled one (min 10 answers)."
      basePath="/admin/reports/question-difficulty"
      exportPath="/api/admin/reports/question-difficulty"
      initial={initial}
    >
      <ReportTable
        columns={[
          { label: 'Question' },
          { label: 'Subject' },
          { label: 'Label' },
          { label: 'Answered', align: 'right' },
          { label: 'Correct %', align: 'right' },
          { label: 'Real' },
        ]}
        rows={rows.map((r) => {
          const flagged = difficultyContradiction(r.difficulty, r.correctPct, r.answered);
          return [
            <span key="q" className="block max-w-md truncate">
              {r.text}
              {flagged ? <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">FLAG</span> : null}
            </span>,
            r.subjectCode,
            <Badge key="l" color="slate">
              {r.difficulty}
            </Badge>,
            r.answered,
            r.answered > 0 ? `${r.correctPct}%` : '—',
            r.answered > 0 ? (
              <span className={flagged ? 'font-bold text-red-700' : 'text-slate-600'}>{realDifficultyFromAccuracy(r.correctPct)}</span>
            ) : (
              '—'
            ),
          ];
        })}
      />
      <Pager basePath="/admin/reports/question-difficulty" baseQuery={baseQuery} page={page} totalPages={totalPages(total, perPage)} total={total} />
    </ReportScaffold>
  );
}
