import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ClockIcon, BookIcon } from '@/components/public/icons';

export type CatalogueCard = {
  id: string;
  title: string;
  testType: string;
  totalQuestions: number;
  durationMinutes: number;
  difficulty: string | null;
  languages: string[];
  attemptsRemaining: number | null;
  actionHref?: string;
  actionLabel?: string;
  statusNote?: string;
};

export default function TestCard({ test }: { test: CatalogueCard }) {
  const t = useTranslations('catalogue');
  return (
    <article className="student-test-row grid gap-5 border-b border-border bg-surfaceElevated py-6 lg:grid-cols-[0.72fr_1.35fr_1fr_auto] lg:items-center">
      <div className="flex items-start justify-between gap-2 lg:block">
        <span className="inline-block border-l-2 border-brand pl-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand">
          {t(`types.${test.testType}`)}
        </span>
        <div className="mt-3 flex gap-1 lg:mt-4">
          {test.languages.map((l) => (
            <span key={l} className="rounded border border-border px-1.5 py-0.5 text-[10px] font-semibold uppercase text-textSecondary">
              {l}
            </span>
          ))}
        </div>
      </div>

      <h3 className="text-xl font-semibold tracking-[-0.035em] text-textPrimary sm:text-2xl">
        <Link href={`/student/tests/${test.id}`} className="hover:text-brand">
          {test.title}
        </Link>
      </h3>

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-textSecondary">
        <span className="inline-flex items-center gap-1">
          <BookIcon className="h-4 w-4 text-slate-400" />
          {t('questions', { count: test.totalQuestions })}
        </span>
        <span className="inline-flex items-center gap-1">
          <ClockIcon className="h-4 w-4 text-slate-400" />
          {t('minutes', { count: test.durationMinutes })}
        </span>
        {test.difficulty ? (
          <span className="capitalize">{t(`difficulty.${test.difficulty}`)}</span>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-4 lg:justify-end">
        <span className="max-w-40 text-sm font-semibold text-green-700">
          {test.statusNote ?? (test.attemptsRemaining === null ? 'Repeat practice is free' : t('attemptsRemaining', { count: test.attemptsRemaining }))}
        </span>
        <Link
          href={test.actionHref ?? `/student/tests/${test.id}/start`}
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          {test.actionLabel ?? t('start')}
        </Link>
      </div>
    </article>
  );
}
