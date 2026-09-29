import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import StudentHeader from '@/components/student/StudentHeader';
import {
  sourceInventoryFor,
  totalVerifiedQuestions,
  type PreviousYearExam,
} from '@/lib/previous-year/source-inventory';
import { prisma } from '@/lib/prisma';
import { studentTestWhere } from '@/lib/content/eligibility';
import { localizedName } from '@/lib/admin/format';
import { previousYearExam, previousYearMode } from '@/lib/previous-year/modes';

const EXAMS: PreviousYearExam[] = ['NEET', 'JEE'];

type PracticeMetadata = {
  practiceSource?: string;
  filterLevel?: 'SUBJECT' | 'CHAPTER';
  subjectCode?: string;
  chapterSlug?: string | null;
};

function practiceMetadata(rules: unknown): PracticeMetadata {
  return rules && typeof rules === 'object' ? rules as PracticeMetadata : {};
}

export default async function PreviousYearPracticePage() {
  const t = await getTranslations('previousYearPractice');
  const tests = await prisma.test.findMany({
    where: studentTestWhere,
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, testType: true, totalQuestions: true, durationMinutes: true, rules: true },
  });
  const available = tests
    .map((test) => ({ ...test, mode: previousYearMode(test), exam: previousYearExam(test.rules) }))
    .filter((test) => test.mode && test.exam);
  const modeKey = { yearWise: 'YEAR_WISE', mixed: 'MIXED_FIVE_YEARS', subjectChapter: 'SUBJECT_CHAPTER' } as const;

  return (
    <div className="min-h-screen bg-surface">
      <StudentHeader />
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <Link href="/student/tests" className="text-sm font-semibold text-brand hover:text-brand-dark">
          ← {t('back')}
        </Link>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.14em] text-brand">{t('eyebrow')}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-textPrimary sm:text-4xl">{t('title')}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-textSecondary">{t('intro')}</p>
        <p className="mt-3 max-w-3xl rounded-xl border border-border bg-surfaceElevated p-4 text-sm text-textSecondary">
          {t('disclaimer')}
        </p>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {(['yearWise', 'mixed', 'subjectChapter'] as const).map((mode) => {
            const modeTests = available.filter((test) => test.mode === modeKey[mode]);
            return (
              <section key={mode} className="rounded-2xl border border-border bg-surfaceElevated p-6">
                <h2 className="text-xl font-bold text-textPrimary">{t(`${mode}.title`)}</h2>
                <p className="mt-2 text-sm leading-6 text-textSecondary">{t(`${mode}.description`)}</p>
                {modeTests.length && mode !== 'subjectChapter' ? (
                  <ul className="mt-5 space-y-2">
                    {modeTests.map((test) => (
                      <li key={test.id}>
                        <Link href={`/student/tests/${test.id}/start`} className="block rounded-lg border border-brand/40 px-3 py-2 text-sm font-semibold text-brand hover:bg-brand-soft">
                          {localizedName(test.title, 'en')} · {t('questions', { count: test.totalQuestions })} · {test.durationMinutes} min
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : modeTests.length ? (
                  <div className="mt-5 space-y-3">
                    {[...new Set(modeTests.map((test) => practiceMetadata(test.rules).practiceSource).filter(Boolean))].map((source) => {
                      const periodTests = modeTests.filter((test) => practiceMetadata(test.rules).practiceSource === source);
                      const periodLabel = source === 'MIXED_2021_2025' ? t('mixedPeriod') : source?.replace('YEAR_', '') ?? '';
                      return (
                        <details key={source} className="rounded-lg border border-border bg-surface p-3">
                          <summary className="cursor-pointer text-sm font-bold text-textPrimary">{periodLabel}</summary>
                          <div className="mt-3 space-y-3">
                            {[...new Set(periodTests.map((test) => practiceMetadata(test.rules).subjectCode).filter(Boolean))].map((subject) => {
                              const subjectTests = periodTests.filter((test) => practiceMetadata(test.rules).subjectCode === subject);
                              const subjectTest = subjectTests.find((test) => practiceMetadata(test.rules).filterLevel === 'SUBJECT');
                              const chapters = subjectTests.filter((test) => practiceMetadata(test.rules).filterLevel === 'CHAPTER');
                              return (
                                <details key={subject} className="rounded-md border border-border p-3">
                                  <summary className="cursor-pointer text-sm font-semibold text-textPrimary">{subject === 'PHYSICS' ? t('subject.PHYSICS') : subject === 'CHEMISTRY' ? t('subject.CHEMISTRY') : t('subject.BIOLOGY')}</summary>
                                  {subjectTest ? (
                                    <Link href={`/student/tests/${subjectTest.id}/start`} className="mt-3 block rounded-lg border border-brand/40 px-3 py-2 text-sm font-semibold text-brand hover:bg-brand-soft">
                                      {t('allQuestions')} · {t('questions', { count: subjectTest.totalQuestions })} · {subjectTest.durationMinutes} min
                                    </Link>
                                  ) : null}
                                  <ul className="mt-2 space-y-2">
                                    {chapters.map((test) => (
                                      <li key={test.id}>
                                        <Link href={`/student/tests/${test.id}/start`} className="block rounded-lg px-3 py-2 text-xs font-semibold text-brand hover:bg-brand-soft">
                                          {localizedName(test.title, 'en')} · {t('questions', { count: test.totalQuestions })}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                </details>
                              );
                            })}
                          </div>
                        </details>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-5 rounded-lg bg-surface px-3 py-2 text-sm font-semibold text-textSecondary">{t('notEnough')}</p>
                )}
              </section>
            );
          })}
        </div>

        <div className="mt-12 space-y-10">
          {EXAMS.map((exam) => {
            const records = sourceInventoryFor(exam);
            return (
              <section key={exam} aria-labelledby={`previous-year-${exam}`}>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">{t(`exam.${exam}`)}</p>
                    <h2 id={`previous-year-${exam}`} className="mt-2 text-2xl font-bold text-textPrimary">{t('verifiedInventory')}</h2>
                  </div>
                  <p className="text-sm text-textSecondary">{t('verifiedCount', { count: totalVerifiedQuestions(exam) })}</p>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-surfaceElevated">
                  <ul className="divide-y divide-border">
                    {records.map((record) => (
                      <li key={`${record.exam}-${record.year}`} className="grid gap-3 p-5 sm:grid-cols-[7rem_1fr_auto] sm:items-center">
                        <div>
                          <p className="text-lg font-bold text-textPrimary">{record.year}</p>
                          {record.session ? <p className="text-xs text-textSecondary">{record.session}</p> : null}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-textPrimary">{t(`availability.${record.paperAvailability}`)}</p>
                          <p className="mt-1 text-sm leading-6 text-textSecondary">
                            {t(record.paperAvailability === 'PARTIAL' ? 'historicalPartial' : record.paperAvailability === 'AVAILABLE' ? 'officialExtractionRequired' : 'officialUnavailable')}
                          </p>
                          <a className="mt-2 inline-block text-xs font-semibold text-brand underline" href={record.sourceUrl} target="_blank" rel="noreferrer">
                            {t('officialSource')}
                          </a>
                          {record.wordingArchiveUrl ? (
                            <a className="ml-4 mt-2 inline-block text-xs font-semibold text-brand underline" href={record.wordingArchiveUrl} target="_blank" rel="noreferrer">
                              {t('wordingArchive')}
                            </a>
                          ) : null}
                        </div>
                        <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-textSecondary">
                          {t('questions', { count: record.verifiedQuestionCount })}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          })}
        </div>

        <p className="mt-10 rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 text-sm text-amber-100">
          {t('classificationNote')}
        </p>
      </main>
    </div>
  );
}
