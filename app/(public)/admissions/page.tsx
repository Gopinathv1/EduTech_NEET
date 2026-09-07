import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import PageHero from '@/components/public/PageHero';
import { PrimaryLink, Section } from '@/components/public/ui';
import WhatsAppLink from '@/components/whatsapp/WhatsAppLink';
import StudentJourneys from '@/components/public/StudentJourneys';
import ExploreSivora from '@/components/public/ExploreSivora';
import CompareTray from '@/components/admissions/CompareTray';
import { ADMISSION_COUNTRY_PROFILES } from '@/lib/data/admissions/countries';

export async function generateMetadata() {
  const t = await getTranslations('seo.admissions');
  return pageMetadata({ title: t('title'), description: t('description'), path: '/admissions' });
}

export default function AdmissionsPage() {
  const t = useTranslations('admissions');
  const support = t.raw('support.items') as string[];

  return (
    <>
      <PageHero eyebrow={t('eyebrow')} title={t('heroTitle')} subtitle={t('heroSubtitle')} />

      <Section>
        <div className="grid gap-8 lg:grid-cols-[0.76fr_1.24fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('destinations.eyebrow')}</p>
            <h2 className="mt-5 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92] text-white">
              {t('destinations.title')}
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#D1D1D1]">{t('destinations.subtitle')}</p>
          </div>
          <div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {ADMISSION_COUNTRY_PROFILES.map((country) => (
              <Link
                key={country.slug}
                href={`/admissions/${country.slug}`}
                className="group flex min-h-48 flex-col rounded-[1.5rem] border border-[#2B2B2B] bg-[#111111] p-5 shadow-xl shadow-black/5 transition hover:-translate-y-1 hover:border-brand/35"
              >
                <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">{t('destinations.cardLabel')}</p>
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-3xl">{country.flag}</span>
                  <h3 className="text-2xl font-black uppercase text-white">{country.name}</h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#D1D1D1]">{t(`countries.${country.slug}.short`)}</p>
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.1em] text-[#D1D1D1]">
                  {country.capital.value} · {country.currencyCode} · {country.timezone.labelCity}
                </p>
                <span className="mt-auto inline-flex pt-6 text-xs font-black uppercase tracking-[0.12em] text-brand transition group-hover:translate-x-1">
                  {t('destinations.cta')}
                </span>
              </Link>
            ))}
            </div>
            <CompareTray
              countries={ADMISSION_COUNTRY_PROFILES}
              labels={{
                add: t('compare.add'),
                remove: t('compare.remove'),
                compare: t('compare.cta'),
                helper: t('compare.helper'),
              }}
            />
          </div>
        </div>
      </Section>

      <Section tinted lazy>
        <div className="grid gap-8 lg:grid-cols-[0.76fr_1.24fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('support.eyebrow')}</p>
            <h2 className="mt-5 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92] text-white">
              {t('support.title')}
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {support.map((item, index) => (
              <div key={item} className="rounded-2xl border border-[#2B2B2B] bg-[#050505]/76 p-4">
                <p className="text-xs font-black text-brand">0{index + 1}</p>
                <p className="mt-2 text-sm font-black uppercase tracking-[0.08em] text-white">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <StudentJourneys />

      <Section lazy>
        <div className="rounded-[2rem] border border-[#2B2B2B] bg-[#111111] p-8 shadow-xl shadow-black/5 lg:flex lg:items-end lg:justify-between lg:gap-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-brand">{t('cta.eyebrow')}</p>
            <h2 className="mt-4 text-3xl font-black uppercase text-white sm:text-5xl">{t('cta.title')}</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#D1D1D1]">{t('disclaimer')}</p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0">
            <PrimaryLink href="/counselling">{t('cta.primary')}</PrimaryLink>
            <WhatsAppLink
              label={t('cta.whatsappLabel')}
              message={t('cta.whatsappMessage')}
              className="inline-flex items-center justify-center rounded-lg border border-[#25D366]/45 bg-[#25D366]/14 px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:bg-[#25D366]/24"
            >
              {t('cta.whatsapp')}
            </WhatsAppLink>
          </div>
        </div>
      </Section>

      <ExploreSivora exclude={['admissions']} />
    </>
  );
}
