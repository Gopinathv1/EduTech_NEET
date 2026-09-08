import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import { PrimaryLink, Section } from '@/components/public/ui';
import WhatsAppLink from '@/components/whatsapp/WhatsAppLink';
import CompareTray from '@/components/admissions/CompareTray';
import { ADMISSION_COUNTRY_PROFILES } from '@/lib/data/admissions/countries';

export async function generateMetadata() {
  const t = await getTranslations('seo.admissions');
  return pageMetadata({ title: t('title'), description: t('description'), path: '/admissions' });
}

export default function AdmissionsPage() {
  const t = useTranslations('admissions');
  const journey = t.raw('simplifiedJourney.items') as string[];

  return (
    <>
      <section className="relative -mt-[73px] overflow-hidden border-b border-[#2B2B2B] bg-[#050505] pt-[73px]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#050505_0%,#111111_55%,#050505_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/76 to-transparent" />
        <div className="relative mx-auto grid min-h-[calc(92vh-73px)] w-full max-w-[1600px] gap-8 px-[clamp(1rem,3vw,3rem)] py-14 lg:grid-cols-[0.92fr_1.08fr] lg:items-end lg:py-20">
          <div className="pb-2">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('heroSimplified.eyebrow')}</p>
            <h1 className="mt-5 max-w-5xl text-[clamp(3rem,7vw,7.8rem)] font-black uppercase leading-[0.88] text-white">
              {t('heroSimplified.title')}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#D1D1D1]">{t('heroSimplified.subtitle')}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PrimaryLink href="#destinations">{t('heroSimplified.primary')}</PrimaryLink>
              <Link
                href="/admissions/compare"
                className="inline-flex items-center justify-center rounded-lg border border-[#2B2B2B] bg-[#111111]/88 px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:border-brand/45"
              >
                {t('heroSimplified.secondary')}
              </Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {ADMISSION_COUNTRY_PROFILES.slice(0, 4).map((country) => (
              <Link
                key={country.slug}
                href={`/admissions/${country.slug}`}
                className="group relative min-h-48 overflow-hidden rounded-2xl border border-[#2B2B2B] bg-[#111111] p-5"
              >
                {country.landmark.imagePath ? (
                  <Image
                    src={country.landmark.imagePath}
                    alt={t(`landmarks.${country.landmark.altKey}`)}
                    fill
                    className="object-cover opacity-35 transition group-hover:scale-105"
                    sizes="(min-width: 1024px) 24vw, 50vw"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/52 to-transparent" />
                <div className="relative flex h-full flex-col justify-end">
                  <span className="text-4xl" aria-hidden="true">{country.flag}</span>
                  <h2 className="mt-3 text-2xl font-black uppercase text-white">{country.name}</h2>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-brand">
                    {country.capital.value} · {country.currencyCode}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Section id="destinations">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('destinations.eyebrow')}</p>
            <h2 className="mt-4 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92] text-white">
              {t('destinations.title')}
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-[#D1D1D1]">{t('destinations.subtitle')}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {ADMISSION_COUNTRY_PROFILES.map((country) => (
            <div
              key={country.slug}
              className="group overflow-hidden rounded-2xl border border-[#2B2B2B] bg-[#111111] shadow-xl shadow-black/5 transition hover:-translate-y-1 hover:border-brand/35"
            >
              <div className="relative h-40 bg-[#050505]">
                {country.landmark.imagePath ? (
                  <Image
                    src={country.landmark.imagePath}
                    alt={t(`landmarks.${country.landmark.altKey}`)}
                    fill
                    className="object-cover transition group-hover:scale-105"
                    sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#171717,#050505)] p-5 text-center text-xs font-black uppercase tracking-[0.18em] text-brand">
                    {country.landmark.subject}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/72 to-transparent" />
                <span className="absolute bottom-4 left-4 text-4xl" aria-hidden="true">{country.flag}</span>
              </div>
              <div className="flex min-h-72 flex-col p-5">
                <h3 className="text-2xl font-black uppercase text-white">{country.name}</h3>
                <p className="mt-3 text-sm leading-6 text-[#D1D1D1]">{t(`countries.${country.slug}.short`)}</p>
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.1em] text-[#D1D1D1]">
                  {country.capital.value} · {country.currencyCode}
                </p>
                <div className="mt-auto grid gap-2 pt-6 sm:grid-cols-2">
                  <Link
                    href={`/admissions/${country.slug}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg bg-gradient-to-r from-brand to-brand-light px-3 py-2.5 text-xs font-black uppercase tracking-[0.08em] text-white"
                  >
                    {t('destinations.cta')}
                  </Link>
                  <Link
                    href={`/admissions/compare?countries=${country.slug}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#2B2B2B] bg-[#050505] px-3 py-2.5 text-xs font-black uppercase tracking-[0.08em] text-[#D1D1D1] transition hover:border-brand/45"
                  >
                    {t('destinations.compareCta')}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section tinted lazy>
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('compare.eyebrow')}</p>
            <h2 className="mt-4 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92] text-white">
              {t('whyCompare.title')}
            </h2>
            <p className="mt-5 text-sm leading-7 text-[#D1D1D1]">{t('whyCompare.subtitle')}</p>
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
      </Section>

      <Section lazy>
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('simplifiedJourney.eyebrow')}</p>
            <h2 className="mt-4 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92] text-white">
              {t('simplifiedJourney.title')}
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {journey.map((item, index) => (
              <div key={item} className="rounded-2xl border border-[#2B2B2B] bg-[#111111] p-4">
                <p className="text-xs font-black text-brand">{String(index + 1).padStart(2, '0')}</p>
                <p className="mt-3 text-sm font-black uppercase leading-5 tracking-[0.08em] text-white">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section tinted lazy>
        <div className="rounded-2xl border border-[#2B2B2B] bg-[#111111] p-8 shadow-xl shadow-black/5 lg:flex lg:items-end lg:justify-between lg:gap-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-brand">{t('cta.eyebrow')}</p>
            <h2 className="mt-4 text-3xl font-black uppercase text-white sm:text-5xl">{t('cta.simpleTitle')}</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#D1D1D1]">{t('cta.simpleBody')}</p>
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
    </>
  );
}
