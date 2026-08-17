import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import {
  Section,
  SectionHeading,
  Card,
  IconBadge,
  PrimaryLink,
  SecondaryLink,
  ArrowLink,
  Container,
} from '@/components/public/ui';
import {
  BookIcon,
  ChartIcon,
  ClockIcon,
  GlobeIcon,
  ShieldIcon,
  CheckIcon,
  UsersIcon,
} from '@/components/public/icons';

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
type Filter = { label: string; values: string[] };
type Benefit = { title: string; body: string };
type ExamChip = { label: string; status: string; available: boolean };

const ACTION_ICONS = [BookIcon, ClockIcon, ShieldIcon, BookIcon, UsersIcon, ChartIcon];
const SUBJECT_ICONS = [BookIcon, ShieldIcon, GlobeIcon];
const BENEFIT_ICONS = [BookIcon, ShieldIcon, CheckIcon, ClockIcon, GlobeIcon, ChartIcon];

export default function HomePage() {
  const t = useTranslations('home');

  const examChips = t.raw('examChips') as ExamChip[];
  const quickActions = t.raw('quickActions.items') as Action[];
  const subjects = t.raw('neet.subjects') as Subject[];
  const filters = t.raw('discovery.filters') as Filter[];
  const benefits = t.raw('benefits.items') as Benefit[];

  return (
    <>
      <section className="border-b border-slate-100 bg-white">
        <Container className="grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-brand">{t('brand')}</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight text-slate-950 sm:text-5xl">
              {t('title')}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              {t('subtitle')}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PrimaryLink href="/register">{t('ctaPrimary')}</PrimaryLink>
              <SecondaryLink href="#question-bank">{t('ctaSecondary')}</SecondaryLink>
            </div>
            <div className="mt-7 flex flex-wrap gap-2" aria-label={t('examSelectorLabel')}>
              {examChips.map((exam) => (
                <span
                  key={exam.label}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${
                    exam.available
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-slate-50 text-slate-500'
                  }`}
                >
                  {exam.label}
                  <span className="text-xs font-medium">{exam.status}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <label htmlFor="home-search" className="text-sm font-semibold text-slate-900">
              {t('search.label')}
            </label>
            <div className="mt-3 flex rounded-xl border border-slate-200 bg-white p-2">
              <input
                id="home-search"
                type="search"
                placeholder={t('search.placeholder')}
                className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                aria-describedby="home-search-note"
              />
              <button
                type="button"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-80"
                disabled
              >
                {t('search.button')}
              </button>
            </div>
            <p id="home-search-note" className="mt-2 text-xs leading-5 text-slate-500">
              {t('search.note')}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {(t.raw('heroStats') as string[]).map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <Section id="quick-actions">
        <SectionHeading
          eyebrow={t('quickActions.eyebrow')}
          title={t('quickActions.title')}
          subtitle={t('quickActions.subtitle')}
        />
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action, index) => {
            const Icon = ACTION_ICONS[index] ?? BookIcon;
            return (
              <Card key={action.title} className="flex h-full flex-col">
                <IconBadge>
                  <Icon className="h-6 w-6" />
                </IconBadge>
                <h3 className="mt-4 text-lg font-bold text-slate-950">{action.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{action.body}</p>
                <div className="mt-5">
                  <ArrowLink href={action.href}>{action.cta}</ArrowLink>
                </div>
              </Card>
            );
          })}
        </div>
      </Section>

      <Section id="question-bank" tinted>
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <SectionHeading
            eyebrow={t('neet.eyebrow')}
            title={t('neet.title')}
            subtitle={t('neet.subtitle')}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {subjects.map((subject, index) => {
              const Icon = SUBJECT_ICONS[index] ?? BookIcon;
              return (
                <Card key={subject.title}>
                  <IconBadge>
                    <Icon className="h-6 w-6" />
                  </IconBadge>
                  <h3 className="mt-4 text-lg font-bold text-slate-950">{subject.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{subject.body}</p>
                  <div className="mt-5">
                    <ArrowLink href={subject.href}>{t('neet.subjectCta')}</ArrowLink>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </Section>

      <Section id="previous-year-papers">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <SectionHeading
              eyebrow={t('discovery.eyebrow')}
              title={t('discovery.title')}
              subtitle={t('discovery.subtitle')}
            />
            <div className="mt-6 flex flex-wrap gap-2">
              {filters.map((filter) => (
                <div key={filter.label} className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs font-bold uppercase text-slate-500">{filter.label}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {filter.values.map((value) => (
                      <span
                        key={value}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                      >
                        {value}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Card className="bg-slate-950 text-white">
            <h3 className="text-xl font-bold">{t('pyq.title')}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">{t('pyq.body')}</p>
            <div className="mt-6">
              <Link
                href="/mock-tests"
                className="inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950"
              >
                {t('pyq.cta')}
              </Link>
            </div>
          </Card>
        </div>
      </Section>

      <Section id="value" tinted>
        <SectionHeading
          center
          eyebrow={t('benefits.eyebrow')}
          title={t('benefits.title')}
          subtitle={t('benefits.subtitle')}
        />
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit, index) => {
            const Icon = BENEFIT_ICONS[index] ?? CheckIcon;
            return (
              <div key={benefit.title} className="flex gap-3 rounded-xl bg-white p-5">
                <Icon className="mt-1 h-5 w-5 shrink-0 text-brand" />
                <div>
                  <h3 className="font-bold text-slate-950">{benefit.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{benefit.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section>
        <div className="rounded-2xl bg-slate-950 p-8 text-white sm:p-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-2xl font-extrabold sm:text-3xl">{t('finalCta.title')}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                {t('finalCta.subtitle')}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/register"
                className="rounded-lg bg-white px-5 py-3 text-center text-sm font-bold text-slate-950"
              >
                {t('finalCta.primary')}
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-white/30 px-5 py-3 text-center text-sm font-bold text-white"
              >
                {t('finalCta.secondary')}
              </Link>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
