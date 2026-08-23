import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import PageHero from '@/components/public/PageHero';
import { Section, SectionHeading, Card } from '@/components/public/ui';
import CtaBand from '@/components/public/CtaBand';
import { CheckIcon, RupeeIcon, ShieldIcon } from '@/components/public/icons';
import { COUNTRY_CODES, COUNTRY_FLAG } from '@/lib/public/countries';
import { EUROPE_DESTINATION_COPY, EUROPE_STUDY_DESTINATIONS } from '@/data/study-destinations';

export async function generateMetadata() {
  const t = await getTranslations('seo.countries');
  return pageMetadata({ title: t('title'), description: t('description'), path: '/countries' });
}

export default function CountriesPage() {
  const t = useTranslations('countries');

  return (
    <>
      <PageHero eyebrow={t('eyebrow')} title={t('heroTitle')} subtitle={t('heroSubtitle')} />

      {/* Overview grid */}
      <Section>
        <p className="max-w-3xl text-textSecondary">{t('intro')}</p>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {COUNTRY_CODES.map((code) => (
            <Link
              key={code}
              href={`#${code}`}
              className="group rounded-2xl border border-border bg-surfaceElevated p-6 shadow-sm transition-colors hover:border-brand"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl" aria-hidden="true">
                  {COUNTRY_FLAG[code]}
                </span>
                <h2 className="text-lg font-semibold text-textPrimary group-hover:text-brand">
                  {t(`items.${code}.name`)}
                </h2>
              </div>
              <p className="mt-2 text-sm text-textSecondary">{t(`items.${code}.tagline`)}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section id="study-in-europe" tinted lazy>
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">Study in Europe</p>
            <h2 className="mt-5 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92] text-white">
              Explore European Study Destinations.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-textSecondary">{EUROPE_DESTINATION_COPY}</p>
            <p className="mt-4 text-sm leading-7 text-textSecondary">
              SIVORA UP↑RISING can support enquiries for these selected destinations where a student&apos;s profile, course choice, language needs, budget and university criteria are suitable. No official university partnerships are claimed here.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EUROPE_STUDY_DESTINATIONS.map((destination) => (
              <a
                key={destination}
                href="/#callback"
                className="rounded-2xl border border-border bg-surfaceElevated p-5 text-sm font-black uppercase tracking-[0.08em] text-textPrimary transition hover:border-brand hover:text-brand"
              >
                {destination}
              </a>
            ))}
          </div>
        </div>
      </Section>

      {/* Per-country detail */}
      <Section lazy>
        <div className="space-y-6">
          {COUNTRY_CODES.map((code) => {
            const why = t.raw(`items.${code}.why`) as string[];
            return (
              <Card key={code} className="scroll-mt-24" >
                <div id={code} className="scroll-mt-24">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl" aria-hidden="true">
                      {COUNTRY_FLAG[code]}
                    </span>
                    <div>
                      <h2 className="text-xl font-bold text-textPrimary">{t(`items.${code}.name`)}</h2>
                      <p className="text-sm text-textSecondary">{t(`items.${code}.tagline`)}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-6 lg:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-brand">
                        {t('whyLabel')}
                      </h3>
                      <ul className="mt-3 space-y-2">
                        {why.map((point) => (
                          <li key={point} className="flex items-start gap-2 text-sm text-textSecondary">
                            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 rounded-xl bg-brand-soft p-4">
                        <RupeeIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                            {t('costLabel')}
                          </p>
                          <p className="mt-1 text-sm text-textSecondary">{t(`items.${code}.cost`)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 rounded-xl border border-border p-4">
                        <ShieldIcon className="mt-0.5 h-5 w-5 shrink-0 text-textSecondary" />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-textSecondary">
                            {t('eligibilityLabel')}
                          </p>
                          <p className="mt-1 text-sm text-textSecondary">
                            {t(`items.${code}.eligibility`)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Section>

      {/* Regulations disclosure */}
      <Section lazy>
        <p className="rounded-xl bg-surface p-5 text-sm leading-relaxed text-textSecondary">
          {t('disclosure')}
        </p>
      </Section>

      <CtaBand />
    </>
  );
}
