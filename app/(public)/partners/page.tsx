import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { pageMetadata } from '@/lib/seo';
import PageHero from '@/components/public/PageHero';
import { Section, PrimaryLink } from '@/components/public/ui';
import { CheckIcon, PhoneIcon } from '@/components/public/icons';
import WhatsAppLink from '@/components/whatsapp/WhatsAppLink';

export async function generateMetadata() {
  const t = await getTranslations('seo.partners');
  return pageMetadata({ title: t('title'), description: t('description'), path: '/partners' });
}

type PartnerBenefit = {
  title: string;
  body: string;
};

export default function PartnersPage() {
  const t = useTranslations('partners');
  const benefits = t.raw('benefits.items') as PartnerBenefit[];

  return (
    <>
      <PageHero eyebrow={t('eyebrow')} title={t('heroTitle')} subtitle={t('heroSubtitle')} />

      <Section>
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-accent">{t('benefits.eyebrow')}</p>
            <h2 className="mt-5 text-[clamp(2.75rem,6vw,6rem)] font-black uppercase leading-[0.9] text-white">
              {t('benefits.title')}
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-textSecondary">{t('benefits.subtitle')}</p>
          </div>

          <div className="border-y border-white/10">
            {benefits.map((item) => (
              <div key={item.title} className="grid gap-4 border-b border-white/10 py-6 last:border-b-0 sm:grid-cols-[auto_1fr]">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand/40 bg-brand-soft text-accent">
                  <CheckIcon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-xl font-black uppercase leading-tight text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-textSecondary">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section tinted lazy>
        <div className="border-y border-brand/30 bg-[#020608] p-8 sm:p-12 lg:p-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-accent">{t('cta.eyebrow')}</p>
              <h2 className="mt-5 max-w-4xl text-[clamp(3rem,7vw,7.5rem)] font-black uppercase leading-[0.86] text-white">
                {t('cta.title')}
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-cyan-50/80">{t('cta.subtitle')}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <PrimaryLink href="/partner/register">{t('cta.becomePartner')}</PrimaryLink>
              <Link
                href="/partner/login"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-accent/30 bg-white/[0.02] px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:bg-white/[0.06]"
              >
                {t('cta.partnerLogin')}
              </Link>
              <WhatsAppLink
                label={t('cta.whatsapp')}
                message={t('cta.whatsappMessage')}
                className="group inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-emerald-100 transition hover:-translate-y-0.5 hover:bg-emerald-500/15"
              >
                <PhoneIcon className="h-4 w-4" />
                {t('cta.whatsapp')}
                <span className="transition group-hover:translate-x-1">-&gt;</span>
              </WhatsAppLink>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
