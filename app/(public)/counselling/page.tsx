import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import PageHero from '@/components/public/PageHero';
import { Section, PrimaryLink } from '@/components/public/ui';
import HomeLeadForm from '@/components/public/HomeLeadForm';
import WhatsAppLink from '@/components/whatsapp/WhatsAppLink';
import ExploreSivora from '@/components/public/ExploreSivora';
import { CompassIcon } from '@/components/public/icons';

export async function generateMetadata() {
  const t = await getTranslations('seo.counselling');
  return pageMetadata({ title: t('title'), description: t('description'), path: '/counselling' });
}

export default function CounsellingPage() {
  const t = useTranslations('counselling');
  const helpCards = t.raw('helpCards') as { title: string; body: string }[];
  const steps = t.raw('steps.items') as string[];

  return (
    <>
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('heroTitle')}
        subtitle={t('heroSubtitle')}
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('helpEyebrow')}</p>
            <h2 className="mt-5 text-[clamp(2.5rem,5vw,5.6rem)] font-black uppercase leading-[0.92] text-white">
              {t('helpTitle')}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {helpCards.map((card, index) => (
              <div key={card.title} className="rounded-2xl border border-[#2B2B2B] bg-[#111111] p-5 shadow-xl shadow-black/5">
                <div className="flex items-start justify-between gap-4">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#f6a623]/25 bg-[#050505]/72 text-[#f6d58a]">
                    <CompassIcon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-brand">0{index + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-black uppercase leading-tight text-white">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#D1D1D1]">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section tinted lazy>
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('steps.eyebrow')}</p>
            <h2 className="mt-5 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92] text-white">
              {t('steps.title')}
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-5">
            {steps.map((step, index) => (
              <div key={step} className="rounded-2xl border border-[#2B2B2B] bg-[#050505]/72 p-4">
                <p className="text-xs font-black text-brand">0{index + 1}</p>
                <p className="mt-3 text-sm font-black uppercase tracking-[0.08em] text-white">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section id="callback" lazy>
        <div className="grid gap-10 rounded-[2rem] border border-[#2B2B2B] bg-[#111111] p-6 shadow-2xl shadow-black/8 sm:p-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('callbackEyebrow')}</p>
            <h2 className="mt-5 text-[clamp(2.5rem,5vw,5.6rem)] font-black uppercase leading-[0.92] text-white">
              {t('callbackTitle')}
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#D1D1D1]">
              {t('callbackSubtitle')}
            </p>
          </div>
          <HomeLeadForm />
        </div>
      </Section>

      <Section lazy>
        <div className="rounded-[2rem] border border-[#2B2B2B] bg-[#111111] p-8 shadow-xl shadow-black/5 lg:flex lg:items-end lg:justify-between lg:gap-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-brand">{t('ctaEyebrow')}</p>
            <h2 className="mt-4 text-3xl font-black uppercase text-white sm:text-5xl">{t('ctaTitle')}</h2>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0">
            <PrimaryLink href="#callback">{t('primaryCta')}</PrimaryLink>
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

      <ExploreSivora exclude={['counselling']} />
    </>
  );
}
