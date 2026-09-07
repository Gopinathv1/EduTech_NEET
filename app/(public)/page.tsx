import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import { Container, PrimaryLink, SecondaryLink, Section } from '@/components/public/ui';
import { BookIcon, ChartIcon, GlobeIcon, ShieldIcon } from '@/components/public/icons';
import StudentJourneys from '@/components/public/StudentJourneys';
import BrandMarquee from '@/components/public/BrandMarquee';
import FounderStory from '@/components/public/FounderStory';

export async function generateMetadata() {
  const t = await getTranslations('seo.home');
  return pageMetadata({
    title: t('title'),
    description: t('description'),
    path: '/',
    absoluteTitle: true,
  });
}

const QUICK_LINKS = [
  { key: 'examPreparation', href: '/exam-preparation' },
  { key: 'studyAbroad', href: '/study-abroad' },
  { key: 'courses', href: '/courses' },
  { key: 'counselling', href: '/counselling' },
] as const;

const SERVICE_CARDS = [
  {
    key: 'examPreparation',
    href: '/exam-preparation',
    icon: BookIcon,
  },
  {
    key: 'studyAbroad',
    href: '/study-abroad',
    icon: GlobeIcon,
  },
  {
    key: 'courses',
    href: '/courses',
    icon: ChartIcon,
  },
  {
    key: 'counselling',
    href: '/counselling',
    icon: ShieldIcon,
  },
] as const;

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
              <PrimaryLink href="#what-we-do">{t('heroExplore')}</PrimaryLink>
              <SecondaryLink href="/counselling">{t('ctaPrimary')}</SecondaryLink>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:max-w-3xl">
              {QUICK_LINKS.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="rounded-2xl border border-[#2B2B2B] bg-[#111111]/90 p-4 text-sm font-black uppercase tracking-[0.1em] text-white shadow-lg shadow-black/5 transition hover:-translate-y-0.5 hover:border-brand/35"
                >
                  {t(`quickLinks.${item.key}`)}
                </Link>
              ))}
            </div>
          </div>

          <div className="relative min-h-[360px] lg:min-h-[620px]" aria-hidden="true" />
        </Container>
      </section>

      <BrandMarquee />

      <Section id="what-we-do">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('whatWeDo.eyebrow')}</p>
            <h2 className="mt-5 max-w-3xl text-[clamp(2.5rem,5vw,5.6rem)] font-black uppercase leading-[0.92] text-white">
              {t('quickActions.titleLine1')}
              <br />
              {t('quickActions.titleLine2')}
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-8 text-[#D1D1D1]">
            {t('whatWeDo.subtitle')}
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {SERVICE_CARDS.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                className="group flex min-h-[18rem] flex-col rounded-[1.75rem] border border-[#2B2B2B] bg-[#111111] p-6 shadow-xl shadow-black/5 transition hover:-translate-y-1 hover:border-brand/35 hover:shadow-2xl hover:shadow-black/10 sm:p-7"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                    <Icon className="h-6 w-6" />
                  </span>
                  <p className="text-4xl font-black leading-none text-[#f6a623]/35">0{index + 1}</p>
                </div>
                <h3 className="mt-8 text-xl font-black uppercase leading-tight text-white xl:text-lg 2xl:text-xl">
                  {t(`serviceCards.${item.key}.title`)}
                </h3>
                <p className="mt-4 text-sm leading-6 text-[#D1D1D1]">{t(`serviceCards.${item.key}.body`)}</p>
                <span className="mt-auto inline-flex pt-7 text-xs font-black uppercase tracking-[0.12em] text-brand transition group-hover:translate-x-1">
                  {t('serviceCards.explore')}
                </span>
              </Link>
            );
          })}
        </div>
      </Section>

      <FounderStory />

      <StudentJourneys />
    </>
  );
}
