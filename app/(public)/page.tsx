import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import {
  Section,
  SectionHeading,
  Card,
  PrimaryLink,
  SecondaryLink,
  ArrowLink,
  Container,
} from '@/components/public/ui';
import PeacockQuillArtwork from '@/components/brand/PeacockQuillArtwork';

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
  'MBBS ABROAD',
  'STUDY IN EUROPE',
  'NEET PREPARATION',
  'GLOBAL EDUCATION',
  'PREVIOUS YEAR PAPERS',
  'CAREER GUIDANCE',
  'QUESTION BANK',
  'COUNSELLING',
];

const DESTINATIONS = ['India', 'Russia', 'Georgia', 'Kazakhstan', 'Uzbekistan', 'Other destinations'];

const PREP_ACTIONS = [
  { title: 'Question Bank', href: '/mock-tests' },
  { title: 'Previous Year Papers', href: '/#previous-year-papers' },
  { title: 'Mock Tests', href: '/mock-tests' },
  { title: 'Chapter-wise Practice', href: '/mock-tests' },
];

const FUTURE_EXAMS = ['JEE Main', 'JEE Advanced'];

export default function HomePage() {
  const t = useTranslations('home');
  const quickActions = t.raw('quickActions.items') as Action[];
  const admissionCards = t.raw('admissions.cards') as AdmissionCard[];
  const studyAbroadSupport = t.raw('admissions.supportItems') as string[];
  const subjects = t.raw('neet.subjects') as Subject[];
  const europeDestinations = t.raw('countriesSection.europeExamples') as string[];

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
              Explore overseas education opportunities, get counselling guidance for important academic decisions, and prepare smarter for competitive exams.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <PrimaryLink href="#admissions">{t('ctaPrimary')}</PrimaryLink>
              <SecondaryLink href="#neet-preparation">{t('ctaSecondary')}</SecondaryLink>
            </div>
          </div>
        </Container>
      </section>

      <section className="max-w-full overflow-hidden border-y border-brand/40 bg-[#020608] py-5 shadow-[inset_0_1px_0_rgba(0,140,145,0.2),inset_0_-1px_0_rgba(210,166,60,0.18)] sm:py-6">
        <div className="flex w-max max-w-none items-center gap-0 whitespace-nowrap will-change-transform vv-marquee-track">
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
              How VV Overseas
              <br />
              Helps Students Move Forward
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-8 text-textSecondary">{t('quickActions.subtitle')}</p>
        </div>
        <div className="mt-14 grid min-w-0 gap-px overflow-hidden border-y border-white/10 bg-white/10 md:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((item, index) => (
            <div key={item.title} className="group min-w-0 bg-background p-6 transition hover:bg-surface sm:p-8">
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

      <Section id="admissions" tinted lazy>
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <SectionHeading
              eyebrow={t('admissions.eyebrow')}
              title="Find the Right Path for Your Education"
              subtitle={t('admissions.subtitle')}
            />
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PrimaryLink href="/admission-guidance">{t('admissions.cta')}</PrimaryLink>
              <SecondaryLink href="/countries">{t('admissions.countriesCta')}</SecondaryLink>
            </div>
            <div className="mt-8 border-y border-white/10 py-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-accent">{t('admissions.supportLabel')}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {studyAbroadSupport.map((item) => (
                  <span key={item} className="rounded-lg border border-white/10 bg-background/50 px-3 py-1.5 text-xs font-semibold text-textSecondary">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-px overflow-hidden border-y border-white/10 bg-white/10 sm:grid-cols-2">
            {admissionCards.map((card, index) => (
              <Card key={card.title} className="rounded-none border-0 bg-surface p-7">
                <p className="text-4xl font-black leading-none text-brand/80">0{index + 1}</p>
                <h3 className="mt-8 text-xl font-black uppercase text-white">{card.title}</h3>
                <p className="mt-3 text-sm leading-7 text-textSecondary">{card.body}</p>
                <div className="mt-7">
                  <ArrowLink href={card.href}>{card.title}</ArrowLink>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      <Section id="study-destinations" lazy>
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <SectionHeading
            eyebrow={t('countriesSection.eyebrow')}
            title="Explore Study Destinations"
            subtitle={t('countriesSection.subtitle')}
          />
          <div className="grid grid-cols-2 gap-px overflow-hidden border-y border-white/10 bg-white/10 sm:grid-cols-3">
            {DESTINATIONS.map((destination) => (
              <div key={destination} className="bg-background p-5 transition hover:bg-surfaceElevated">
                <p className="text-lg font-black text-white">{destination}</p>
                <p className="mt-2 text-xs uppercase tracking-wide text-textSecondary">Informational</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8">
          <PrimaryLink href="/countries">{t('countriesSection.cta')}</PrimaryLink>
        </div>

        <div id="study-europe" className="mt-16 border-y border-brand/30 bg-[linear-gradient(135deg,#06283A,#03080D_58%,#0A121A)] p-6 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-accent">{t('countriesSection.europeEyebrow')}</p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-[0.95] text-white sm:text-5xl">
                {t('countriesSection.europeTitle')}
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-textSecondary">{t('countriesSection.europeSubtitle')}</p>
              <p className="mt-5 border-l border-accent/40 pl-4 text-sm leading-7 text-textSecondary">{t('countriesSection.europeNote')}</p>
              <div className="mt-8">
                <SecondaryLink href="/countries">{t('countriesSection.europeCta')}</SecondaryLink>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-px overflow-hidden border-y border-white/10 bg-white/10 sm:grid-cols-3">
              {europeDestinations.map((destination) => (
                <div key={destination} className="bg-background/90 p-4 transition hover:bg-surfaceElevated sm:p-5">
                  <p className="text-base font-black text-white">{destination}</p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-textSecondary">{t('countriesSection.europeCardLabel')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section id="neet-preparation" tinted lazy>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <span className="inline-flex rounded-lg border border-brand/40 bg-brand-soft px-3 py-1 text-xs font-black uppercase tracking-wide text-accent">
              Available Now
            </span>
            <SectionHeading
              eyebrow={t('neet.eyebrow')}
              title="Prepare With VV Overseas"
              subtitle={t('neet.subtitle')}
            />
            <div className="mt-6 flex flex-wrap gap-2">
              {FUTURE_EXAMS.map((exam) => (
                <span key={exam} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-textSecondary">
                  {exam} - Coming Soon
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {subjects.map((subject) => (
                <Card key={subject.title} className="p-5">
                  <h3 className="text-xl font-black text-white">{subject.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-textSecondary">{subject.body}</p>
                </Card>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {PREP_ACTIONS.map((action) => (
                <Link
                  key={action.title}
                  href={action.href}
                  className="group rounded-xl border border-white/10 bg-surface/70 p-5 text-sm font-bold text-white transition hover:-translate-y-1 hover:border-accent/50 hover:bg-brand-soft"
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
        <div className="overflow-hidden border-y border-brand/30 bg-[linear-gradient(135deg,#06283A,#03080D_56%,#07111A)] p-6 shadow-2xl shadow-brand/10 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-accent">NEET Previous Year Papers</p>
              <h2 className="mt-4 text-3xl font-black uppercase text-white sm:text-5xl">
                Practice the paper. Review the result. Improve the next attempt.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-textSecondary">{t('pyq.body')}</p>
            </div>
            <div className="border-l border-white/10 bg-surface/75 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-textSecondary">Year selector</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-lg border border-brand/50 bg-brand-soft px-4 py-2 text-sm font-black text-accent">
                  2025 - Ready when data is loaded
                </span>
                <span className="rounded-lg border border-white/10 px-4 py-2 text-sm text-textSecondary">More years later</span>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <PrimaryLink href="/mock-tests">Start Mock Test</PrimaryLink>
                <SecondaryLink href="/mock-tests">View Question Bank</SecondaryLink>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section lazy>
        <div className="border-y border-brand/30 bg-[linear-gradient(120deg,#06283A,#03080D_62%,#0A121A)] p-8 text-white shadow-2xl shadow-brand/10 sm:p-12 lg:p-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-accent">Ready to plan your next step?</p>
              <h2 className="mt-5 max-w-4xl text-[clamp(2.75rem,6vw,6.5rem)] font-black uppercase leading-[0.88]">{t('finalCta.title')}</h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-cyan-50/80">{t('finalCta.subtitle')}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <PrimaryLink href="/contact" className="bg-white text-slate-950 hover:bg-amber-100">
                Talk to Us
              </PrimaryLink>
              <SecondaryLink href="/admission-guidance">{t('finalCta.primary')}</SecondaryLink>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
