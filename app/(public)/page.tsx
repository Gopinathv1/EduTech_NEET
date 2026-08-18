import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import { Section, PrimaryLink, SecondaryLink, ArrowLink, Container } from '@/components/public/ui';
import { BookIcon, ChartIcon, CheckIcon, ClockIcon, GlobeIcon, RupeeIcon, ShieldIcon } from '@/components/public/icons';
import PeacockQuillArtwork from '@/components/brand/PeacockQuillArtwork';
import HomeLeadForm from '@/components/public/HomeLeadForm';

export async function generateMetadata() {
  const t = await getTranslations('seo.home');
  return pageMetadata({
    title: t('title'),
    description: t('description'),
    path: '/',
    absoluteTitle: true,
  });
}

type Action = { title: string; body: string; cta: string; href: string };
type Subject = { title: string; body: string; href: string };
type AdmissionCard = { title: string; body: string; href: string };

const MARQUEE = ['PREPARE', 'ASSESS', 'COUNSELLING', 'APPLY', 'PROGRESS', 'NEET', 'GLOBAL ADMISSIONS'];
const JOURNEY = ['Prepare', 'Assess', 'Counselling', 'Apply', 'Progress'];
const FUTURE_EXAMS = ['JEE Main', 'JEE Advanced'];

const PREP_FEATURES = [
  { title: '₹30 per mock test', icon: RupeeIcon },
  { title: 'English + Tamil', icon: BookIcon },
  { title: 'Full-length mock tests', icon: ClockIcon },
  { title: 'Previous-year practice', icon: CheckIcon },
  { title: 'Question bank', icon: ShieldIcon },
  { title: 'Chapter-wise practice', icon: BookIcon },
  { title: 'Performance analytics', icon: ChartIcon },
];

const PREP_ACTIONS = [
  { title: 'Question Bank', href: '/mock-tests' },
  { title: 'Previous Year Papers', href: '/#previous-year-papers' },
  { title: 'Mock Tests', href: '/mock-tests' },
  { title: 'Chapter-wise Practice', href: '/mock-tests' },
];

const DESTINATION_META: Record<string, { label: string; program: string }> = {
  'MBBS Abroad': { label: 'MBBS', program: 'Medical education' },
  'Study in Europe': { label: 'EU', program: 'Higher education' },
  'International Destinations': { label: 'INTL', program: 'Global programs' },
};

