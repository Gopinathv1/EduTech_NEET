import React from 'react';
import Link from 'next/link';
import type { neetYearAvailability } from '@/lib/previous-year/neet-release-readiness';

export default function NeetYearNavigation({ years, verified }: {
  years: ReturnType<typeof neetYearAvailability>; verified: boolean;
}) {
  return <section className="mt-10" aria-labelledby="neet-pyq-years">
    <h2 id="neet-pyq-years" className="text-2xl font-bold text-textPrimary">NEET previous-year practice · 2013–2025</h2>
    <p className="mt-2 text-sm text-textSecondary">Choose a year. Available practices contain approved English questions and may cover only part of the original paper.</p>
    {!verified ? <p role="status" className="mt-3 text-sm text-textSecondary">Question availability could not be verified. Please try again later.</p> : null}
    <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {years.map(year => <li key={year.year} className="rounded-xl border border-border bg-surfaceElevated p-4">
        <h3 className="text-lg font-bold text-textPrimary">{year.year}</h3>
        {year.comingSoon ? <p className="mt-2 text-sm text-textSecondary">Questions coming soon</p> : <>
          <p className="mt-2 text-sm text-textSecondary">{year.visibleCount} approved questions available · Partial coverage</p>
          {year.practices.map(practice => <Link key={practice.id} href={`/student/tests/${practice.id}/start`}
            className="mt-3 block rounded-lg border border-brand/40 px-3 py-2 text-sm font-semibold text-brand hover:bg-brand-soft">
            Practice {year.year} · {practice.totalQuestions} questions
          </Link>)}
        </>}
      </li>)}
    </ul>
  </section>;
}
