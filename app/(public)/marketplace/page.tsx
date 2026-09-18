import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import { PrimaryLink, Section } from '@/components/public/ui';
import MarketplaceFilters from '@/components/marketplace/MarketplaceFilters';
import { MARKETPLACE_CATEGORIES, MARKETPLACE_LISTINGS, getMarketplaceCategory } from '@/lib/marketplace/catalog';
import { ProductFaqSection, RelatedServicesSection } from '@/components/public/ProductPageBlocks';
import MarketplaceProductVisual from '@/components/public/MarketplaceProductVisual';
import styles from '@/components/public/MarketplaceExperience.module.css';

type Props = {
  searchParams?: Promise<{ category?: string }>;
};

export async function generateMetadata() {
  const t = await getTranslations('seo.marketplace');
  return pageMetadata({ title: t('title'), description: t('description'), path: '/marketplace' });
}

export default async function MarketplacePage({ searchParams }: Props) {
  const t = await getTranslations('marketplace');
  const params = await searchParams;
  const requestedCategory =
    params?.category === 'astrology'
      ? 'astrology-traditional-learning'
      : params?.category === 'yoga'
        ? 'yoga-wellness-learning'
        : params?.category;
  const initialCategory = requestedCategory && getMarketplaceCategory(requestedCategory) ? requestedCategory : 'ALL';
  const featuredCategories = MARKETPLACE_CATEGORIES.filter((category) =>
    [
      'exam-preparation-resources',
      'academic-books',
      'ai-technology',
      'astrology-traditional-learning',
      'yoga-wellness-learning',
      'used-books',
      'other-learning-resources',
    ].includes(category.slug),
  );
  const faqItems = t.raw('faq.items') as { q: string; a: string }[];
  const relatedItems = t.raw('related.items') as { title: string; body: string; href: string; cta: string }[];

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <p className={styles.eyebrow}>{t('eyebrow')}</p><h1>{t('heroTitle')}</h1><p className={styles.heroCopy}>{t('heroSubtitle')}</p>
            <div className={styles.actions}>
              <PrimaryLink href="#listings">{t('browseCta')}</PrimaryLink>
              <Link href="/marketplace/sell" className="inline-flex items-center justify-center rounded-md border border-[#d9dee5] px-5 py-3 text-sm font-semibold text-[#10151c] transition hover:border-[#2774e6] hover:text-[#2774e6]">{t('sellCta')}</Link>
            </div>
          </div>
          <MarketplaceProductVisual />
        </div>
      </section>

      <section className={styles.section} aria-label={t('categoriesTitle')}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}><div><p className={styles.sectionEyebrow}>{t('categoryLabel')}</p><h2>{t('categoriesTitle')}</h2></div><p>{t('listingsNote')}</p></div>
          <div className={styles.discovery}>
            {featuredCategories.map((category) => (
              <Link key={category.slug} href={`/marketplace?category=${category.slug}`} className={styles.discoveryRow}>
                <span>{String(featuredCategories.indexOf(category) + 1).padStart(2, '0')}</span><h3>{t(`categories.${category.labelKey}`)}</h3><p>{t('categoryLabel')}</p><b>↗</b>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="listings" className={`${styles.section} ${styles.sectionTint}`}><div className={styles.sectionInner}>
        <div className={styles.sectionHead}><div><p className={styles.sectionEyebrow}>{t('listingsEyebrow')}</p><h2>{t('listingsTitle')}</h2></div><p>{t('listingsNote')}</p></div>
        <MarketplaceFilters
          categories={MARKETPLACE_CATEGORIES}
          listings={MARKETPLACE_LISTINGS}
          initialCategory={initialCategory}
          labels={{
            search: t('search'),
            searchPlaceholder: t('searchPlaceholder'),
            category: t('postForm.category'),
            condition: t('condition'),
            level: t('level'),
            all: t('all'),
            categories: t.raw('categories') as Record<string, string>,
            levels: t.raw('levels') as Record<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED', string>,
            buy: t('buy'),
            soldBy: t('soldBy'),
            delivery: t('delivery'),
            pickup: t('pickup'),
            noResults: t('noResults'),
            noResultsForCategory: t.raw('noResultsForCategory') as string,
          }}
        />
      </div></section>

      <section className={styles.section}><div className={styles.sectionInner}><div className={styles.supportGrid}>
        <article className={styles.supportCard}><p className={styles.sectionEyebrow}>{t('astrologyLink.eyebrow')}</p><h3>{t('astrologyLink.title')}</h3><p>{t('astrologyLink.body')}</p><div className={styles.actions}><PrimaryLink href="/courses/astrology">{t('astrologyLink.cta')}</PrimaryLink></div></article>
        <article className={styles.supportCard}><p className={styles.sectionEyebrow}>{t('usedNew.eyebrow')}</p><h3>{t('usedNew.title')}</h3><p>{t('usedNew.body')}</p></article>
        <article className={styles.supportCard}><p className={styles.sectionEyebrow}>{t('seller.eyebrow')}</p><h3>{t('seller.title')}</h3><p>{t('seller.body')}</p><div className={styles.actions}><PrimaryLink href="/marketplace/sell">{t('seller.cta')}</PrimaryLink></div></article>
      </div></div></section>

      <ProductFaqSection eyebrow={t('faq.eyebrow')} title={t('faq.title')} items={faqItems} tinted={false} />

      <RelatedServicesSection
        eyebrow={t('related.eyebrow')}
        title={t('related.title')}
        items={relatedItems}
        tinted
      />
    </div>
  );
}
