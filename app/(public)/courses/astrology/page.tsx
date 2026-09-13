import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { pageMetadata } from '@/lib/seo';
import PageHero from '@/components/public/PageHero';
import ExploreSivora from '@/components/public/ExploreSivora';
import AstrologyLearningSection from '@/components/public/AstrologyLearningSection';
import { PrimaryLink, Section } from '@/components/public/ui';
import { ProductFaqSection, RelatedServicesSection } from '@/components/public/ProductPageBlocks';

export async function generateMetadata() {
  const t = await getTranslations('seo.coursesAstrology');
  return pageMetadata({ title: t('title'), description: t('description'), path: '/courses/astrology' });
}

export default async function AstrologyCoursesPage() {
  const t = await getTranslations('courses');
  const faqItems = t.raw('astrology.faq.items') as { q: string; a: string }[];
  const relatedItems = t.raw('astrology.relatedCourses.items') as { title: string; body: string; href: string; cta: string }[];

  return (
    <>
      <PageHero eyebrow={t('astrology.eyebrow')} title={t('astrology.title')} subtitle={t('astrology.subtitle')}>
        <nav className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#D1D1D1]" aria-label={t('breadcrumbs.label')}>
          <Link href="/" className="hover:text-brand">{t('breadcrumbs.home')}</Link>
          <span aria-hidden="true">/</span>
          <Link href="/courses" className="hover:text-brand">{t('breadcrumbs.courses')}</Link>
          <span aria-hidden="true">/</span>
          <span className="text-brand">{t('breadcrumbs.astrology')}</span>
        </nav>
      </PageHero>
      <AstrologyLearningSection standalone />
      <Section tinted lazy>
        <div className="rounded-2xl border border-[#2B2B2B] bg-[#111111] p-6 lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-brand">{t('astrology.books.eyebrow')}</p>
            <h2 className="mt-3 text-2xl font-black uppercase text-white">{t('astrology.books.title')}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#D1D1D1]">{t('astrology.books.body')}</p>
          </div>
          <div className="mt-5 shrink-0 lg:mt-0">
            <PrimaryLink href="/marketplace?category=astrology">{t('astrology.books.cta')}</PrimaryLink>
          </div>
        </div>
      </Section>
      <ProductFaqSection eyebrow={t('astrology.faq.eyebrow')} title={t('astrology.faq.title')} items={faqItems} tinted={false} />
      <RelatedServicesSection
        eyebrow={t('astrology.relatedCourses.eyebrow')}
        title={t('astrology.relatedCourses.title')}
        items={relatedItems}
        tinted
      />
      <ExploreSivora exclude={['courses']} />
    </>
  );
}
