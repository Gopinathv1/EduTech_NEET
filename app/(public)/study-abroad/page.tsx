import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import PageHero from '@/components/public/PageHero';
import { Section, PrimaryLink } from '@/components/public/ui';
import WhatsAppLink from '@/components/whatsapp/WhatsAppLink';
import { admissionJourneySteps } from '@/data/admission-journey';
import { EUROPE_STUDY_DESTINATIONS } from '@/data/study-destinations';

export async function generateMetadata() {
  const t = await getTranslations('seo.studyAbroad');
  return pageMetadata({ title: t('title'), description: t('description'), path: '/study-abroad' });
}

export default function StudyAbroadPage() {
  const t = useTranslations('studyAbroad');
  const destinations = t.raw('destinations') as string[];
  const studyOptions = t.raw('studyOptions') as { title: string; body: string }[];
  const supportSteps = t.raw('supportSteps') as string[];

  return (
    <>
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('heroTitle')}
        subtitle={t('heroSubtitle')}
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('studyEyebrow')}</p>
            <h2 className="mt-5 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92] text-white">
              {t('studyTitle')}
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {studyOptions.map((option) => (
              <div key={option.title} className="rounded-[1.5rem] border border-[#2B2B2B] bg-[#111111] p-6 shadow-xl shadow-black/5">
                <h3 className="text-xl font-black uppercase text-white">{option.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#D1D1D1]">{option.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section tinted lazy>
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('destinationEyebrow')}</p>
            <h2 className="mt-5 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92] text-white">
              {t('destinationTitle')}
            </h2>
          </div>
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {destinations.map((destination) => (
                <span key={destination} className="rounded-full border border-[#2B2B2B] bg-[#050505] px-4 py-2 text-sm font-black uppercase text-white">
                  {destination}
                </span>
              ))}
            </div>
            <div className="rounded-[1.5rem] border border-[#2B2B2B] bg-[#111111]/88 p-5">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-brand">{t('europeLabel')}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {EUROPE_STUDY_DESTINATIONS.map((destination) => (
                  <span key={destination} className="rounded-full border border-[#2B2B2B] bg-[#050505] px-3 py-1.5 text-xs font-bold text-white">
                    {destination}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-xs leading-6 text-[#D1D1D1]">
                {t('destinationNote')}
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section lazy>
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('supportEyebrow')}</p>
            <h2 className="mt-5 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92] text-white">
              {t('supportTitle')}
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {supportSteps.map((step, index) => (
              <Link
                key={step}
                href={admissionJourneySteps[index]?.href ?? '/admission-journey'}
                className="rounded-2xl border border-[#2B2B2B] bg-[#111111] p-4 transition hover:-translate-y-1 hover:border-brand/35"
              >
                <p className="text-xs font-black text-brand">0{index + 1}</p>
                <p className="mt-2 text-sm font-black uppercase tracking-[0.08em] text-white">{step}</p>
              </Link>
            ))}
          </div>
        </div>
      </Section>

      <Section tinted lazy>
        <div className="rounded-[1.75rem] border border-[#2B2B2B] bg-[#111111]/88 p-6 shadow-2xl shadow-black/12">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('lifeEyebrow')}</p>
          <h2 className="mt-4 text-3xl font-black uppercase text-white sm:text-5xl">{t('lifeTitle')}</h2>
          <p className="mt-5 max-w-4xl text-sm leading-7 text-[#D1D1D1] sm:text-base sm:leading-8">
            {t('lifeBody')}
          </p>
        </div>
      </Section>

      <Section lazy>
        <div className="rounded-[2rem] border border-[#2B2B2B] bg-[#111111] p-8 shadow-xl shadow-black/5 lg:flex lg:items-end lg:justify-between lg:gap-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-brand">{t('ctaEyebrow')}</p>
            <h2 className="mt-4 text-3xl font-black uppercase text-white sm:text-5xl">{t('ctaTitle')}</h2>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0">
            <PrimaryLink href="/counselling">{t('primaryCta')}</PrimaryLink>
            <WhatsAppLink
              label={t('whatsappLabel')}
              message={t('whatsappMessage')}
              className="inline-flex items-center justify-center rounded-lg border border-[#25D366]/45 bg-[#25D366]/14 px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:bg-[#25D366]/24"
            >
              {t('whatsappCta')}
            </WhatsAppLink>
          </div>
        </div>
      </Section>
    </>
  );
}
