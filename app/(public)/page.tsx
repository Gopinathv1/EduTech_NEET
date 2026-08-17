import Image from 'next/image';
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
import CtaBand from '@/components/public/CtaBand';
import {
  RupeeIcon,
  ChartIcon,
  GlobeIcon,
  ShieldIcon,
  BookIcon,
  ClockIcon,
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

const FEATURE_ICONS = [RupeeIcon, ChartIcon, GlobeIcon, ShieldIcon];
const STEP_ICONS = [BookIcon, ClockIcon, ChartIcon];

type TitleBody = { title: string; body: string };
type Stat = { value: string; label: string };

export default function HomePage() {
  const t = useTranslations('home');

  const stats = t.raw('stats') as Stat[];
  const features = t.raw('features') as TitleBody[];
  const steps = t.raw('steps') as TitleBody[];

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-soft to-white">
        <Container className="grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-2">
          <div>
            <span className="inline-block rounded-full bg-accent/15 px-3 py-1 text-sm font-semibold text-amber-700">
              {t('badge')}
            </span>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              {t('title')}
            </h1>
            <p className="mt-4 max-w-xl text-base text-slate-600 sm:text-lg">{t('subtitle')}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PrimaryLink href="/register">{t('ctaPractice')}</PrimaryLink>
              <SecondaryLink href="/mock-tests">{t('ctaLearn')}</SecondaryLink>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <Image
              src="/hero.svg"
              alt={t('heroImageAlt')}
              width={520}
              height={420}
              priority
              className="h-auto w-full max-w-md"
            />
          </div>
        </Container>
      </section>

      {/* Stats */}
      <section className="border-y border-slate-100 bg-white">
        <Container className="grid grid-cols-2 gap-6 py-10 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-extrabold text-brand sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-sm text-slate-600">{s.label}</p>
            </div>
          ))}
        </Container>
      </section>

      {/* Features */}
      <Section lazy>
        <SectionHeading
          center
          eyebrow={t('featuresEyebrow')}
          title={t('featuresTitle')}
          subtitle={t('featuresSubtitle')}
        />
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => {
            const Icon = FEATURE_ICONS[i] ?? RupeeIcon;
            return (
              <Card key={f.title}>
                <IconBadge>
                  <Icon className="h-6 w-6" />
                </IconBadge>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{f.body}</p>
              </Card>
            );
          })}
        </div>
      </Section>

      {/* How it works */}
      <Section tinted lazy>
        <SectionHeading center eyebrow={t('stepsEyebrow')} title={t('stepsTitle')} />
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {steps.map((s, i) => {
            const Icon = STEP_ICONS[i] ?? BookIcon;
            return (
              <Card key={s.title} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <p className="mt-3 text-xs font-bold uppercase tracking-wide text-brand">
                  {t('stepLabel', { n: i + 1 })}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{s.body}</p>
              </Card>
            );
          })}
        </div>
      </Section>

      {/* Admission teaser */}
      <Section lazy>
        <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10">
          <div className="grid items-center gap-6 lg:grid-cols-[1.5fr,1fr]">
            <div>
              <SectionHeading eyebrow={t('admissionEyebrow')} title={t('admissionTitle')} subtitle={t('admissionBody')} />
              <div className="mt-6 flex flex-wrap gap-4">
                <ArrowLink href="/admission-guidance">{t('admissionLink')}</ArrowLink>
                <ArrowLink href="/countries">{t('countriesLink')}</ArrowLink>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {(t.raw('countryFlags') as string[]).map((flag, i) => (
                <span
                  key={i}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-brand-soft text-2xl"
                  aria-hidden="true"
                >
                  {flag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
