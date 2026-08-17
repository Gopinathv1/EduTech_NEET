import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import {
  Section,
  PrimaryLink,
  SecondaryLink,
  ArrowLink,
  Container,
} from '@/components/public/ui';
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

const MARQUEE = [
  'STUDY ABROAD',
  'MBBS ABROAD',
  'STUDY IN EUROPE',
  'NEET PREPARATION',
  'CAREER GUIDANCE',
  'QUESTION BANK',
  'GLOBAL EDUCATION',
];

const PREP_ACTIONS = [
  { title: 'Question Bank', href: '/mock-tests' },
  { title: 'Previous Year Papers', href: '/#previous-year-papers' },
  { title: 'Mock Tests', href: '/mock-tests' },
  { title: 'Chapter-wise Practice', href: '/mock-tests' },
];

const FUTURE_EXAMS = ['JEE Main', 'JEE Advanced'];

export default function HomePage() {
  const t = useTranslations('home');
  const introItems = t.raw('intro.items') as string[];
  const quickActions = t.raw('quickActions.items') as Action[];
  const admissionCards = t.raw('admissions.cards') as AdmissionCard[];
  const destinationCards = t.raw('destinations.items') as Action[];
  const whyItems = t.raw('why.items') as { title: string; body: string }[];
  const howItems = t.raw('how.items') as { title: string; body: string }[];
  const subjects = t.raw('neet.subjects') as Subject[];

  return (
    <>
      <section className="relative -mt-[65px] min-h-[calc(100vh+65px)] max-w-full overflow-hidden bg-background pt-[65px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(0,140,145,0.15),transparent_28%),radial-gradient(circle_at_78%_10%,rgba(210,166,60,0.1),transparent_24%),linear-gradient(180deg,#020608_0%,#04090D_58%,#020608_100%)]" />
        <div className="absolute inset-0 z-[1] bg-[linear-gradient(90deg,#020608_0%,rgba(2,6,8,0.98)_43%,rgba(2,6,8,0.78)_70%,rgba(2,6,8,0.46)_100%)]" />
        <div className="absolute left-1/2 top-28 h-px w-[80vw] -translate-x-1/2 bg-gradient-to-r from-transparent via-accent to-transparent vv-pulse-line" />
        <div className="absolute -right-28 top-24 h-72 w-72 rounded-full border border-brand/10 bg-brand/10 blur-3xl" />
        <div className="absolute bottom-8 left-4 h-44 w-44 rounded-full border border-accent/10 bg-accent/10 blur-3xl" />
        <PeacockQuillArtwork className="right-[-300px] top-[20%] z-0 h-[430px] w-[620px] opacity-[0.08] sm:right-[-210px] sm:h-[520px] sm:w-[760px] sm:opacity-[0.13] lg:right-[-90px] lg:top-[14%] lg:h-[650px] lg:w-[940px] lg:opacity-[0.18] xl:right-0" />

        <Container className="relative z-10 flex min-h-[calc(100vh-65px)] items-center py-20 lg:py-28">
          <div className="w-full max-w-6xl min-w-0 vv-reveal">
            <div className="inline-flex max-w-full items-center gap-3 border-y border-white/10 bg-white/[0.03] px-4 py-3">
              <span className="h-2 w-2 bg-accent" />
              <p className="text-xs font-black uppercase tracking-[0.3em] text-textPrimary sm:text-sm">{t('brand')}</p>
              <span className="h-2 w-2 bg-brand" />
            </div>
            <h1 className="mt-8 max-w-6xl text-[clamp(4rem,8.5vw,9rem)] font-black uppercase leading-[0.88] text-white">
              Your Education.
              <br />
              Your Future.
              <br />
              <span className="text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.72)]">Across Borders.</span>
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-8 text-textSecondary sm:text-xl">
              {t('subtitle')}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <PrimaryLink href="#callback">{t('ctaPrimary')}</PrimaryLink>
              <SecondaryLink href="#admissions">{t('ctaSecondary')}</SecondaryLink>
              <ArrowLink href="#neet-preparation">{t('ctaTertiary')}</ArrowLink>
            </div>
          </div>
        </Container>
      </section>

      <Section className="py-14 sm:py-20 lg:py-20">
        <div className="grid gap-8 border-y border-white/10 py-8 lg:grid-cols-[1.05fr_1fr] lg:items-start">
          <p className="max-w-3xl text-2xl font-black uppercase leading-tight text-white sm:text-3xl lg:text-4xl">
            {t('intro.statement')}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {introItems.map((item) => (
              <p key={item} className="border-t border-brand/35 pt-4 text-sm font-bold uppercase leading-6 tracking-[0.08em] text-textSecondary">
                {item}
              </p>
            ))}
          </div>
        </div>
      </Section>

      <section className="relative h-20 max-w-full overflow-hidden border-y border-brand/40 bg-[#020608] shadow-[inset_0_1px_0_rgba(0,140,145,0.2),inset_0_-1px_0_rgba(210,166,60,0.18)] [contain:layout_paint] sm:h-24">
        <div className="absolute left-0 top-1/2 flex w-max max-w-none -translate-y-1/2 items-center gap-0 whitespace-nowrap will-change-transform vv-marquee-track">
          {[...MARQUEE, ...MARQUEE].map((item, index) => (
            <span key={`${item}-${index}`} className="flex items-center">
              <span
                className={`px-4 text-2xl font-black uppercase tracking-[0.12em] sm:px-8 sm:text-4xl lg:text-5xl ${
                  index % 4 === 0 ? 'text-accent' : index % 4 === 1 ? 'text-cyan-50' : 'text-textPrimary'
                }`}
              >
                {item}
              </span>
              <span className="text-brand/70">•</span>
            </span>
          ))}
        </div>
      </section>

      <Section id="what-we-do">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-accent">What We Do</p>
            <h2 className="mt-5 text-[clamp(2.75rem,6vw,6.5rem)] font-black uppercase leading-[0.9] text-white">
              {t('quickActions.titleLine1')}
              <br />
              {t('quickActions.titleLine2')}
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-8 text-textSecondary">{t('quickActions.subtitle')}</p>
        </div>
        <div className="mt-14 grid min-w-0 gap-px overflow-hidden border-y border-white/10 bg-white/10 md:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((item, index) => (
            <div key={item.title} className="group min-w-0 bg-background p-6 transition hover:bg-[#061014] sm:p-8">
              <p className="text-7xl font-black leading-none text-brand/75 sm:text-8xl">0{index + 1}</p>
              <h3 className="mt-10 text-xl font-black uppercase leading-tight text-white xl:text-lg 2xl:text-xl">{item.title}</h3>
              <p className="mt-5 text-sm leading-7 text-textSecondary">{item.body}</p>
              <div className="mt-8">
                <ArrowLink href={item.href}>{item.cta}</ArrowLink>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="admissions" lazy>
        <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-accent">{t('admissions.eyebrow')}</p>
            <h2 className="mt-5 text-[clamp(2.75rem,6vw,6.25rem)] font-black uppercase leading-[0.9] text-white">
              {t('admissions.title')}
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-textSecondary">{t('admissions.subtitle')}</p>
            <div className="mt-8">
              <PrimaryLink href="#callback">{t('ctaPrimary')}</PrimaryLink>
            </div>
          </div>
          <div className="border-y border-white/10">
            {admissionCards.map((card, index) => (
              <div key={card.title} className="grid gap-5 border-b border-white/10 py-7 last:border-b-0 sm:grid-cols-[auto_1fr] sm:items-start">
                <p className="text-4xl font-black leading-none text-brand/80">0{index + 1}</p>
                <div>
                  <h3 className="text-2xl font-black uppercase leading-tight text-white">{card.title}</h3>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-textSecondary">{card.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section id="destinations" tinted lazy>
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-accent">{t('destinations.eyebrow')}</p>
            <h2 className="mt-5 text-[clamp(2.75rem,6vw,6rem)] font-black uppercase leading-[0.9] text-white">
              {t('destinations.title')}
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-textSecondary">{t('destinations.subtitle')}</p>
          </div>
          <div className="grid gap-px overflow-hidden border-y border-white/10 bg-white/10 sm:grid-cols-3">
            {destinationCards.map((card) => (
              <Link key={card.title} href={card.href} className="group bg-background p-6 transition hover:bg-surfaceElevated">
                <h3 className="text-xl font-black uppercase leading-tight text-white">{card.title}</h3>
                <p className="mt-4 text-sm leading-7 text-textSecondary">{card.body}</p>
                <span className="mt-6 inline-flex text-xs font-black uppercase tracking-[0.12em] text-accent transition group-hover:translate-x-1">
                  {card.cta} -&gt;
                </span>
              </Link>
            ))}
          </div>
        </div>
      </Section>

      <Section id="callback" lazy>
        <div className="grid gap-10 border-y border-brand/30 bg-[#020608] p-6 sm:p-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-accent">{t('leadForm.eyebrow')}</p>
            <h2 className="mt-5 text-[clamp(2.75rem,6vw,6.25rem)] font-black uppercase leading-[0.9] text-white">
              {t('leadForm.title')}
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-textSecondary">{t('leadForm.subtitle')}</p>
          </div>
          <HomeLeadForm />
        </div>
      </Section>

      <Section id="why-vv" tinted lazy>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-accent">{t('why.eyebrow')}</p>
            <h2 className="mt-5 text-[clamp(2.75rem,6vw,6rem)] font-black uppercase leading-[0.9] text-white">
              {t('why.title')}
            </h2>
          </div>
          <div className="grid gap-px overflow-hidden border-y border-white/10 bg-white/10 sm:grid-cols-2">
            {whyItems.map((item) => (
              <div key={item.title} className="bg-background p-6">
                <h3 className="text-lg font-black uppercase text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-textSecondary">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section id="neet-preparation" lazy>
        <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-accent">{t('neet.eyebrow')}</p>
            <h2 className="mt-5 text-[clamp(3rem,6vw,7rem)] font-black uppercase leading-[0.88] text-white">
              {t('neet.title')}
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-textSecondary">{t('neet.subtitle')}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-lg border border-brand/40 bg-brand-soft px-3 py-1.5 text-sm font-black uppercase tracking-wide text-accent">
                NEET - Available Now
              </span>
              {FUTURE_EXAMS.map((exam) => (
                <span key={exam} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-textSecondary">
                  {exam} - Coming Soon
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-6">
            <div className="grid gap-px overflow-hidden border-y border-white/10 bg-white/10 sm:grid-cols-3">
              {subjects.map((subject) => (
                <div key={subject.title} className="bg-surface p-5 transition hover:bg-surfaceElevated">
                  <h3 className="text-xl font-black text-white">{subject.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-textSecondary">{subject.body}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-px overflow-hidden border-y border-white/10 bg-white/10 sm:grid-cols-2">
              {PREP_ACTIONS.map((action) => (
                <Link
                  key={action.title}
                  href={action.href}
                  className="group bg-background p-5 text-sm font-bold uppercase tracking-[0.08em] text-white transition hover:bg-brand-soft"
                >
                  {action.title}
                  <span className="ml-2 inline-block text-accent transition group-hover:translate-x-1">-&gt;</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section id="previous-year-papers" lazy>
        <div className="grid gap-8 border-y border-white/10 py-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-accent">NEET Previous Year Papers</p>
            <h2 className="mt-4 text-3xl font-black uppercase text-white sm:text-5xl">
              {t('pyq.title')}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-textSecondary">{t('pyq.body')}</p>
          </div>
          <div>
            <SecondaryLink href="/mock-tests">{t('pyq.cta')}</SecondaryLink>
          </div>
        </div>
      </Section>

      <Section id="how-it-works" tinted lazy>
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-accent">{t('how.eyebrow')}</p>
            <h2 className="mt-5 text-[clamp(2.75rem,6vw,6rem)] font-black uppercase leading-[0.9] text-white">
              {t('how.title')}
            </h2>
            <div className="mt-8">
              <ArrowLink href="#neet-preparation">{t('ctaTertiary')}</ArrowLink>
            </div>
          </div>
          <div className="border-y border-white/10">
            {howItems.map((item, index) => (
              <div key={item.title} className="grid gap-5 border-b border-white/10 py-7 last:border-b-0 sm:grid-cols-[auto_1fr]">
                <p className="text-4xl font-black text-brand/80">0{index + 1}</p>
                <div>
                  <h3 className="text-2xl font-black uppercase text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-textSecondary">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section lazy>
        <div className="border-y border-brand/30 bg-[#020608] p-8 text-white shadow-2xl shadow-brand/10 sm:p-12 lg:p-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-accent">{t('finalCta.eyebrow')}</p>
              <h2 className="mt-5 max-w-4xl text-[clamp(3.5rem,8vw,8.5rem)] font-black uppercase leading-[0.86]">
                {t('finalCta.title')}
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-cyan-50/80">{t('finalCta.subtitle')}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <PrimaryLink href="#callback" className="bg-white text-slate-950 hover:bg-amber-100">
                {t('ctaPrimary')}
              </PrimaryLink>
              <SecondaryLink href="#neet-preparation">{t('ctaTertiary')}</SecondaryLink>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
