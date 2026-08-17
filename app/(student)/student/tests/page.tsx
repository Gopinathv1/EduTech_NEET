import { getLocale, getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { localizedName } from '@/lib/admin/format';
import { computeCoverage, subjectFilterCodes } from '@/lib/student/catalogue';
import StudentHeader from '@/components/student/StudentHeader';
import CatalogueFilters, { type CatalogueFilterValues } from '@/components/student/CatalogueFilters';
import TestCard from '@/components/student/TestCard';

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

  const [tests, subjects, chapters, payments] = await Promise.all([
    prisma.test.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      include: { testQuestions: { select: { question: { select: { subjectId: true, chapterId: true } } } } },
    }),
    prisma.subject.findMany({ orderBy: { order: 'asc' } }),
    prisma.chapter.findMany({ orderBy: [{ subjectId: 'asc' }, { order: 'asc' }] }),
    session
      ? prisma.testEntitlement.findMany({ where: { studentId: session.sub }, select: { testId: true } })
      : Promise.resolve([] as { testId: string }[]),
  ]);

  const subjectsById = new Map(subjects.map((s) => [s.id, { id: s.id, code: s.code }]));
  const chaptersById = new Map(chapters.map((c) => [c.id, { id: c.id, subjectId: c.subjectId }]));
  const subjectByCode = new Map(subjects.map((s) => [s.code, s]));
  const chapterById = new Map(chapters.map((c) => [c.id, c]));
  const allCodes = subjects.map((s) => s.code);
  const purchased = new Set(payments.map((p) => p.testId));

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
    return { test, cov, searchText: searchParts.join(' ').toLowerCase(), owned: purchased.has(test.id) };
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
    <div className="min-h-screen bg-slate-50">
      <StudentHeader />
      <main id="main-content" className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
        <p className="mt-1 text-slate-600">{t('subtitle')}</p>

        <div className="mt-6">
          <CatalogueFilters years={years} chapters={chapterOptions} initial={filters} />
        </div>

        <p className="mb-4 text-sm text-slate-500">{t('resultsCount', { count: filtered.length })}</p>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            {t('empty')}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(({ test, owned }) => (
              <TestCard
                key={test.id}
                test={{
                  id: test.id,
                  title: localizedName(test.title, locale) || localizedName(test.title, 'en'),
                  testType: test.testType,
                  totalQuestions: test.totalQuestions,
                  durationMinutes: test.durationMinutes,
                  price: test.price,
                  difficulty: test.difficulty,
                  languages: test.availableLanguages,
                  purchased: owned,
                }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
