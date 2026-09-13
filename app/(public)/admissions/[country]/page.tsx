import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import { PrimaryLink, Section } from '@/components/public/ui';
import WhatsAppLink from '@/components/whatsapp/WhatsAppLink';
import DestinationTimeTravelCard from '@/components/admissions/DestinationTimeTravelCard';
import CurrencyConverter from '@/components/admissions/CurrencyConverter';
import Faq from '@/components/public/Faq';
import { RelatedServicesSection } from '@/components/public/ProductPageBlocks';
import { getIndicativeFxRates, type FxRate } from '@/lib/admission/fx';
import {
  ADMISSION_COUNTRY_PROFILES,
  getAdmissionCountryProfile,
  type AdmissionCountryProfile,
} from '@/lib/data/admissions/countries';
import { ClockIcon, GlobeIcon, MapPinIcon, RupeeIcon } from '@/components/public/icons';

type Props = {
  params: Promise<{ country: string }>;
};

type IconComponent = typeof GlobeIcon;

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

function QuickFact({ label, value, Icon }: { label: string; value: string; Icon: IconComponent }) {
  return (
    <div className="flex min-h-28 gap-3 rounded-2xl border border-[#2B2B2B] bg-[#111111] p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand/25 bg-brand-soft text-brand">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-brand">{label}</p>
        <p className="mt-2 text-sm font-black leading-5 text-white">{value}</p>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-[#2B2B2B] py-3">
      <dt className="text-[10px] font-black uppercase tracking-[0.16em] text-brand">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-[#D1D1D1]">{value}</dd>
    </div>
  );
}

function CountryContent({ country, fxRate }: { country: AdmissionCountryProfile; fxRate?: FxRate }) {
  const t = useTranslations('admissions');
  const mainCity = country.studentCityDetails.find((city) => city.universityCount > 0)?.name ?? country.majorStudentCities[0];
  const budgetValues = [country.budget.tuitionRange?.value, country.budget.livingCost?.value, country.budget.overall?.value].filter(Boolean);
  const relatedItems = t.raw('countryRelated.items') as { title: string; body: string; href: string; cta: string }[];
  const countryFaq = [
    {
      q: t('countryFaq.mainAirport.q', { country: country.name }),
      a: t('countryFaq.mainAirport.a', {
        airport: country.travel.mainAirport.name,
        code: country.travel.mainAirport.code,
        city: country.travel.mainAirport.city,
      }),
    },
    {
      q: t('countryFaq.travelTime.q'),
      a: country.travel.typicalDuration,
    },
    {
      q: t('countryFaq.currency.q', { country: country.name }),
      a: t('countryFaq.currency.a', { country: country.name, currency: country.currency.value, code: country.currencyCode }),
    },
    {
      q: t('countryFaq.studentCities.q'),
      a: country.majorStudentCities.join(', '),
    },
    {
      q: t('countryFaq.compare.q', { country: country.name }),
      a: t('countryFaq.compare.a', { country: country.name }),
    },
  ];
  const moreCountries = ADMISSION_COUNTRY_PROFILES.filter((item) => item.slug !== country.slug).slice(0, 3);

  return (
    <>
      <section className="relative -mt-[73px] overflow-hidden border-b border-[#2B2B2B] bg-[#050505] pt-[73px]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#050505_0%,#111111_56%,#050505_100%)]" />
        {country.landmark.imagePath ? (
          <Image
            src={country.landmark.imagePath}
            alt={t(`landmarks.${country.landmark.altKey}`)}
            fill
            priority
            className="object-cover opacity-45"
            sizes="100vw"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/72 to-black/24" />
        <div className="relative mx-auto flex min-h-[calc(92vh-73px)] w-full max-w-[1600px] flex-col justify-end px-[clamp(1rem,3vw,3rem)] py-12 sm:py-16 lg:py-20">
          <div className="max-w-4xl">
            <nav className="mb-6 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#D1D1D1]" aria-label={t('breadcrumbs.label')}>
              <Link href="/" className="hover:text-brand">{t('breadcrumbs.home')}</Link>
              <span aria-hidden="true">/</span>
              <Link href="/admissions" className="hover:text-brand">{t('breadcrumbs.admissions')}</Link>
              <span aria-hidden="true">/</span>
              <span className="text-[#D1D1D1]">{t('breadcrumbs.featuredDestinations')}</span>
              <span aria-hidden="true">/</span>
              <span className="text-brand">{country.name}</span>
            </nav>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('countryHero.eyebrow')}</p>
            <div className="mt-5 flex flex-wrap items-end gap-4">
              <span className="text-6xl" aria-hidden="true">{country.flag}</span>
              <h1 className="text-[clamp(3rem,8vw,8rem)] font-black uppercase leading-[0.86] text-white">{country.name}</h1>
            </div>
            <h2 className="mt-5 text-2xl font-black uppercase text-white sm:text-4xl">
              {t('countryHero.studyTitle', { country: country.name })}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[#D1D1D1]">{t(`countries.${country.slug}.description`)}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PrimaryLink href="#quick-facts">{t('countryHero.quickFactsCta')}</PrimaryLink>
              <Link
                href={`/admissions/compare?countries=${country.slug}`}
                className="inline-flex items-center justify-center rounded-lg border border-[#2B2B2B] bg-[#111111]/88 px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:border-brand/45"
              >
                {t('countryHero.compareCta')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Section id="quick-facts">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <QuickFact label={t('glance.capital')} value={country.capital.value} Icon={MapPinIcon} />
          <QuickFact label={t('glance.currency')} value={`${country.currencyCode} · ${country.currency.value}`} Icon={RupeeIcon} />
          <QuickFact label={t('glance.languages')} value={country.languages.value.join(', ')} Icon={GlobeIcon} />
          <QuickFact label={t('glance.studentCities')} value={mainCity} Icon={MapPinIcon} />
          <QuickFact label={t('glance.mainAirport')} value={`${country.travel.mainAirport.code} · ${country.travel.mainAirport.city}`} Icon={ClockIcon} />
        </div>
      </Section>

      <Section tinted lazy>
        <div className="mb-7">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('timeTravel.eyebrow')}</p>
          <h2 className="mt-4 text-[clamp(2.2rem,5vw,4.7rem)] font-black uppercase leading-[0.92] text-white">
            {t('timeTravel.title')}
          </h2>
        </div>
        <DestinationTimeTravelCard
          country={country}
          labels={{
            title: t('timeTravel.travelTitle'),
            from: t('timeTravel.from'),
            to: t('timeTravel.to'),
            airport: t('timeTravel.airport'),
            approxTravel: t('timeTravel.approxTravel'),
            route: t('timeTravel.route'),
            details: t('timeTravel.details'),
            india: t('timezone.india'),
            indiaZone: t('timezone.indiaZone'),
            destinationFallback: t('timezone.destinationFallback'),
            matchesIst: t('timezone.matchesIst'),
            aheadOfIst: t('timezone.aheadOfIst'),
            behindIst: t('timezone.behindIst'),
            loading: t('timezone.loading'),
          }}
        />
        <details className="mt-4 rounded-2xl border border-[#2B2B2B] bg-[#111111] p-5">
          <summary className="cursor-pointer text-sm font-black uppercase tracking-[0.12em] text-brand">
            {t('timeTravel.details')}
          </summary>
          <dl className="mt-5 grid gap-x-5 sm:grid-cols-2">
            <DetailRow label={t('travel.cityDistance')} value={country.travel.mainAirport.distanceToCityCenter} />
            <DetailRow label={t('travel.connectionPattern')} value={country.travel.connectionPattern} />
            <DetailRow label={t('travel.airportToCity')} value={country.travel.mainAirport.transfer} />
            <DetailRow label={t('comparison.travelDistance')} value={country.travel.distanceFromIndia} />
          </dl>
          {country.travel.alternateAirports?.length ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {country.travel.alternateAirports.map((airport) => (
                <div key={airport.code} className="rounded-xl border border-[#2B2B2B] bg-[#050505]/72 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">{airport.code} · {airport.city}</p>
                  <p className="mt-2 text-sm font-black text-white">{airport.name}</p>
                  <p className="mt-2 text-xs leading-5 text-[#D1D1D1]">{airport.role}</p>
                </div>
              ))}
            </div>
          ) : null}
        </details>
      </Section>

      <Section lazy>
        <div className="grid gap-6 lg:grid-cols-[0.7fr_0.9fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('budget.eyebrow')}</p>
            <h2 className="mt-4 text-[clamp(2.2rem,5vw,4.7rem)] font-black uppercase leading-[0.92] text-white">
              {t('budget.snapshotTitle')}
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#D1D1D1]">{t('budget.note')}</p>
          </div>
          <div className="space-y-4">
            {budgetValues.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-3">
                {country.budget.tuitionRange?.value ? <QuickFact label={t('comparison.tuition')} value={country.budget.tuitionRange.value} Icon={RupeeIcon} /> : null}
                {country.budget.livingCost?.value ? <QuickFact label={t('comparison.livingCost')} value={country.budget.livingCost.value} Icon={RupeeIcon} /> : null}
                {country.budget.overall?.value ? <QuickFact label={t('comparison.overallBudget')} value={country.budget.overall.value} Icon={RupeeIcon} /> : null}
              </div>
            ) : (
              <div className="rounded-2xl border border-[#2B2B2B] bg-[#111111] p-6">
                <p className="text-xl font-black uppercase text-white">{t('budget.currentFeesCta')}</p>
                <p className="mt-3 text-sm leading-7 text-[#D1D1D1]">{t('budget.noFigures')}</p>
              </div>
            )}
            <CurrencyConverter
              currencyCode={country.currencyCode}
              fxRate={fxRate}
              labels={{
                amountLabel: t('timeCurrency.amountLabel'),
                unavailable: t('timeCurrency.unavailable'),
                indicative: t('timeCurrency.quickTitle'),
                source: t('timeCurrency.source'),
                lastUpdated: t('timeCurrency.lastUpdated'),
              }}
            />
          </div>
        </div>
      </Section>

      <Section id="featured-medical-universities" tinted lazy>
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('universities.eyebrow')}</p>
            <h2 className="mt-4 text-[clamp(2.2rem,5vw,4.7rem)] font-black uppercase leading-[0.92] text-white">
              {t('universities.title')}
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-[#D1D1D1]">{t('universities.shortNote')}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {country.universities.map((university) => (
            <div key={university} className="flex min-h-52 flex-col rounded-2xl border border-[#2B2B2B] bg-[#111111] p-5 shadow-xl shadow-black/5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">{mainCity}</p>
              <h3 className="mt-3 text-lg font-black uppercase leading-tight text-white">{university}</h3>
              <p className="mt-4 text-sm leading-6 text-[#D1D1D1]">
                {country.program.duration?.value ? t('universities.durationLine', { duration: country.program.duration.value }) : t('contactForCurrentDetails')}
              </p>
              <div className="mt-auto pt-5">
                <PrimaryLink href="/counselling">{t('universities.askCta')}</PrimaryLink>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section lazy>
        <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('cities.eyebrow')}</p>
            <h2 className="mt-4 text-[clamp(2.2rem,5vw,4.7rem)] font-black uppercase leading-[0.92] text-white">
              {t('cities.title')}
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {country.studentCityDetails.map((city) => (
              <div key={city.name} className="rounded-2xl border border-[#2B2B2B] bg-[#111111] p-5">
                <h3 className="text-lg font-black uppercase text-white">{city.name}</h3>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.1em] text-brand">
                  {t('cities.universityCount', { count: city.universityCount })}
                </p>
                {city.nearestAirport ? <p className="mt-3 text-sm leading-6 text-[#D1D1D1]">{city.nearestAirport}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section lazy>
        <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('compare.eyebrow')}</p>
            <h2 className="mt-4 text-[clamp(2.2rem,5vw,4.7rem)] font-black uppercase leading-[0.92] text-white">
              {t('compare.thisCountryTitle', { country: country.name })}
            </h2>
          </div>
          <div className="rounded-2xl border border-[#2B2B2B] bg-[#111111] p-6">
            <p className="text-base leading-8 text-[#D1D1D1]">{t('compare.thisCountryBody')}</p>
            <div className="mt-5">
              <PrimaryLink href={`/admissions/compare?countries=${country.slug}`}>{t('whyCompare.cta')}</PrimaryLink>
            </div>
          </div>
        </div>
      </Section>

      <Section tinted lazy>
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('countryFaq.eyebrow')}</p>
            <h2 className="mt-4 text-[clamp(2.2rem,5vw,4.7rem)] font-black uppercase leading-[0.92] text-white">
              {t('countryFaq.title', { country: country.name })}
            </h2>
          </div>
          <Faq items={countryFaq} />
        </div>
      </Section>

      <Section lazy>
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('more.eyebrow')}</p>
          <h2 className="mt-4 text-[clamp(2rem,4vw,4rem)] font-black uppercase leading-[0.95] text-white">{t('more.title')}</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {moreCountries.map((item) => (
            <Link
              key={item.slug}
              href={`/admissions/${item.slug}`}
              className="rounded-full border border-[#2B2B2B] bg-[#111111] px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-[#D1D1D1] hover:border-brand/45"
            >
              {item.flag} {item.name}
            </Link>
          ))}
          <Link
            href={`/admissions/compare?countries=${country.slug}`}
            className="rounded-full border border-brand/35 bg-brand-soft px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-brand hover:border-brand"
          >
            {t('more.compare')}
          </Link>
        </div>
      </Section>

      <RelatedServicesSection
        eyebrow={t('countryRelated.eyebrow')}
        title={t('countryRelated.title')}
        items={relatedItems}
        tinted
      />

      <Section lazy>
        <details className="rounded-2xl border border-[#2B2B2B] bg-[#111111] p-6">
          <summary className="cursor-pointer text-sm font-black uppercase tracking-[0.16em] text-brand">
            {t('sources.title')}
          </summary>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div>
              <p className="text-sm font-black uppercase text-white">{t('cities.title')}</p>
              <div className="mt-3 grid gap-2">
                {country.studentCityDetails.map((city) => (
                  <p key={city.name} className="text-sm leading-6 text-[#D1D1D1]">
                    {city.name}: {t('cities.universityCount', { count: city.universityCount })}{city.timezone ? ` · ${city.timezone}` : ''}
                  </p>
                ))}
              </div>
            </div>
            <dl>
              <DetailRow label={t('glance.capital')} value={`${country.capital.source.sourceName} · ${country.capital.source.sourceUrl}`} />
              <DetailRow label={t('glance.currency')} value={`${country.currency.source.sourceName} · ${country.currency.source.sourceUrl}`} />
              <DetailRow label={t('glance.languages')} value={`${country.languages.source.sourceName} · ${country.languages.source.sourceUrl}`} />
              <DetailRow label={t('glance.mainAirport')} value={`${country.travel.mainAirport.source.sourceName} · ${country.travel.mainAirport.source.sourceUrl}`} />
              <DetailRow label={t('comparison.travelTime')} value={`${country.travel.source.sourceName} · ${country.travel.source.sourceUrl}`} />
            </dl>
          </div>
        </details>
      </Section>

      <Section lazy>
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
