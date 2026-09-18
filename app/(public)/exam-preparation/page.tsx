import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import PageHero from '@/components/public/PageHero';
import { Section, PrimaryLink } from '@/components/public/ui';
import ExploreSivora from '@/components/public/ExploreSivora';
import { EXAMS } from '@/data/exams';
import { ProductFaqSection, RelatedServicesSection } from '@/components/public/ProductPageBlocks';
import ExamProductVisual from '@/components/public/ExamProductVisual';

export async function generateMetadata() {
  const t = await getTranslations('seo.examPreparation');
  return pageMetadata({ title: t('title'), description: t('description'), path: '/exam-preparation' });
}

export default function ExamPreparationPage() {
  const t = useTranslations('examPreparation');
  const exams = t.raw('exams') as Record<string, { description: string; subjects: string[] }>;
  const features = t.raw('hubFeatures') as string[];
  const practiceSteps = t.raw('practiceFlow.items') as string[];
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
        <ExamProductVisual />
      </Section>

      <Section>
        <div className="grid gap-5 md:grid-cols-3">
          {EXAMS.map((exam, index) => (
            <Link
              key={exam.slug}
              href={exam.active ? `/exam-preparation/${exam.slug}` : '/exam-preparation'}
              className="rounded-md border border-[#dce0e2] bg-white p-6 transition hover:-translate-y-1 hover:border-[#ff5a36]"
            >
              <p className="text-sm font-black text-brand">0{index + 1}</p>
              <h2 className="mt-5 text-2xl font-black uppercase text-[#171717]">{exam.name}</h2>
              <p className="mt-3 text-sm leading-7 text-[#6b6b67]">
                {exams[exam.slug]?.description ?? exam.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {(exams[exam.slug]?.subjects ?? exam.subjects).map((subject) => (
                  <span key={subject} className="rounded-full border border-[#dce0e2] bg-[#f0f0ed] px-3 py-1.5 text-xs font-bold text-[#565c60]">
                    {subject}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section tinted lazy>
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('featuresEyebrow')}</p>
            <h2 className="mt-5 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92] text-[#171717]">
              {t('featuresTitle')}
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <div key={feature} className="rounded-md border border-[#dce0e2] bg-white p-4">
                <p className="text-sm font-black uppercase tracking-[0.08em] text-[#171717]">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section lazy>
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('practiceFlow.eyebrow')}</p>
            <h2 className="mt-5 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92] text-[#171717]">
              {t('practiceFlow.title')}
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-5">
            {practiceSteps.map((step, index) => (
              <div key={step} className="rounded-md border border-[#dce0e2] bg-white p-4">
                <p className="text-xs font-black text-brand">0{index + 1}</p>
                <p className="mt-3 text-sm font-black uppercase tracking-[0.08em] text-[#171717]">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section lazy>
        <div className="rounded-md border border-[#dce0e2] bg-white p-8 lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-brand">{t('ctaEyebrow')}</p>
            <h2 className="mt-4 text-3xl font-black uppercase text-[#171717] sm:text-5xl">{t('ctaTitle')}</h2>
          </div>
          <div className="mt-6 lg:mt-0">
            <PrimaryLink href="/mock-tests">{t('primaryCta')}</PrimaryLink>
          </div>
        </div>
      </Section>

      <ProductFaqSection eyebrow={t('faq.eyebrow')} title={t('faq.title')} items={faqItems} tinted />

      <RelatedServicesSection
        eyebrow={t('related.eyebrow')}
        title={t('related.title')}
        items={relatedItems}
      />

      <ExploreSivora exclude={['examPreparation']} />
    </>
  );
}
