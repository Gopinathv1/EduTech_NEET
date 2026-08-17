import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import PageHero from '@/components/public/PageHero';
import { Section, SectionHeading, Card } from '@/components/public/ui';
import CtaBand from '@/components/public/CtaBand';
import { CheckIcon, RupeeIcon, ShieldIcon } from '@/components/public/icons';
import { COUNTRY_CODES, COUNTRY_FLAG } from '@/lib/public/countries';

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

      {/* Per-country detail */}
      <Section tinted lazy>
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