export default function HomePage() {
  const t = useTranslations('home');
  const introItems = t.raw('intro.items') as string[];
  const quickActions = t.raw('quickActions.items') as Action[];
  const admissionCards = t.raw('admissions.cards') as AdmissionCard[];
  const destinationCards = t.raw('destinations.items') as Action[];
  const whyItems = t.raw('why.items') as { title: string; body: string }[];
  const subjects = t.raw('neet.subjects') as Subject[];

  return (
    <>
      <section className="relative -mt-[73px] overflow-hidden bg-[#050505] pt-[73px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(215,25,32,0.18),transparent_28%),radial-gradient(circle_at_82%_20%,rgba(215,25,32,0.14),transparent_28%),linear-gradient(135deg,#050505_0%,#111111_48%,#111111_100%)]" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#050505]/8 to-transparent" />
        <div className="absolute -left-28 top-36 h-72 w-72 rounded-full bg-[#f6a623]/16 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-[#FF2B32]/12 blur-3xl" />
        <PeacockQuillArtwork className="vv-peacock-rise right-[-300px] top-[24%] z-0 h-[390px] w-[560px] opacity-55 sm:right-[-210px] sm:top-[18%] sm:h-[520px] sm:w-[760px] lg:right-[-36px] lg:top-[10%] lg:h-[690px] lg:w-[940px] lg:opacity-80" />

        <Container className="relative z-10 grid min-h-[calc(100vh-73px)] gap-12 py-20 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-28">
          <div className="vv-reveal max-w-4xl">
            <div className="inline-flex max-w-full items-center gap-3 rounded-full border border-[#2B2B2B] bg-[#111111]/90 px-4 py-2 shadow-lg shadow-black/5">
              <span className="h-2 w-2 rounded-full bg-brand" />
              <p className="text-xs font-black uppercase tracking-[0.26em] text-[#D1D1D1] sm:text-sm">Education • Preparation • Global Opportunity</p>
            </div>
            <h1 className="mt-7 max-w-5xl text-[clamp(3.6rem,8vw,8.8rem)] font-black uppercase leading-[0.88] text-white">
              {t('heroTitlePrefix')}
              <br />
              <span className="bg-gradient-to-r from-brand via-brand-light to-accentBlue bg-clip-text text-transparent">{t('heroTitleAccent')}</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#D1D1D1] sm:text-xl">
              {t('subtitle')}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <PrimaryLink href="#neet-preparation">{t('heroCtaPrimary')}</PrimaryLink>
              <SecondaryLink href="#admissions">{t('heroCtaSecondary')}</SecondaryLink>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:max-w-3xl">
              {introItems.slice(0, 4).map((item) => (
                <div key={item} className="rounded-2xl border border-[#2B2B2B] bg-[#111111]/90 p-4 shadow-lg shadow-black/5">
                  <p className="text-sm font-bold leading-6 text-[#D1D1D1]">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[420px] lg:min-h-[620px]" aria-hidden="true">
            <div className="absolute bottom-8 left-0 right-0 mx-auto max-w-md rounded-[2rem] border border-[#2B2B2B] bg-[#111111]/92 p-5 shadow-2xl shadow-black/12 backdrop-blur">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-brand">Student Journey</p>
              <div className="mt-4 space-y-3">
                {JOURNEY.map((step, index) => (
                  <div key={step} className="flex items-center gap-3 rounded-2xl bg-[#050505] p-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#050505] text-xs font-black text-white">
                      {index + 1}
                    </span>
                    <span className="font-black uppercase tracking-[0.08em] text-[#D1D1D1]">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="relative h-20 max-w-full overflow-hidden border-y border-[#2B2B2B] bg-[#050505] [contain:layout_paint] sm:h-24">
        <div className="absolute left-0 top-1/2 flex w-max max-w-none -translate-y-1/2 items-center gap-0 whitespace-nowrap will-change-transform vv-marquee-track">
          {[...MARQUEE, ...MARQUEE].map((item, index) => (
            <span key={`${item}-${index}`} className="flex items-center">
              <span className={`px-4 text-2xl font-black uppercase tracking-[0.12em] sm:px-8 sm:text-4xl lg:text-5xl ${index % 3 === 0 ? 'text-brand-light' : index % 3 === 1 ? 'text-white' : 'text-accent'}`}>
                {item}
              </span>
              <span className="text-brand/80">|</span>
            </span>
          ))}
        </div>
      </section>

      <Section id="what-we-do">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">What We Do</p>
            <h2 className="mt-5 max-w-3xl text-[clamp(2.5rem,5vw,5.6rem)] font-black uppercase leading-[0.92] text-white">
              {t('quickActions.titleLine1')}
              <br />
              {t('quickActions.titleLine2')}
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-8 text-[#D1D1D1]">{t('quickActions.subtitle')}</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((item, index) => (
            <div key={item.title} className="group rounded-[1.75rem] border border-[#2B2B2B] bg-[#111111] p-6 shadow-xl shadow-black/5 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/10 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                  {index === 0 ? <GlobeIcon className="h-6 w-6" /> : index === 1 ? <BookIcon className="h-6 w-6" /> : index === 2 ? <ShieldIcon className="h-6 w-6" /> : <ChartIcon className="h-6 w-6" />}
                </span>
                <p className="text-4xl font-black leading-none text-[#f6a623]/35">0{index + 1}</p>
              </div>
              <h3 className="mt-8 text-xl font-black uppercase leading-tight text-white xl:text-lg 2xl:text-xl">{item.title}</h3>
              <p className="mt-4 text-sm leading-7 text-[#D1D1D1]">{item.body}</p>
              <div className="mt-7">
                <ArrowLink href={item.href}>{item.cta}</ArrowLink>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="neet-preparation" tinted lazy>
        <div className="grid gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('neet.eyebrow')}</p>
            <h2 className="mt-5 text-[clamp(3rem,6vw,6.8rem)] font-black uppercase leading-[0.88] text-white">
              NEET Preparation
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#D1D1D1]">{t('neet.subtitle')}</p>
            <div className="mt-7 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#050505] px-4 py-2 text-sm font-black uppercase tracking-wide text-white">NEET - Available Now</span>
              {FUTURE_EXAMS.map((exam) => (
                <span key={exam} className="rounded-full border border-[#2B2B2B] bg-[#111111] px-4 py-2 text-sm font-semibold text-[#D1D1D1]">
                  {exam} - Coming Soon
                </span>
              ))}
            </div>
            <div className="mt-8">
              <PrimaryLink href="/mock-tests">Start NEET Preparation</PrimaryLink>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#2B2B2B] bg-[#111111] p-5 shadow-2xl shadow-black/8 sm:p-7">
            <div className="grid gap-3 sm:grid-cols-2">
              {PREP_FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="flex items-center gap-3 rounded-2xl bg-[#050505] p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="text-sm font-black text-white">{feature.title}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {subjects.map((subject) => (
                <Link key={subject.title} href={subject.href} className="rounded-2xl border border-[#2B2B2B] bg-[#111111] p-5 transition hover:-translate-y-1 hover:border-brand/35 hover:shadow-lg">
                  <h3 className="text-xl font-black text-white">{subject.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#D1D1D1]">{subject.body}</p>
                </Link>
              ))}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {PREP_ACTIONS.map((action) => (
                <Link key={action.title} href={action.href} className="group rounded-2xl bg-[#050505] p-4 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#D1D1D1]">
                  {action.title}
                  <span className="ml-2 inline-block text-brand-light transition group-hover:translate-x-1">-&gt;</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section id="admissions" lazy>
        <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('admissions.eyebrow')}</p>
            <h2 className="mt-5 text-[clamp(2.5rem,5vw,5.8rem)] font-black uppercase leading-[0.92] text-white">
              {t('admissions.title')}
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#D1D1D1]">{t('admissions.subtitle')}</p>
            <div className="mt-8">
              <PrimaryLink href="#callback">{t('ctaPrimary')}</PrimaryLink>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {admissionCards.map((card, index) => (
              <Link key={card.title} href={card.href} className="rounded-[1.5rem] border border-[#2B2B2B] bg-[#111111] p-6 shadow-xl shadow-black/5 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/10">
                <p className="text-sm font-black text-brand">0{index + 1}</p>
                <h3 className="mt-5 text-2xl font-black uppercase leading-tight text-white">{card.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#D1D1D1]">{card.body}</p>
              </Link>
            ))}
          </div>
        </div>
      </Section>

      <Section id="destinations" tinted lazy>
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('destinations.eyebrow')}</p>
            <h2 className="mt-5 text-[clamp(2.5rem,5vw,5.6rem)] font-black uppercase leading-[0.92] text-white">
              {t('destinations.title')}
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#D1D1D1]">{t('destinations.subtitle')}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {destinationCards.map((card) => {
              const meta = DESTINATION_META[card.title] ?? { label: 'GLOBAL', program: 'Education pathway' };
              return (
                <Link key={card.title} href={card.href} className="group rounded-[1.5rem] border border-[#2B2B2B] bg-[#111111] p-6 shadow-xl shadow-black/5 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/10">
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#050505] text-sm font-black text-white" aria-hidden="true">{meta.label}</span>
                  <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-brand">{meta.program}</p>
                  <h3 className="mt-2 text-xl font-black uppercase leading-tight text-white">{card.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[#D1D1D1]">{card.body}</p>
                  <span className="mt-6 inline-flex text-xs font-black uppercase tracking-[0.12em] text-brand transition group-hover:translate-x-1">
                    {card.cta} -&gt;
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </Section>

      <Section id="student-journey" lazy>
        <div className="rounded-[2rem] bg-[#050505] p-6 text-white shadow-2xl shadow-black/16 sm:p-10 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.32em] text-brand-light">Student Journey</p>
              <h2 className="mt-4 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92]">Rise with a clear path.</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-5">
              {JOURNEY.map((step, index) => (
                <div key={step} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <p className="text-2xl font-black text-brand-light">0{index + 1}</p>
                  <p className="mt-3 text-sm font-black uppercase tracking-[0.08em]">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section id="callback" tinted lazy>
        <div className="grid gap-10 rounded-[2rem] border border-[#2B2B2B] bg-[#111111] p-6 shadow-2xl shadow-black/8 sm:p-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('leadForm.eyebrow')}</p>
            <h2 className="mt-5 text-[clamp(2.5rem,5vw,5.6rem)] font-black uppercase leading-[0.92] text-white">
              {t('leadForm.title')}
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#D1D1D1]">{t('leadForm.subtitle')}</p>
          </div>
          <HomeLeadForm />
        </div>
      </Section>

      <Section id="why-vv" lazy>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('why.eyebrow')}</p>
            <h2 className="mt-5 text-[clamp(2.5rem,5vw,5.6rem)] font-black uppercase leading-[0.92] text-white">
              {t('why.title')}
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {whyItems.map((item) => (
              <div key={item.title} className="rounded-[1.5rem] border border-[#2B2B2B] bg-[#111111] p-6 shadow-xl shadow-black/5">
                <h3 className="text-lg font-black uppercase text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#D1D1D1]">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section id="previous-year-papers" tinted lazy>
        <div className="grid gap-8 rounded-[2rem] border border-[#2B2B2B] bg-[#111111] p-8 shadow-xl shadow-black/5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-brand">NEET Previous Year Papers</p>
            <h2 className="mt-4 text-3xl font-black uppercase text-white sm:text-5xl">{t('pyq.title')}</h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[#D1D1D1]">{t('pyq.body')}</p>
          </div>
          <div>
            <SecondaryLink href="/mock-tests">{t('pyq.cta')}</SecondaryLink>
          </div>
        </div>
      </Section>

      <Section lazy>
        <div className="rounded-[2rem] bg-gradient-to-br from-[#050505] via-[#111111] to-[#050505] p-8 text-white shadow-2xl shadow-black/18 sm:p-12 lg:p-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-brand-light">{t('finalCta.eyebrow')}</p>
              <h2 className="mt-5 max-w-4xl text-[clamp(3rem,7vw,7.5rem)] font-black uppercase leading-[0.88]">
                {t('finalCta.title')}
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/78">{t('finalCta.subtitle')}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <PrimaryLink href="#callback">{t('ctaPrimary')}</PrimaryLink>
              <SecondaryLink href="#neet-preparation" className="border-white/25 bg-white/8 text-white hover:bg-white/12">
                Start NEET Preparation
              </SecondaryLink>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
