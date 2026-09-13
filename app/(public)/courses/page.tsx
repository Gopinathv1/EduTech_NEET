import { pageMetadata } from '@/lib/seo';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import PageHero from '@/components/public/PageHero';
import { PrimaryLink, SecondaryLink, Section } from '@/components/public/ui';
import ExploreSivora from '@/components/public/ExploreSivora';
import AstrologyLearningSection from '@/components/public/AstrologyLearningSection';
import {
  ACADEMIC_COURSE_STREAMS,
  AI_FUTURE_SKILL_CATEGORIES,
  AI_LEARNING_PATH,
} from '@/data/courses';
import { ProductFaqSection, RelatedServicesSection } from '@/components/public/ProductPageBlocks';

export async function generateMetadata() {
  const t = await getTranslations('seo.courses');
  return pageMetadata({ title: t('title'), description: t('description'), path: '/courses' });
}

export default function CoursesPage() {
  const t = useTranslations('courses');
  const families = t.raw('families.items') as { title: string; body: string; labels: string[]; href: string; cta: string }[];
  const faqItems = t.raw('faq.items') as { q: string; a: string }[];
  const relatedItems = t.raw('related.items') as { title: string; body: string; href: string; cta: string }[];

  return (
    <>
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('heroTitle')}
        subtitle={t('heroSubtitle')}
      />

      <Section>
        <div className="mb-10">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('families.eyebrow')}</p>
          <h2 className="mt-4 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92] text-white">
            {t('families.title')}
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {families.map((family) => (
            <Link
              key={family.href}
              href={family.href}
              className="rounded-2xl border border-[#2B2B2B] bg-[#111111] p-5 shadow-xl shadow-black/5 transition hover:-translate-y-1 hover:border-brand/35"
            >
              <h3 className="text-xl font-black uppercase leading-tight text-white">{family.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#D1D1D1]">{family.body}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {family.labels.map((label) => (
                  <span key={label} className="rounded-full border border-[#2B2B2B] bg-[#050505] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.1em] text-[#D1D1D1]">
                    {label}
                  </span>
                ))}
              </div>
              <span className="mt-6 inline-flex text-xs font-black uppercase tracking-[0.12em] text-brand">{family.cta}</span>
            </Link>
          ))}
        </div>
      </Section>

      <Section tinted lazy>
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('academic.eyebrow')}</p>
            <h2 className="mt-5 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92] text-white">
              {t('academic.title')}
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#D1D1D1]">{t('academic.subtitle')}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {ACADEMIC_COURSE_STREAMS.map((course) => (
              <Link
                key={course.key}
                href={course.href}
                className="rounded-[1.5rem] border border-[#2B2B2B] bg-[#111111] p-6 shadow-xl shadow-black/5 transition hover:-translate-y-1 hover:border-brand/35"
              >
                <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">{t('academic.label')}</p>
                <h3 className="mt-4 text-2xl font-black uppercase text-white">{t(`academic.items.${course.key}.title`)}</h3>
                <p className="mt-3 text-sm leading-7 text-[#D1D1D1]">{t(`academic.items.${course.key}.body`)}</p>
                <span className="mt-6 inline-flex text-xs font-black uppercase tracking-[0.12em] text-brand">
                  {t('academic.viewCta')}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </Section>

      <Section id="ai-future-skills" lazy>
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('ai.eyebrow')}</p>
            <h2 className="mt-5 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92] text-white">
              {t('ai.title')}
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#D1D1D1]">{t('ai.subtitle')}</p>
          </div>
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {AI_FUTURE_SKILL_CATEGORIES.map((category) => (
                <div key={category} className="rounded-2xl border border-[#2B2B2B] bg-[#050505]/76 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-black uppercase leading-5 tracking-[0.08em] text-white">
                      {t(`ai.categories.${category}.title`)}
                    </p>
                    <span className="shrink-0 rounded-full border border-brand/30 bg-brand-soft px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-brand">
                      {t('comingSoon')}
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-6 text-[#D1D1D1]">{t(`ai.categories.${category}.body`)}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[1.5rem] border border-[#2B2B2B] bg-[#111111] p-5">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-brand">{t('path.eyebrow')}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {AI_LEARNING_PATH.map((step, index) => (
                  <div key={step} className="flex items-center gap-2">
                    <span className="rounded-full border border-[#2B2B2B] bg-[#050505] px-3 py-1.5 text-xs font-black uppercase text-white">
                      {t(`path.steps.${step}`)}
                    </span>
                    {index < AI_LEARNING_PATH.length - 1 ? (
                      <span className="text-brand" aria-hidden="true">-&gt;</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      <AstrologyLearningSection />

      <ProductFaqSection eyebrow={t('faq.eyebrow')} title={t('faq.title')} items={faqItems} tinted />

      <RelatedServicesSection
        eyebrow={t('related.eyebrow')}
        title={t('related.title')}
        items={relatedItems}
      />

      <Section lazy>
        <div className="flex flex-col gap-3 sm:flex-row">
          <PrimaryLink href="/counselling">{t('talkCta')}</PrimaryLink>
          <SecondaryLink href="/exam-preparation">{t('examCta')}</SecondaryLink>
        </div>
      </Section>

      <ExploreSivora exclude={['courses']} />
    </>
  );
}
