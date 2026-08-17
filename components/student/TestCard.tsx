import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ClockIcon, BookIcon } from '@/components/public/icons';

export type CatalogueCard = {
  id: string;
  title: string;
  testType: string;
  totalQuestions: number;
  durationMinutes: number;
  price: number;
  difficulty: string | null;
  languages: string[];
  purchased: boolean;
};

export default function TestCard({ test }: { test: CatalogueCard }) {
  const t = useTranslations('catalogue');
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-surfaceElevated p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <span className="inline-block rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand">
          {t(`types.${test.testType}`)}
        </span>
        <div className="flex gap-1">
          {test.languages.map((l) => (
            <span key={l} className="rounded border border-border px-1.5 py-0.5 text-[10px] font-semibold uppercase text-textSecondary">
              {l}
            </span>
          ))}
        </div>
      </div>

      <h3 className="mt-3 text-base font-semibold text-textPrimary">
        <Link href={`/student/tests/${test.id}`} className="hover:text-brand">
          {test.title}
        </Link>
      </h3>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-textSecondary">
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

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        {test.purchased ? (
          <span className="text-sm font-semibold text-green-200">{t('owned')}</span>
        ) : (
          <span className="text-lg font-extrabold text-textPrimary">₹{test.price}</span>
        )}
        {test.purchased ? (
          <Link
            href={`/student/tests/${test.id}/start`}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            {t('start')}
          </Link>
        ) : (
          <Link
            href={`/student/tests/${test.id}`}
            className="rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-soft"
          >
            {t('viewDetails')}
          </Link>
        )}
      </div>
    </div>
  );
}
