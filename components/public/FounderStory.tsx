import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import WhatsAppLink from '@/components/whatsapp/WhatsAppLink';
import { Section } from './ui';

export default function FounderStory() {
  const t = useTranslations('founderStory');

  return (
    <Section id="founders-message" tinted lazy className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/50 to-transparent" />
      <div className="grid gap-10 lg:grid-cols-[0.96fr_1.04fr] lg:items-center lg:gap-14">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('eyebrow')}</p>
          <h2 className="mt-5 text-[clamp(2.4rem,5vw,5.2rem)] font-black uppercase leading-[0.94] text-white">
            {t('title')}
          </h2>
          <div className="mt-7 space-y-5 text-base leading-8 text-[#D1D1D1] sm:text-lg">
            {(t.raw('body') as string[]).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <blockquote className="mt-7 border-l border-[#f6a623]/50 bg-[#050505]/60 px-5 py-4 text-lg font-black leading-8 text-white shadow-[inset_0_0_30px_rgba(246,166,35,0.05)]">
            &quot;{t('quote')}&quot;
          </blockquote>
          <p className="mt-5 text-sm font-black uppercase tracking-[0.16em] text-[#f6d58a]">
            {t('tagline')}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/about"
              className="inline-flex items-center justify-center rounded-lg border border-[#2B2B2B] bg-[#111111] px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:border-brand/45 hover:bg-brand-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {t('teamCta')}
            </Link>
            <Link
              href="/counselling"
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-brand to-brand-light px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-brand/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {t('counsellingCta')}
            </Link>
            <WhatsAppLink
              label={t('whatsappLabel')}
              message={t('whatsappMessage')}
              className="inline-flex items-center justify-center rounded-lg border border-[#25D366]/45 bg-[#25D366]/14 px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:bg-[#25D366]/24 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {t('whatsappCta')}
            </WhatsAppLink>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
          <div className="absolute -inset-4 rounded-[2rem] bg-[radial-gradient(circle_at_28%_18%,rgba(246,166,35,0.18),transparent_34%),radial-gradient(circle_at_82%_74%,rgba(215,25,32,0.18),transparent_38%)] blur-2xl" />
          <div className="relative overflow-hidden rounded-[1.75rem] border border-[#f6a623]/24 bg-[#050505] shadow-[0_0_0_1px_rgba(215,25,32,0.12),0_30px_90px_rgba(0,0,0,0.42)]">
            <div className="relative aspect-[4/5] min-h-[30rem] sm:aspect-[5/6] lg:min-h-[42rem]">
              <Image
                src="/branding/founder-owner.jpg"
                alt={t('imageAlt')}
                fill
                sizes="(min-width: 1280px) 560px, (min-width: 1024px) 48vw, 92vw"
                className="object-cover object-[44%_center]"
                priority={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/42 via-transparent to-black/10" />
              <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand via-[#f6a623] to-brand" />
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
