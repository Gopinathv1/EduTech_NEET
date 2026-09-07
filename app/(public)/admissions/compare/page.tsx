import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import { PrimaryLink, Section } from '@/components/public/ui';
import CompareClocks from '@/components/admissions/CompareClocks';
import { getIndicativeFxRates, formatFx } from '@/lib/admission/fx';
import { ADMISSION_COUNTRY_PROFILES, getAdmissionCountryProfiles } from '@/lib/data/admissions/countries';

type Props = {
  searchParams: Promise<{ countries?: string }>;
};

export async function generateMetadata() {
  const t = await getTranslations('seo.admissionsCompare');
  return pageMetadata({ title: t('title'), description: t('description'), path: '/admissions/compare' });
}

function valueOrMissing(value: string | undefined, fallback: string) {
  return value && value.trim().length > 0 ? value : fallback;
}

export default async function AdmissionsComparePage({ searchParams }: Props) {
  const t = await getTranslations('admissions');
  const params = await searchParams;
  const slugs = (params.countries ?? '')
    .split(',')
    .map((slug) => slug.trim())
    .filter(Boolean)
    .slice(0, 3);
  const selected = getAdmissionCountryProfiles(slugs);
  const countries =
    selected.length >= 2
      ? selected
      : selected.length === 1
        ? [
            selected[0],
            ADMISSION_COUNTRY_PROFILES.find((country) => country.slug !== selected[0].slug) ?? ADMISSION_COUNTRY_PROFILES[1],
          ]
        : ADMISSION_COUNTRY_PROFILES.slice(0, 2);
  const fxRates = await getIndicativeFxRates(countries.map((country) => country.currencyCode));

  const rows = [
    { label: t('comparison.capital'), render: (slug: string) => countries.find((country) => country.slug === slug)?.capital.value },
    { label: t('comparison.currency'), render: (slug: string) => {
      const country = countries.find((item) => item.slug === slug);
      return country ? `${country.currency.value} (${country.currencyCode})` : undefined;
    } },
    { label: t('comparison.mainAirport'), render: (slug: string) => {
      const country = countries.find((item) => item.slug === slug);
      return country ? `${country.travel.mainAirport.name} (${country.travel.mainAirport.code})` : undefined;
    } },
    { label: t('comparison.airportCity'), render: (slug: string) => {
      const country = countries.find((item) => item.slug === slug);
      return country ? `${country.travel.mainAirport.city}, ${country.travel.mainAirport.country}` : undefined;
    } },
    { label: t('comparison.flightType'), render: (slug: string) => countries.find((country) => country.slug === slug)?.travel.flightType },
    { label: t('comparison.fx'), render: (slug: string) => {
      const country = countries.find((item) => item.slug === slug);
      return country ? formatFx(fxRates[country.currencyCode]).oneUnitInr : undefined;
    } },
    { label: t('comparison.timeDifference'), render: (slug: string) => {
      const country = countries.find((item) => item.slug === slug);
      return country ? `${country.timezone.labelCity}: ${country.timezone.iana}` : undefined;
    } },
    { label: t('comparison.travelDistance'), render: (slug: string) => countries.find((country) => country.slug === slug)?.travel.distanceFromIndia },
    { label: t('comparison.travelTime'), render: (slug: string) => countries.find((country) => country.slug === slug)?.travel.typicalDuration },
    { label: t('comparison.climate'), render: (slug: string) => countries.find((country) => country.slug === slug)?.climate.value },
    { label: t('comparison.studentCities'), render: (slug: string) => countries.find((country) => country.slug === slug)?.majorStudentCities.join(', ') },
    { label: t('comparison.programDuration'), render: (slug: string) => countries.find((country) => country.slug === slug)?.program.duration?.value },
    { label: t('comparison.tuition'), render: (slug: string) => countries.find((country) => country.slug === slug)?.budget.tuitionRange?.value },
    { label: t('comparison.livingCost'), render: (slug: string) => countries.find((country) => country.slug === slug)?.budget.livingCost?.value },
    { label: t('comparison.overallBudget'), render: (slug: string) => countries.find((country) => country.slug === slug)?.budget.overall?.value },
    { label: t('comparison.universities'), render: (slug: string) => countries.find((country) => country.slug === slug)?.universities.join(', ') },
    { label: t('comparison.programs'), render: () => t('comparison.medicalPrograms') },
    { label: t('comparison.intake'), render: (slug: string) => countries.find((country) => country.slug === slug)?.program.intake?.value },
    { label: t('comparison.medium'), render: (slug: string) => countries.find((country) => country.slug === slug)?.program.medium?.value },
  ];

  return (
    <>
      <Section>
        <div className="grid gap-8 lg:grid-cols-[0.76fr_1.24fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('compare.eyebrow')}</p>
            <h1 className="mt-5 text-[clamp(2.8rem,6vw,6rem)] font-black uppercase leading-[0.9] text-white">
              {t('compare.title')}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#D1D1D1]">{t('compare.subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            {ADMISSION_COUNTRY_PROFILES.map((country) => (
              <Link
                key={country.slug}
                href={`/admissions/compare?countries=${countries.map((item) => item.slug).filter((item) => item !== country.slug).concat(country.slug).slice(-3).join(',')}`}
                className="rounded-full border border-[#2B2B2B] bg-[#111111] px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-[#D1D1D1] hover:border-brand/45"
              >
                {country.flag} {country.name}
              </Link>
            ))}
          </div>
        </div>
      </Section>

      <Section tinted lazy>
        <CompareClocks
          countries={countries}
          labels={{
            title: t('timezone.compareTitle'),
            india: t('timezone.india'),
            indiaZone: t('timezone.indiaZone'),
            destinationFallback: t('timezone.destinationFallback'),
            matchesIst: t('timezone.matchesIst'),
            aheadOfIst: t('timezone.aheadOfIst'),
            behindIst: t('timezone.behindIst'),
            loading: t('timezone.loading'),
          }}
        />
        {selected.length === 1 ? (
          <p className="mt-4 rounded-xl border border-[#f6a623]/25 bg-[#f6a623]/10 px-4 py-3 text-sm font-bold leading-6 text-[#f6d58a]">
            {t('compare.minimumNote')}
          </p>
        ) : null}
      </Section>

      <Section tinted lazy>
        <div className="overflow-x-auto rounded-2xl border border-[#2B2B2B] bg-[#111111]">
          <table className="min-w-[760px] w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="w-56 border-b border-[#2B2B2B] p-4 text-xs font-black uppercase tracking-[0.18em] text-brand">
                  {t('comparison.field')}
                </th>
                {countries.map((country) => (
                  <th key={country.slug} className="border-b border-[#2B2B2B] p-4 text-lg font-black uppercase text-white">
                    <span className="mr-2 text-2xl">{country.flag}</span>
                    {country.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="align-top">
                  <th className="border-b border-[#2B2B2B] p-4 text-xs font-black uppercase tracking-[0.12em] text-brand">
                    {row.label}
                  </th>
                  {countries.map((country) => (
                    <td key={`${row.label}-${country.slug}`} className="border-b border-[#2B2B2B] p-4 text-sm leading-6 text-[#D1D1D1]">
                      {valueOrMissing(row.render(country.slug), t('notVerified'))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-5 text-sm leading-7 text-[#D1D1D1]">{t('comparison.disclaimer')}</p>
      </Section>

      <Section lazy>
        <div className="rounded-2xl border border-[#2B2B2B] bg-[#111111] p-8 lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-brand">{t('compare.helpEyebrow')}</p>
            <h2 className="mt-4 text-3xl font-black uppercase text-white sm:text-5xl">{t('compare.helpTitle')}</h2>
          </div>
          <div className="mt-6 lg:mt-0">
            <PrimaryLink href="/counselling">{t('cta.primary')}</PrimaryLink>
          </div>
        </div>
      </Section>
    </>
  );
}
