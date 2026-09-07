import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import { Container, PrimaryLink, SecondaryLink, Section } from '@/components/public/ui';
import StudentJourneys from '@/components/public/StudentJourneys';
import BrandMarquee from '@/components/public/BrandMarquee';
import FounderStory from '@/components/public/FounderStory';
import WhatsAppLink from '@/components/whatsapp/WhatsAppLink';

export async function generateMetadata() {
  const t = await getTranslations('seo.home');
  return pageMetadata({
    title: t('title'),
    description: t('description'),
    path: '/',
    absoluteTitle: true,
  });
}

export default function HomePage() {
  const t = useTranslations('home');

  return (
    <>
      <section className="relative -mt-[73px] overflow-hidden bg-[#050505] pt-[73px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(215,25,32,0.18),transparent_28%),radial-gradient(circle_at_82%_20%,rgba(215,25,32,0.14),transparent_28%),linear-gradient(135deg,#050505_0%,#111111_48%,#111111_100%)]" />
        <div className="sivora-peacock-bg absolute inset-0 bg-[url('/peacock-background.png')] bg-cover bg-[center_right] opacity-100" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/56 to-black/8" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/24 via-transparent to-black/64" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#050505]/8 to-transparent" />
        <div className="absolute -left-28 top-36 h-72 w-72 rounded-full bg-[#f6a623]/16 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-[#FF2B32]/12 blur-3xl" />

        <Container className="relative z-10 grid min-h-[calc(100vh-73px)] gap-12 py-20 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-28">
          <div className="vv-reveal max-w-4xl">
            <div className="inline-flex max-w-full items-center gap-3 rounded-full border border-[#2B2B2B] bg-[#111111]/90 px-4 py-2 shadow-lg shadow-black/5">
              <span className="h-2 w-2 rounded-full bg-brand" />
              <p className="text-xs font-black uppercase tracking-[0.26em] text-[#D1D1D1] sm:text-sm">
                {t('heroEyebrow')}
              </p>
            </div>
            <h1 className="mt-7 max-w-5xl text-[clamp(3.6rem,8vw,8.8rem)] font-black uppercase leading-[0.88] text-white">
              {t('heroTitlePrefix')}
              <br />
              <span className="bg-gradient-to-r from-brand via-brand-light to-accentBlue bg-clip-text text-transparent">
                {t('heroTitleAccent')}
              </span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#D1D1D1] sm:text-xl">
              {t('heroSubtitle')}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <PrimaryLink href="/counselling">{t('ctaPrimary')}</PrimaryLink>
              <SecondaryLink href="/courses">{t('heroExplore')}</SecondaryLink>
            </div>
          </div>

          <div className="relative min-h-[360px] lg:min-h-[620px]" aria-hidden="true" />
        </Container>
      </section>

      <BrandMarquee />

      <StudentJourneys />

      <FounderStory />

      <Section lazy>
        <div className="rounded-[2rem] border border-[#2B2B2B] bg-[#111111]/90 p-8 shadow-2xl shadow-black/12 backdrop-blur-sm lg:flex lg:items-end lg:justify-between lg:gap-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-brand">
              {t('finalCta.eyebrow')}
            </p>
            <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-white sm:text-5xl">
              {t('finalCta.title')}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[#D1D1D1]">
              {t('finalCta.subtitle')}
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:shrink-0">
            <PrimaryLink href="/counselling">{t('finalCta.primary')}</PrimaryLink>
            <WhatsAppLink
              label={t('finalCta.whatsappLabel')}
              message={t('finalCta.whatsappMessage')}
              className="inline-flex items-center justify-center rounded-lg border border-[#25D366]/45 bg-[#25D366]/14 px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:bg-[#25D366]/24 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {t('finalCta.secondary')}
            </WhatsAppLink>
          </div>
        </div>
      </Section>
    </>
  );
}
