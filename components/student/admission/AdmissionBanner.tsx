import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { GlobeIcon } from '@/components/public/icons';

/**
 * Contextual banner shown on a full-test result when the score is below the
 * configurable cutoff — nudges the student to explore studying MBBS abroad.
 * Bilingual. Rendering is gated by the caller (shouldShowAdmissionBanner).
 */
export default async function AdmissionBanner() {
  const t = await getTranslations('consultancy.banner');
  return (
    <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <GlobeIcon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-slate-900">{t('title')}</h2>
          <p className="mt-1 text-sm text-slate-600">{t('body')}</p>
        </div>
      </div>
      <Link
        href="/student/admission-guidance"
        className="shrink-0 rounded-lg bg-amber-600 px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-amber-700"
      >
        {t('cta')}
      </Link>
    </div>
  );
}
