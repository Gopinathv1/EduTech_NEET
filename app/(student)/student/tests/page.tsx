import { getLocale, getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { localizedName } from '@/lib/admin/format';
import { FREE_ATTEMPT_LIMIT } from '@/lib/attempts/service';
import { computeCoverage, subjectFilterCodes } from '@/lib/student/catalogue';
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
      ? prisma.testAttempt.groupBy({
          by: ['testId'],
          where: { studentId: session.sub },
          _count: { _all: true },
        })
      : Promise.resolve([] as { testId: string; _count: { _all: number } }[]),
  ]);

  const subjectsById = new Map(subjects.map((s) => [s.id, { id: s.id, code: s.code }]));
  const chaptersById = new Map(chapters.map((c) => [c.id, { id: c.id, subjectId: c.subjectId }]));
  const subjectByCode = new Map(subjects.map((s) => [s.code, s]));
  const chapterById = new Map(chapters.map((c) => [c.id, c]));
  const allCodes = subjects.map((s) => s.code);
  const remainingByTestId = new Map(
    attempts.map((a) => [a.testId, Math.max(FREE_ATTEMPT_LIMIT - a._count._all, 0)]),
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
    return { test, cov, searchText: searchParts.join(' ').toLowerCase(), remaining: remainingByTestId.get(test.id) ?? FREE_ATTEMPT_LIMIT };
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

        <p className="mb-4 text-sm text-textSecondary">{t('resultsCount', { count: filtered.length })}</p>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-surfaceElevated p-10 text-center text-textSecondary">
            {t('empty')}
          </div>
        ) : (
          <div className="student-test-list border-t border-border">
            {filtered.map(({ test, remaining }) => (
              <TestCard
                key={test.id}
                test={{
                  id: test.id,
                  title: localizedName(test.title, locale) || localizedName(test.title, 'en'),
                  testType: test.testType,
                  totalQuestions: test.totalQuestions,
                  durationMinutes: test.durationMinutes,
                  difficulty: test.difficulty,
                  languages: test.availableLanguages,
                  attemptsRemaining: remaining,
                }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
