import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import { Container, PrimaryLink, SecondaryLink } from '@/components/public/ui';
import StudentJourneys from '@/components/public/StudentJourneys';
import BrandMarquee from '@/components/public/BrandMarquee';
import FounderStory from '@/components/public/FounderStory';
import ExploreSivora from '@/components/public/ExploreSivora';
import Faq, { type FaqItem } from '@/components/public/Faq';
import { Section } from '@/components/public/ui';

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
  const whyItems = t.raw('why.items') as { title: string; body: string }[];
  const howItems = t.raw('how.items') as { title: string; body: string }[];
  const faqItems = t.raw('faq.items') as FaqItem[];

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
              <SecondaryLink href="#explore-sivora">{t('heroExplore')}</SecondaryLink>
            </div>
          </div>

          <div className="relative min-h-[360px] lg:min-h-[620px]" aria-hidden="true" />
        </Container>
      </section>

      <BrandMarquee />

      <ExploreSivora />

      <Section tinted lazy>
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('why.eyebrow')}</p>
            <h2 className="mt-4 text-[clamp(2.3rem,5vw,5rem)] font-black uppercase leading-[0.92] text-white">
              {t('why.title')}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {whyItems.map((item) => (
              <div key={item.title} className="rounded-2xl border border-[#2B2B2B] bg-[#050505]/72 p-5">
                <h3 className="text-base font-black uppercase leading-tight text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#D1D1D1]">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <StudentJourneys />

      <Section lazy>
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('how.eyebrow')}</p>
            <h2 className="mt-4 text-[clamp(2.3rem,5vw,5rem)] font-black uppercase leading-[0.92] text-white">
              {t('how.title')}
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            {howItems.map((item, index) => (
              <div key={item.title} className="rounded-2xl border border-[#2B2B2B] bg-[#111111] p-4">
                <p className="text-xs font-black text-brand">{String(index + 1).padStart(2, '0')}</p>
                <h3 className="mt-3 text-sm font-black uppercase leading-5 tracking-[0.08em] text-white">{item.title}</h3>
                <p className="mt-3 text-xs leading-6 text-[#D1D1D1]">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section tinted lazy>
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('faq.eyebrow')}</p>
            <h2 className="mt-4 text-[clamp(2.3rem,5vw,5rem)] font-black uppercase leading-[0.92] text-white">
              {t('faq.title')}
            </h2>
          </div>
          <Faq items={faqItems} />
        </div>
      </Section>

      <FounderStory />
    </>
  );
}
