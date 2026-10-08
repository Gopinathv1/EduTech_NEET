import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { localizedName } from '@/lib/admin/format';
import { getStudentLead } from '@/lib/admission/leads';
import { COUNTRY_FLAG, type CountryCode } from '@/lib/public/countries';
import type { ExamLanguage } from '@/lib/attempts/examState';
import StudentHeader from '@/components/student/StudentHeader';
import AdmissionLeadForm from '@/components/student/admission/AdmissionLeadForm';
import LeadStatusCard from '@/components/student/admission/LeadStatusCard';
import MedicalGuidance from '@/components/admissions/MedicalGuidance';
import Link from 'next/link';
import { ShieldIcon } from '@/components/public/icons';

function flagFor(code: string): string {
  return COUNTRY_FLAG[code.toLowerCase() as CountryCode] ?? '🎓';
}

/**
 * Student consultancy hub: explains the admission service, lists approved
 * destinations from the Country table, discloses eligibility/regulations, and
 * either takes a new request or shows the status of an existing one. Bilingual.
 */
export default async function AdmissionGuidancePage() {
  const locale = (await getLocale()) as ExamLanguage;
  const t = await getTranslations('consultancy');
  const session = await getSession();
  if (!session || session.kind !== 'student') redirect('/login?next=/student/admission-guidance');

  const [countries, lead] = await Promise.all([
    prisma.country.findMany({ where: { isActive: true }, orderBy: { order: 'asc' }, select: { id: true, name: true, description: true, code: true } }),
    getStudentLead(session.sub),
  ]);

  const formCountries = countries.map((c) => ({
    id: c.id,
    name: localizedName(c.name, locale) || localizedName(c.name, 'en'),
    flag: flagFor(c.code),
  }));

  return (
    <div className="min-h-screen bg-surface">
      <StudentHeader />
      <main id="main-content" className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-textPrimary">{t('title')}</h1>
        <p className="mt-1 text-textSecondary">{t('subtitle')}</p>
        <p className="mt-4 text-sm leading-relaxed text-textSecondary">{t('intro')}</p>

        {/* Country cards */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-textPrimary">{t('countriesHeading')}</h2>
          <p className="mt-1 text-sm text-textSecondary">{t('countriesSubtitle')}</p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {countries.map((c) => (
              <div key={c.id} className="rounded-2xl border border-border bg-surfaceElevated p-5">
                <div className="flex items-center gap-3">
                  <span className="text-3xl" aria-hidden="true">
                    {flagFor(c.code)}
                  </span>
                  <h3 className="text-base font-semibold text-textPrimary">
                    {localizedName(c.name, locale) || localizedName(c.name, 'en')}
                  </h3>
                </div>
                {localizedName(c.description, locale) || localizedName(c.description, 'en') ? (
                  <p className="mt-2 text-sm text-textSecondary">
                    {localizedName(c.description, locale) || localizedName(c.description, 'en')}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        {/* Eligibility & regulations disclosure (compliance) */}
        <section className="mt-6 rounded-2xl border border-brand/20 bg-surfaceElevated p-5">
          <div className="flex gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <ShieldIcon className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-textPrimary">{t('disclosure.title')}</h2>
              <p className="mt-2 text-sm leading-relaxed text-textSecondary">{t('disclosure.body')}</p>
            </div>
          </div>
        </section>

        <MedicalGuidance />
        <p className="mt-4 text-sm text-textSecondary">This page tracks your counselling request, not a university admission or visa decision. For engineering, other undergraduate or postgraduate options, <Link href="/admissions#enquiry" className="underline">request programme-specific guidance</Link>.</p>
        {/* Form or existing-request status */}
        <section className="mt-8">
          {lead ? (
            <LeadStatusCard lead={lead} locale={locale} />
          ) : (
            <div className="rounded-2xl border border-border bg-surfaceElevated p-6">
              <AdmissionLeadForm countries={formCountries} defaults={{}} />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
