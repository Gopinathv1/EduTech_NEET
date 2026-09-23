import { getLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { localizedName } from '@/lib/admin/format';
import { FREE_ATTEMPT_LIMIT } from '@/lib/attempts/service';
import { examPaidRetriesEnabled } from '@/lib/attempts/paid-retries';
import { catalogueAttemptAction, computeCoverage, subjectFilterCodes } from '@/lib/student/catalogue';
import StudentHeader from '@/components/student/StudentHeader';
import CatalogueFilters, { type CatalogueFilterValues } from '@/components/student/CatalogueFilters';
import TestCard from '@/components/student/TestCard';
import ExamProductVisual from '@/components/public/ExamProductVisual';
import { productionTestWhere } from '@/lib/content/eligibility';

type SP = Record<string, string | string[] | undefined>;

export default async function TestsCataloguePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const g = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '');
  const filters: CatalogueFilterValues = {
    year: g('year'),
    difficulty: g('difficulty'),
    subject: g('subject'),
    chapter: g('chapter'),
    type: g('type'),
    q: g('q'),
  };

  const locale = (await getLocale()) as 'en' | 'ta';
  const t = await getTranslations('catalogue');
  const session = await getSession();

  const [tests, subjects, chapters, attempts] = await Promise.all([
    prisma.test.findMany({
      where: productionTestWhere,
      orderBy: { createdAt: 'desc' },
      include: { testQuestions: { select: { question: { select: { subjectId: true, chapterId: true } } } } },
    }),
    prisma.subject.findMany({ orderBy: { order: 'asc' } }),
    prisma.chapter.findMany({ orderBy: [{ subjectId: 'asc' }, { order: 'asc' }] }),
    session
      ? prisma.testAttempt.findMany({
          where: { studentId: session.sub },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            testId: true,
            status: true,
            startedAt: true,
            result: { select: { score: true, totalQuestions: true } },
            test: { select: { title: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const subjectsById = new Map(subjects.map((s) => [s.id, { id: s.id, code: s.code }]));
  const chaptersById = new Map(chapters.map((c) => [c.id, { id: c.id, subjectId: c.subjectId }]));
  const subjectByCode = new Map(subjects.map((s) => [s.code, s]));
  const chapterById = new Map(chapters.map((c) => [c.id, c]));
  const allCodes = subjects.map((s) => s.code);
  const paidRetriesEnabled = examPaidRetriesEnabled();
  const attemptCountByTestId = new Map<string, number>();
  const latestAttemptByTestId = new Map<string, (typeof attempts)[number]>();
  for (const attempt of attempts) {
    attemptCountByTestId.set(attempt.testId, (attemptCountByTestId.get(attempt.testId) ?? 0) + 1);
    if (!latestAttemptByTestId.has(attempt.testId)) latestAttemptByTestId.set(attempt.testId, attempt);
  }
  const remainingByTestId = new Map(
    tests.map((test) => [test.id, paidRetriesEnabled ? Math.max(FREE_ATTEMPT_LIMIT - (attemptCountByTestId.get(test.id) ?? 0), 0) : null]),
  );

  const items = tests.map((test) => {
    const cov = computeCoverage(test, subjectsById, chaptersById, allCodes);
    const searchParts = [
      localizedName(test.title, 'en'),
      localizedName(test.title, 'ta'),
      localizedName(test.description, 'en'),
      localizedName(test.description, 'ta'),
    ];
    for (const code of cov.subjectCodes) {
      const s = subjectByCode.get(code);
      if (s) searchParts.push(localizedName(s.name, 'en'), localizedName(s.name, 'ta'));
    }
    for (const cid of cov.chapterIds) {
      const c = chapterById.get(cid);
      if (c) searchParts.push(localizedName(c.name, 'en'), localizedName(c.name, 'ta'));
    }
    // "Biology" (EN) / "உயிரியல்" (TA) is the grouping for Botany + Zoology, so a
    // test covering either matches both synonyms across languages.
    if (cov.subjectCodes.has('BOTANY') || cov.subjectCodes.has('ZOOLOGY')) {
      searchParts.push('Biology', 'உயிரியல்');
    }
    return {
      test,
      cov,
      exam: ((test.rules as { exam?: string } | null)?.exam ?? (localizedName(test.title, 'en').toLowerCase().includes('jee') ? 'JEE' : 'NEET')),
      searchText: searchParts.join(' ').toLowerCase(),
      remaining: paidRetriesEnabled ? (remainingByTestId.get(test.id) ?? FREE_ATTEMPT_LIMIT) : null,
      latestAttempt: latestAttemptByTestId.get(test.id),
    };
  });

  // Apply combined filters.
  const subjCodes = subjectFilterCodes(filters.subject);
  const filtered = items.filter(({ test, cov, searchText }) => {
    if (filters.year && String(test.year ?? '') !== filters.year) return false;
    if (filters.difficulty && test.difficulty !== filters.difficulty) return false;
    if (subjCodes.length && !subjCodes.some((c) => cov.subjectCodes.has(c))) return false;
    if (filters.chapter && !cov.chapterIds.has(filters.chapter)) return false;
    if (filters.type && test.testType !== filters.type) return false;
    if (filters.q && !searchText.includes(filters.q.toLowerCase())) return false;
    return true;
  });

  const years = [...new Set(tests.map((x) => x.year).filter((y): y is number => y != null))].sort((a, b) => b - a);
  const coveredChapterIds = new Set(items.flatMap((i) => [...i.cov.chapterIds]));
  const chapterOptions = chapters
    .filter((c) => coveredChapterIds.has(c.id))
    .map((c) => ({ id: c.id, name: localizedName(c.name, locale) }));
  const practiceGroups = [
    { exam: 'NEET', title: 'NEET practice', description: 'Choose an available NEET full, subject or chapter practice set.' },
    { exam: 'JEE', title: 'JEE practice', description: 'Demo practice appears here after the reviewed JEE content seed is separately approved and populated.' },
  ].map((group) => ({ ...group, items: filtered.filter((item) => item.exam === group.exam) }));

  return (
    <div className="min-h-screen bg-surface">
      <StudentHeader />
      <main id="main-content" className="student-main mx-auto max-w-[1504px] px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <section className="student-catalogue-hero grid gap-10 border-b border-border pb-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:pb-16">
          <div>
            <p className="student-eyebrow">EXAM PREPARATION</p>
            <h1 className="student-editorial-title">{t('title')}</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-textSecondary">{t('subtitle')}</p>
          </div>
          <ExamProductVisual />
        </section>

        <div className="mt-12">
          <CatalogueFilters years={years} chapters={chapterOptions} initial={filters} />
        </div>

        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Available practice</p>
          <h2 className="mt-2 text-2xl font-bold text-textPrimary">Choose what you want to practise next</h2>
          <p className="mt-2 text-sm text-textSecondary">{t('resultsCount', { count: filtered.length })} · Practice as many times as you want while unlimited practice is enabled.</p>
        </div>

        <div className="space-y-10">
            {practiceGroups.map((group) => (
              <section key={group.exam} aria-labelledby={`practice-${group.exam}`}>
                <h2 id={`practice-${group.exam}`} className="text-xl font-bold text-textPrimary">{group.title}</h2>
                <p className="mt-1 text-sm text-textSecondary">{group.description}</p>
                {group.items.length > 0 ? <div className="student-test-list mt-4 border-t border-border">
                  {group.items.map(({ test, exam, remaining, latestAttempt }) => {
                    const active = latestAttempt?.status === 'IN_PROGRESS';
                    const completed = latestAttempt && !active;
                    const action = catalogueAttemptAction(latestAttempt?.status);
                    return (
                      <TestCard
                        key={test.id}
                        test={{
                          id: test.id,
                          title: localizedName(test.title, locale) || localizedName(test.title, 'en'),
                          testType: test.testType,
                          exam,
                          totalQuestions: test.totalQuestions,
                          durationMinutes: test.durationMinutes,
                          difficulty: test.difficulty,
                          languages: test.availableLanguages,
                          attemptsRemaining: remaining,
                          actionHref: `/student/tests/${test.id}/${action.route}`,
                          actionLabel: action.label,
                          statusNote: active ? 'Unfinished attempt' : completed ? `${attemptCountByTestId.get(test.id) ?? 0} previous attempt${(attemptCountByTestId.get(test.id) ?? 0) === 1 ? '' : 's'}` : undefined,
                        }}
                      />
                    );
                  })}
                </div> : <div className="mt-4 rounded-xl border border-border bg-surfaceElevated p-6 text-sm text-textSecondary">No eligible {group.exam} practice test is available yet. Reviewed practice will appear here when it is published.</div>}
              </section>
            ))}
        </div>

        {attempts.length > 0 ? (
          <section className="mt-14 border-t border-border pt-8" aria-labelledby="practice-history">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Your recent attempts</p>
            <h2 id="practice-history" className="mt-2 text-2xl font-bold text-textPrimary">Recent attempts</h2>
            <p className="mt-2 text-sm text-textSecondary">Completed work stays here for review. It does not limit your next practice attempt.</p>
            <ul className="mt-5 divide-y divide-border rounded-xl border border-border bg-surfaceElevated px-4 sm:px-6">
              {attempts.slice(0, 8).map((attempt) => {
                const isActive = attempt.status === 'IN_PROGRESS';
                return (
                  <li key={attempt.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-textPrimary">{localizedName(attempt.test.title, locale) || localizedName(attempt.test.title, 'en')}</p>
                      <p className="mt-1 text-xs text-textSecondary">{isActive ? 'In progress' : 'Completed'} · {attempt.startedAt.toLocaleDateString(locale === 'ta' ? 'ta-IN' : 'en-GB')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {attempt.result ? <span className="text-sm font-bold text-textPrimary">{attempt.result.score} / {attempt.result.totalQuestions * 4}</span> : null}
                      <Link href={isActive ? `/student/tests/${attempt.testId}/attempt` : `/student/results/${attempt.id}`} className="rounded-md border border-brand px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-soft">
                        {isActive ? 'Resume Test' : 'View Result'}
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </main>
    </div>
  );
}
