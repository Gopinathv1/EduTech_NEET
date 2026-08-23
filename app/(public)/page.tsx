import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import { Container, PrimaryLink, SecondaryLink, Section } from '@/components/public/ui';
import { BookIcon, ChartIcon, GlobeIcon, ShieldIcon } from '@/components/public/icons';
import StudentJourneys from '@/components/public/StudentJourneys';

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
  { title: 'Exam Preparation', href: '/exam-preparation' },
  { title: 'Study Abroad', href: '/study-abroad' },
  { title: 'Courses', href: '/courses' },
  { title: 'Counselling', href: '/counselling' },
] as const;

const SERVICE_CARDS = [
  {
    title: 'Exam Preparation',
    body: 'Prepare for competitive exams through structured practice, mock tests, question banks and performance insights.',
    href: '/exam-preparation',
    icon: BookIcon,
  },
  {
    title: 'Study Abroad',
    body: 'Explore international education opportunities with guidance on countries, universities, courses, applications and student life.',
    href: '/study-abroad',
    icon: GlobeIcon,
  },
  {
    title: 'Courses & Future Skills',
    body: 'Explore live learning programs in NEET, JEE, AI, Python, Data Science, Machine Learning and emerging technologies.',
    href: '/courses',
    icon: ChartIcon,
  },
  {
    title: 'Counselling & Admission Guidance',
    body: 'Get personalized support for academic decisions, admissions, course selection and your next education pathway.',
    href: '/counselling',
    icon: ShieldIcon,
  },
] as const;

export default function HomePage() {
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
                Education • Preparation • Global Opportunity
              </p>
            </div>
            <h1 className="mt-7 max-w-5xl text-[clamp(3.6rem,8vw,8.8rem)] font-black uppercase leading-[0.88] text-white">
              Rise Beyond
              <br />
              <span className="bg-gradient-to-r from-brand via-brand-light to-accentBlue bg-clip-text text-transparent">
                Boundaries.
              </span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#D1D1D1] sm:text-xl">
              Prepare smarter. Choose confidently. Build your future in India and across the world.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <PrimaryLink href="#what-we-do">Explore SIVORA</PrimaryLink>
              <SecondaryLink href="/counselling">Get Free Counselling</SecondaryLink>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:max-w-3xl">
              {QUICK_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl border border-[#2B2B2B] bg-[#111111]/90 p-4 text-sm font-black uppercase tracking-[0.1em] text-white shadow-lg shadow-black/5 transition hover:-translate-y-0.5 hover:border-brand/35"
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>

          <div className="relative min-h-[360px] lg:min-h-[620px]" aria-hidden="true" />
        </Container>
      </section>

      <Section id="what-we-do">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">What We Do</p>
            <h2 className="mt-5 max-w-3xl text-[clamp(2.5rem,5vw,5.6rem)] font-black uppercase leading-[0.92] text-white">
              How SIVORA UP↑RISING
              <br />
              Helps Students Move Forward
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-8 text-[#D1D1D1]">
            Choose the path you need today, then continue into the focused child page for details.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {SERVICE_CARDS.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-[1.75rem] border border-[#2B2B2B] bg-[#111111] p-6 shadow-xl shadow-black/5 transition hover:-translate-y-1 hover:border-brand/35 hover:shadow-2xl hover:shadow-black/10 sm:p-7"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                    <Icon className="h-6 w-6" />
                  </span>
                  <p className="text-4xl font-black leading-none text-[#f6a623]/35">0{index + 1}</p>
                </div>
                <h3 className="mt-8 text-xl font-black uppercase leading-tight text-white xl:text-lg 2xl:text-xl">
                  {item.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-[#D1D1D1]">{item.body}</p>
                <span className="mt-7 inline-flex text-xs font-black uppercase tracking-[0.12em] text-brand transition group-hover:translate-x-1">
                  Explore -&gt;
                </span>
              </Link>
            );
          })}
        </div>
      </Section>

      <StudentJourneys />
    </>
  );
}
