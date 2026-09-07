import { notFound } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import PageHero from '@/components/public/PageHero';
import { PrimaryLink, Section } from '@/components/public/ui';
import WhatsAppLink from '@/components/whatsapp/WhatsAppLink';
import ExploreSivora from '@/components/public/ExploreSivora';
import { ADMISSION_COUNTRIES, getAdmissionCountry } from '@/data/admissions';

type Props = {
  params: Promise<{ country: string }>;
};

export function generateStaticParams() {
  return ADMISSION_COUNTRIES.map((country) => ({ country: country.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { country: slug } = await params;
  const country = getAdmissionCountry(slug);
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
  const country = getAdmissionCountry(slug);
  if (!country) notFound();

  return <CountryContent country={country} />;
}

function CountryContent({ country }: { country: (typeof ADMISSION_COUNTRIES)[number] }) {
  const t = useTranslations('admissions');
  const support = t.raw('countrySupport.items') as string[];

  return (
    <>
      <PageHero
        eyebrow={t('countryHero.eyebrow')}
        title={t('countryHero.title', { country: country.name })}
        subtitle={t(`countries.${country.slug}.description`)}
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-[0.74fr_1.26fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('overview.eyebrow')}</p>
            <h2 className="mt-5 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92] text-white">
              {t('overview.title', { country: country.name })}
            </h2>
          </div>
          <p className="max-w-3xl text-base leading-8 text-[#D1D1D1]">{t(`countries.${country.slug}.overview`)}</p>
        </div>
      </Section>

      <Section tinted id="featured-medical-universities" lazy>
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
              <div key={university} className="rounded-[1.5rem] border border-[#2B2B2B] bg-[#111111] p-5 shadow-xl shadow-black/5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">{country.name}</p>
                <h3 className="mt-3 text-lg font-black uppercase leading-tight text-white">{university}</h3>
                <div className="mt-5">
                  <PrimaryLink href="/counselling">{t('universities.askCta')}</PrimaryLink>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section lazy>
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

      <Section tinted lazy>
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
