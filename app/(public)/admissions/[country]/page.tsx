import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import { PrimaryLink, Section } from '@/components/public/ui';
import WhatsAppLink from '@/components/whatsapp/WhatsAppLink';
import ExploreSivora from '@/components/public/ExploreSivora';
import TimezonePanel from '@/components/admissions/TimezonePanel';
import { getIndicativeFxRates, formatFx, type FxRate } from '@/lib/admission/fx';
import {
  ADMISSION_COUNTRY_PROFILES,
  getAdmissionCountryProfile,
  type AdmissionCountryProfile,
} from '@/lib/data/admissions/countries';

type Props = {
  params: Promise<{ country: string }>;
};

export function generateStaticParams() {
  return ADMISSION_COUNTRY_PROFILES.map((country) => ({ country: country.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { country: slug } = await params;
  const country = getAdmissionCountryProfile(slug);
  if (!country) return {};

  const t = await getTranslations('seo.admissionCountry');
  return pageMetadata({
    title: t('title', { country: country.name }),
    description: t('description', { country: country.name }),
    path: `/admissions/${country.slug}`,
  });
}

export default async function AdmissionCountryPage({ params }: Props) {
  const { country: slug } = await params;
  const country = getAdmissionCountryProfile(slug);
  if (!country) notFound();

  const fxRates = await getIndicativeFxRates([country.currencyCode]);
  return <CountryContent country={country} fxRate={fxRates[country.currencyCode]} />;
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#2B2B2B] bg-[#050505]/72 p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">{label}</p>
      <p className="mt-2 text-sm font-bold leading-6 text-white">{value}</p>
    </div>
  );
}

function CountryContent({ country, fxRate }: { country: AdmissionCountryProfile; fxRate?: FxRate }) {
  const t = useTranslations('admissions');
  const support = t.raw('countrySupport.items') as string[];
  const fx = formatFx(fxRate);

  return (
    <>
      <section className="relative -mt-[73px] overflow-hidden border-b border-[#2B2B2B] bg-[#050505] pt-[73px]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#050505_0%,#111111_52%,#050505_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/62 to-black/24" />
        <div className="relative mx-auto grid min-h-[calc(100vh-73px)] w-full max-w-[1600px] gap-8 px-[clamp(1rem,3vw,3rem)] py-16 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:py-24">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('countryHero.eyebrow')}</p>
            <div className="mt-5 flex items-center gap-4">
              <span className="text-5xl" aria-hidden="true">
                {country.flag}
              </span>
              <h1 className="text-[clamp(3rem,7vw,7.8rem)] font-black uppercase leading-[0.9] text-white">
                {country.name}
              </h1>
            </div>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#D1D1D1]">{t(`countries.${country.slug}.description`)}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PrimaryLink href="#featured-medical-universities">{t('countryHero.universitiesCta')}</PrimaryLink>
              <Link
                href={`/admissions/compare?countries=${country.slug}`}
                className="inline-flex items-center justify-center rounded-lg border border-[#2B2B2B] bg-[#111111] px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:border-brand/45"
              >
                {t('countryHero.compareCta')}
              </Link>
            </div>
          </div>
          <div className="relative min-h-[320px] overflow-hidden rounded-2xl border border-[#2B2B2B] bg-[#111111] shadow-2xl shadow-black/20 lg:min-h-[560px]">
            {country.landmark.imagePath ? (
              <Image
                src={country.landmark.imagePath}
                alt={t(`landmarks.${country.landmark.altKey}`)}
                fill
                priority
                className="object-cover"
                sizes="(min-width: 1024px) 48vw, 100vw"
              />
            ) : (
              <div className="flex h-full min-h-[320px] items-center justify-center bg-[linear-gradient(135deg,#171717,#050505)] p-8 text-center lg:min-h-[560px]">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-brand">{t('countryHero.landmarkPending')}</p>
                  <p className="mt-4 text-3xl font-black uppercase text-white">{country.landmark.subject}</p>
                  <p className="mt-4 text-sm leading-6 text-[#D1D1D1]">{country.landmark.placeholderPath}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-[0.74fr_1.26fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('glance.eyebrow')}</p>
            <h2 className="mt-5 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92] text-white">
              {t('glance.title')}
            </h2>
            <p className="mt-4 text-xs leading-5 text-[#A9A9A9]">
              {t('glance.sourceNote', { date: country.lastVerified })}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Fact label={t('glance.capital')} value={country.capital.value} />
            <Fact label={t('glance.currency')} value={`${country.currency.value} (${country.currencyCode})`} />
            <Fact label={t('glance.languages')} value={country.languages.value.join(', ')} />
            <Fact label={t('glance.timezone')} value={`${country.timezone.labelCity}: ${country.timezone.iana}`} />
            <Fact label={t('glance.travelDistance')} value={country.travel.distanceFromIndia} />
            <Fact label={t('glance.travelDuration')} value={country.travel.typicalDuration} />
            <Fact label={t('glance.climate')} value={country.climate.value} />
            <Fact label={t('glance.studentCities')} value={country.majorStudentCities.join(', ')} />
            <Fact label={t('glance.programDuration')} value={country.program.duration?.value ?? t('notVerified')} />
            <Fact label={t('glance.intake')} value={country.program.intake?.value ?? t('notVerified')} />
          </div>
        </div>
      </Section>

      <Section tinted lazy>
        <div className="grid gap-8 lg:grid-cols-[0.74fr_1.26fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('timeCurrency.eyebrow')}</p>
            <h2 className="mt-5 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92] text-white">
              {t('timeCurrency.title')}
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <TimezonePanel
              destinationName={country.name}
              destinationTimeZone={country.timezone.iana}
              labelCity={country.timezone.labelCity}
              note={country.timezone.note}
            />
            <div className="rounded-2xl border border-[#2B2B2B] bg-[#050505]/72 p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">{t('timeCurrency.fxLabel')}</p>
              <p className="mt-4 text-2xl font-black text-white">{fx.oneUnitInr}</p>
              <p className="mt-2 text-lg font-black text-white">{fx.oneLakh}</p>
              <p className="mt-5 text-xs leading-5 text-[#D1D1D1]">
                {t('timeCurrency.fxDisclaimer')} {fxRate?.providerName ?? t('notVerified')}. {t('timeCurrency.lastUpdated')}: {fxRate?.lastUpdated ?? t('notVerified')}.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section id="featured-medical-universities" lazy>
        <div className="grid gap-8 lg:grid-cols-[0.74fr_1.26fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('universities.eyebrow')}</p>
            <h2 className="mt-5 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92] text-white">
              {t('universities.title')}
            </h2>
            <p className="mt-5 text-sm leading-7 text-[#D1D1D1]">
              {t('universities.note', { count: country.universities.length, country: country.name })}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {country.universities.map((university) => (
              <div key={university} className="rounded-2xl border border-[#2B2B2B] bg-[#111111] p-5 shadow-xl shadow-black/5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">{country.name}</p>
                <h3 className="mt-3 text-lg font-black uppercase leading-tight text-white">{university}</h3>
                <dl className="mt-5 grid gap-2 text-sm text-[#D1D1D1]">
                  <div className="flex justify-between gap-4 border-t border-[#2B2B2B] pt-2">
                    <dt>{t('comparison.programDuration')}</dt>
                    <dd className="text-right text-white">{country.program.duration?.value ?? t('contactForCurrentDetails')}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-[#2B2B2B] pt-2">
                    <dt>{t('comparison.tuition')}</dt>
                    <dd className="text-right text-white">{country.budget.tuitionRange?.value ?? t('contactForCurrentDetails')}</dd>
                  </div>
                </dl>
                <div className="mt-5">
                  <PrimaryLink href="/counselling">{t('universities.askCta')}</PrimaryLink>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section tinted lazy>
        <div className="grid gap-8 lg:grid-cols-[0.74fr_1.26fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('countrySupport.eyebrow')}</p>
            <h2 className="mt-5 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92] text-white">
              {t('countrySupport.title')}
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {support.map((item, index) => (
              <div key={item} className="rounded-2xl border border-[#2B2B2B] bg-[#111111] p-4">
                <p className="text-xs font-black text-brand">0{index + 1}</p>
                <p className="mt-2 text-sm font-black uppercase tracking-[0.08em] text-white">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section lazy>
        <div className="rounded-2xl border border-[#2B2B2B] bg-[#111111] p-8 shadow-xl shadow-black/5 lg:flex lg:items-end lg:justify-between lg:gap-8">
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
