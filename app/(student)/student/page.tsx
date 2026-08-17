import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { localizedName } from '@/lib/admin/format';
import type { ExamLanguage } from '@/lib/attempts/examState';
import { buildPerformance } from '@/lib/reports/performance';
import { getPlatformRank } from '@/lib/reports/rank';
import { getStudentLead } from '@/lib/admission/leads';
import { round1 } from '@/lib/attempts/analysis';
import StudentHeader from '@/components/student/StudentHeader';
import RecommendationList from '@/components/student/RecommendationList';
import { L } from '@/components/student/results/localize';
import { GlobeIcon } from '@/components/public/icons';

/**
 * Student home (landing after login). Batches its data into a few parallel
 * queries: owned/upcoming tests, recent scores, cross-attempt analytics, and the
 * cached platform rank. Brand-new students get an empty state pointing to the
 * catalogue. Bilingual, mobile-first.
 */
export default async function StudentHomePage() {
  const locale = (await getLocale()) as ExamLanguage;
  const t = await getTranslations('dashboard');
  const tr = await getTranslations('recommendations');
  const tc = await getTranslations('consultancy');
  const session = await getSession();
  if (!session || session.kind !== 'student') redirect('/login?next=/student');
  const studentId = session.sub;

  const [entitlements, attempts, upcoming, results, perf, rank, lead] = await Promise.all([
    prisma.testEntitlement.findMany({
      where: { studentId },
      orderBy: { grantedAt: 'desc' },
      include: { test: { select: { id: true, title: true, price: true } } },
    }),
    prisma.testAttempt.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, testId: true, status: true },
    }),
    prisma.test.findMany({
      where: { isPublished: true, entitlements: { none: { studentId } } },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: { id: true, title: true, price: true },
    }),
    prisma.result.findMany({
      where: { attempt: { studentId } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, score: true, totalQuestions: true, createdAt: true, attempt: { select: { id: true, test: { select: { title: true } } } } },
    }),
    buildPerformance(studentId),
    getPlatformRank(studentId),
    getStudentLead(studentId),
  ]);

  // Latest attempt per test → the right action (Start / Resume / View result).
  const latestByTest = new Map<string, { id: string; status: string }>();
  for (const a of attempts) if (!latestByTest.has(a.testId)) latestByTest.set(a.testId, { id: a.id, status: a.status });
  const inProgress = attempts.find((a) => a.status === 'IN_PROGRESS');
  const isNew = entitlements.length === 0 && attempts.length === 0;

  const weak = perf.weakChapters.slice(0, 3);
  const strong = perf.strongChapters.slice(0, 3);
  const topRec = perf.recommendations.slice(0, 1);

  return (
    <div className="min-h-screen bg-surface">
      <StudentHeader />
      <main id="main-content" className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-textPrimary">{t('welcome', { name: session.name })}</h1>
        <p className="mt-1 text-sm text-textSecondary">{t('subtitle')}</p>

        {/* Continue-test banner */}
        {inProgress ? (
          <Link
            href={`/student/tests/${inProgress.testId}/attempt`}
            className="mt-5 flex flex-col gap-2 rounded-2xl border border-amber-500/40 bg-amber-950/30 p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h2 className="text-base font-semibold text-amber-900">{t('continueTitle')}</h2>
              <p className="mt-0.5 text-sm text-amber-100">{t('continueBody')}</p>
            </div>
            <span className="shrink-0 rounded-lg bg-amber-600 px-5 py-2.5 text-center text-sm font-semibold text-white">
              {t('resume')}
            </span>
          </Link>
        ) : null}

        {isNew ? (
          <section className="mt-6 rounded-2xl border border-border bg-surfaceElevated p-10 text-center">
            <h2 className="text-lg font-semibold text-textPrimary">{t('emptyTitle')}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-textSecondary">{t('emptyBody')}</p>
            <Link href="/student/tests" className="mt-5 inline-block rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark">
              {t('browseCta')}
            </Link>
          </section>
        ) : (
          <>
            {/* Rank + quick actions */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <section className="rounded-2xl border border-brand/20 bg-gradient-to-br from-brand to-brand-dark p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/80">{t('platformRank')}</p>
                {rank.rank ? (
                  <>
                    <p className="mt-1 text-4xl font-extrabold">{t('rankValue', { rank: rank.rank })}</p>
                    <p className="text-sm text-white/80">{t('rankOf', { total: rank.total })}</p>
                    {rank.bestScore != null ? <p className="mt-1 text-xs text-white/70">{t('bestScore', { score: rank.bestScore })}</p> : null}
                  </>
                ) : (
                  <p className="mt-2 text-sm text-white/90">{t('noRank')}</p>
                )}
              </section>

              <Link href="/student/performance" className="flex flex-col justify-center rounded-2xl border border-border bg-surfaceElevated p-5 hover:border-brand">
                <span className="text-2xl">📈</span>
                <span className="mt-1 text-sm font-semibold text-textPrimary">{t('previousScores')}</span>
                <span className="text-xs text-textSecondary">{results.length}</span>
              </Link>
              <Link href="/student/payments" className="flex flex-col justify-center rounded-2xl border border-border bg-surfaceElevated p-5 hover:border-brand">
                <span className="text-2xl">🧾</span>
                <span className="mt-1 text-sm font-semibold text-textPrimary">{t('paymentHistory')}</span>
                <span className="text-xs font-medium text-brand">{t('viewAll')} →</span>
              </Link>
            </div>

            {/* Purchased + upcoming */}
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-border bg-surfaceElevated p-5">
                <h2 className="text-lg font-semibold text-textPrimary">{t('purchased')}</h2>
                {entitlements.length === 0 ? (
                  <p className="mt-2 text-sm text-textSecondary">{t('noPurchased')}</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {entitlements.map((e) => {
                      const latest = latestByTest.get(e.test.id);
                      const title = localizedName(e.test.title, locale) || localizedName(e.test.title, 'en');
                      let href: string;
                      let label: string;
                      if (latest?.status === 'IN_PROGRESS') {
                        href = `/student/tests/${e.test.id}/attempt`;
                        label = t('resumeShort');
                      } else if (latest && latest.status !== 'IN_PROGRESS') {
                        href = `/student/results/${latest.id}`;
                        label = t('viewResult');
                      } else {
                        href = `/student/tests/${e.test.id}/start`;
                        label = t('start');
                      }
                      return (
                        <li key={e.id} className="flex items-center justify-between gap-3">
                          <span className="min-w-0 truncate text-sm text-textPrimary">{title}</span>
                          <Link href={href} className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark">
                            {label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section className="rounded-2xl border border-border bg-surfaceElevated p-5">
                <h2 className="text-lg font-semibold text-textPrimary">{t('upcoming')}</h2>
                {upcoming.length === 0 ? (
                  <p className="mt-2 text-sm text-textSecondary">{t('noUpcoming')}</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {upcoming.map((test) => (
                      <li key={test.id} className="flex items-center justify-between gap-3">
                        <Link href={`/student/tests/${test.id}`} className="min-w-0 truncate text-sm text-textPrimary hover:text-brand">
                          {localizedName(test.title, locale) || localizedName(test.title, 'en')}
                        </Link>
                        <Link href={`/student/tests/${test.id}/checkout`} className="shrink-0 rounded-lg border border-brand px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand-soft">
                          {t('buy', { price: test.price })}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            {/* Previous scores */}
            <section className="mt-6 rounded-2xl border border-border bg-surfaceElevated p-5">
              <h2 className="text-lg font-semibold text-textPrimary">{t('previousScores')}</h2>
              {results.length === 0 ? (
                <p className="mt-2 text-sm text-textSecondary">{t('noScores')}</p>
              ) : (
                <ul className="mt-3 divide-y divide-slate-100">
                  {results.map((r) => (
                    <li key={r.id}>
                      <Link href={`/student/results/${r.attempt.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:text-brand">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-textPrimary">
                            {localizedName(r.attempt.test.title, locale) || localizedName(r.attempt.test.title, 'en')}
                          </span>
                          <span className="text-xs text-slate-400">
                            {r.createdAt.toLocaleDateString(locale === 'ta' ? 'ta-IN' : 'en-GB', { day: '2-digit', month: 'short' })}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="text-lg font-bold text-brand">{r.score}</span>
                          <span className="block text-[11px] text-slate-400">/ {r.totalQuestions * 4}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Top recommendation */}
            {topRec.length > 0 ? (
              <section className="mt-6 rounded-2xl border border-border bg-surfaceElevated p-5">
                <h2 className="text-lg font-semibold text-textPrimary">{tr('heading')}</h2>
                <RecommendationList recs={topRec} locale={locale} />
              </section>
            ) : null}

            {/* Weak + strong chapters */}
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ChapterCard heading={t('weakChapters')} rows={weak} empty={t('noWeak')} cta={t('practise')} tone="weak" locale={locale} />
              <ChapterCard heading={t('strongChapters')} rows={strong} empty={t('noStrong')} cta={t('practise')} tone="strong" locale={locale} />
            </div>
          </>
        )}

        {/* Study abroad entry (kept from consultancy module) */}
        <section className="mt-6 flex flex-col gap-3 rounded-2xl border border-brand/20 bg-gradient-to-br from-brand-soft to-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
              <GlobeIcon className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-textPrimary">{tc('dashboardCard.title')}</h2>
              <p className="mt-1 text-sm text-textSecondary">{tc('dashboardCard.body')}</p>
            </div>
          </div>
          <Link href="/student/admission-guidance" className="shrink-0 rounded-lg bg-brand px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-dark">
            {lead ? tc('dashboardCard.trackCta') : tc('dashboardCard.cta')}
          </Link>
        </section>
      </main>
    </div>
  );
}

type ChapterRow = { chapterId: string; name: { en: string; ta?: string }; subjectCode: string; accuracy: number };

function ChapterCard({
  heading,
  rows,
  empty,
  cta,
  tone,
  locale,
}: {
  heading: string;
  rows: ChapterRow[];
  empty: string;
  cta: string;
  tone: 'weak' | 'strong';
  locale: ExamLanguage;
}) {
  const accent = tone === 'weak' ? 'text-red-600' : 'text-green-600';
  return (
    <section className="rounded-2xl border border-border bg-surfaceElevated p-5">
      <h2 className="text-lg font-semibold text-textPrimary">{heading}</h2>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-textSecondary">{empty}</p>
      ) : (
        <>
          <ul className="mt-3 space-y-2">
            {rows.map((c) => (
              <li key={c.chapterId} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-textSecondary">
                  {L(c.name, locale)}
                  <span className="ml-1.5 text-[11px] uppercase tracking-wide text-slate-400">{c.subjectCode}</span>
                </span>
                <span className={`shrink-0 font-bold tabular-nums ${accent}`}>{round1(c.accuracy)}%</span>
              </li>
            ))}
          </ul>
          <Link href="/student/tests" className="mt-3 inline-block text-sm font-medium text-brand hover:text-red-200">
            {cta} →
          </Link>
        </>
      )}
    </section>
  );
}
