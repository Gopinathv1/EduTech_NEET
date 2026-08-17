import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { localizedName } from '@/lib/admin/format';
import { computeCoverage } from '@/lib/student/catalogue';
import StudentHeader from '@/components/student/StudentHeader';
import { ClockIcon, BookIcon, GlobeIcon, ChartIcon } from '@/components/public/icons';

export default async function TestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = (await getLocale()) as 'en' | 'ta';
  const t = await getTranslations('catalogue');
  const session = await getSession();

  const [test, subjects, chapters] = await Promise.all([
    prisma.test.findUnique({
      where: { id },
      include: { testQuestions: { select: { question: { select: { subjectId: true, chapterId: true } } } } },
    }),
    prisma.subject.findMany({ orderBy: { order: 'asc' } }),
    prisma.chapter.findMany(),
  ]);
  if (!test || !test.isPublished) notFound();

  const owned = test.price === 0 || (session
    ? (await prisma.testEntitlement.count({ where: { studentId: session.sub, testId: id } })) > 0
    : false);

  const subjectsById = new Map(subjects.map((s) => [s.id, { id: s.id, code: s.code }]));
  const chaptersById = new Map(chapters.map((c) => [c.id, { id: c.id, subjectId: c.subjectId }]));
  const cov = computeCoverage(test, subjectsById, chaptersById, subjects.map((s) => s.code));

  const coveredSubjects = subjects
    .filter((s) => cov.subjectCodes.has(s.code))
    .map((s) => localizedName(s.name, locale) || s.code);
  const coveredChapters = chapters
    .filter((c) => cov.chapterIds.has(c.id))
    .map((c) => localizedName(c.name, locale));

  const rows = [
    { Icon: ChartIcon, label: t('detail.typeLabel'), value: t(`types.${test.testType}`) },
    { Icon: ClockIcon, label: t('detail.duration'), value: t('minutes', { count: test.durationMinutes }) },
    { Icon: BookIcon, label: t('detail.questionsLabel'), value: String(test.totalQuestions) },
    ...(test.difficulty
      ? [{ Icon: ChartIcon, label: t('detail.difficultyLabel'), value: t(`difficulty.${test.difficulty}`) }]
      : []),
    { Icon: GlobeIcon, label: t('detail.languagesLabel'), value: test.availableLanguages.map((l) => l.toUpperCase()).join(' · ') },
    ...(test.year ? [{ Icon: ChartIcon, label: t('detail.yearLabel'), value: String(test.year) }] : []),
  ];

  return (
    <div className="min-h-screen bg-surface">
      <StudentHeader />
      <main id="main-content" className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link href="/student/tests" className="text-sm font-medium text-brand hover:text-red-200">
          ← {t('detail.back')}
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-block rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand">
            {t(`types.${test.testType}`)}
          </span>
          {owned ? (
            <span className="rounded-full bg-green-950/40 px-2.5 py-0.5 text-xs font-semibold text-green-200">
              {t('owned')}
            </span>
          ) : null}
        </div>

        <h1 className="mt-2 text-2xl font-bold text-textPrimary sm:text-3xl">
          {localizedName(test.title, locale) || localizedName(test.title, 'en')}
        </h1>
        {localizedName(test.description, locale) ? (
          <p className="mt-3 text-textSecondary">{localizedName(test.description, locale)}</p>
        ) : null}

        {/* Rules */}
        <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-border bg-surfaceElevated p-5 sm:grid-cols-3">
          {rows.map((r) => (
            <div key={r.label} className="flex items-start gap-2">
              <r.Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <div>
                <p className="text-xs font-medium text-textSecondary">{r.label}</p>
                <p className="text-sm font-semibold text-textPrimary">{r.value}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-textSecondary">
          {test.isRandom ? t('detail.randomNote') : t('detail.fixedNote')}
        </p>

        {/* Syllabus coverage */}
        <section className="mt-6">
          <h2 className="text-lg font-semibold text-textPrimary">{t('detail.coverage')}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {coveredSubjects.map((name) => (
              <span key={name} className="rounded-full border border-border bg-surfaceElevated px-3 py-1 text-sm text-textSecondary">
                {name}
              </span>
            ))}
          </div>
          {coveredChapters.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {coveredChapters.map((name) => (
                <li key={name} className="rounded-lg bg-surfaceElevated px-2.5 py-1 text-xs text-textSecondary">
                  {name}
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        {/* CTA */}
        <div className="mt-8 flex items-center justify-between rounded-2xl border border-border bg-surfaceElevated p-5">
          {owned ? (
            <>
              <span className="text-sm font-semibold text-green-200">{t('detail.ownedNote')}</span>
              <Link
                href={`/student/tests/${test.id}/start`}
                className="rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                {t('detail.startCta')}
              </Link>
            </>
          ) : (
            <>
              <span className="text-2xl font-extrabold text-textPrimary">₹{test.price}</span>
              <Link
                href={`/student/tests/${test.id}/checkout`}
                className="rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                {t('detail.buyCta', { price: test.price })}
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
