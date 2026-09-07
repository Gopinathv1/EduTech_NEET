import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import PageHero from '@/components/public/PageHero';
import { Section, PrimaryLink } from '@/components/public/ui';
import HomeLeadForm from '@/components/public/HomeLeadForm';
import WhatsAppLink from '@/components/whatsapp/WhatsAppLink';

export async function generateMetadata() {
  const t = await getTranslations('seo.counselling');
  return pageMetadata({ title: t('title'), description: t('description'), path: '/counselling' });
}

export default function CounsellingPage() {
  const t = useTranslations('counselling');
  const helpCards = t.raw('helpCards') as string[];

  return (
    <>
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('heroTitle')}
        subtitle={t('heroSubtitle')}
      />
      <Section id="callback">
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
      <Section tinted lazy>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {helpCards.map((card) => (
            <div key={card} className="rounded-[1.5rem] border border-[#2B2B2B] bg-[#111111] p-6 shadow-xl shadow-black/5">
              <h2 className="text-lg font-black uppercase text-white">{card}</h2>
            </div>
          ))}
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
    </>
  );
}
