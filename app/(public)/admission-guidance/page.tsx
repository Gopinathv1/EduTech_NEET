import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import PageHero from '@/components/public/PageHero';
import { Section, SectionHeading, Card, ArrowLink } from '@/components/public/ui';
import CtaBand from '@/components/public/CtaBand';
import { ShieldIcon } from '@/components/public/icons';
import { COUNTRY_CODES, COUNTRY_FLAG } from '@/lib/public/countries';

export async function generateMetadata() {
  const t = await getTranslations('seo.admission');
  return pageMetadata({
    title: t('title'),
    description: t('description'),
    path: '/admission-guidance',
  });
}

type TitleBody = { title: string; body: string };

export default function AdmissionGuidancePage() {
  const t = useTranslations('admission');
  const tc = useTranslations('countries');
  const intro = t.raw('intro') as string[];
  const process = t.raw('process') as TitleBody[];

  return (
    <>
      <PageHero eyebrow={t('eyebrow')} title={t('heroTitle')} subtitle={t('heroSubtitle')} />

      {/* Intro */}
      <Section>
        <div className="max-w-3xl space-y-4">
          {intro.map((para, i) => (
            <p key={i} className="text-textSecondary">
              {para}
            </p>
          ))}
        </div>
      </Section>

      {/* Process */}
      <Section tinted lazy>
        <SectionHeading center title={t('processTitle')} subtitle={t('processSubtitle')} />
        <ol className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {process.map((step, i) => (
            <Card key={step.title}>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-3 text-base font-semibold text-textPrimary">{step.title}</h3>
              <p className="mt-2 text-sm text-textSecondary">{step.body}</p>
            </Card>
          ))}
        </ol>
      </Section>

      {/* Countries teaser */}
      <Section lazy>
        <SectionHeading title={t('countriesTitle')} subtitle={t('countriesBody')} />
        <div className="mt-6 flex flex-wrap gap-3">
          {COUNTRY_CODES.map((code) => (
            <Link
              key={code}
              href={`/countries#${code}`}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surfaceElevated px-4 py-2 text-sm font-medium text-textSecondary hover:border-brand hover:text-brand"
            >
              <span aria-hidden="true">{COUNTRY_FLAG[code]}</span>
              {tc(`items.${code}.name`)}
            </Link>
          ))}
        </div>
        <div className="mt-6">
          <ArrowLink href="/countries">{t('countriesLink')}</ArrowLink>
        </div>
      </Section>

      {/* Eligibility & regulations disclosure */}
      <Section tinted lazy>
        <Card className="border-brand/20">
          <div className="flex gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <ShieldIcon className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-textPrimary">{t('disclosureTitle')}</h2>
              <p className="mt-2 text-sm leading-relaxed text-textSecondary">{t('disclosure')}</p>
            </div>
          </div>
        </Card>
      </Section>

      <CtaBand />
    </>
  );
}
