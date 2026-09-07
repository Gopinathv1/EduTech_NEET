import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import { PrimaryLink, Section } from '@/components/public/ui';
import MarketplaceFilters from '@/components/marketplace/MarketplaceFilters';
import { MARKETPLACE_CATEGORIES, MARKETPLACE_LISTINGS, getMarketplaceCategory } from '@/lib/marketplace/catalog';

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
  const requestedCategory = params?.category;
  const initialCategory = requestedCategory && getMarketplaceCategory(requestedCategory) ? requestedCategory : 'ALL';
  const featuredCategories = MARKETPLACE_CATEGORIES.filter((category) =>
    ['books', 'exam-preparation-books', 'study-materials', 'reference-books', 'medical-books', 'engineering-books'].includes(category.slug),
  );

  return (
    <>
      <section className="relative -mt-[73px] overflow-hidden border-b border-[#2B2B2B] bg-[#050505] pt-[73px]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#050505_0%,#151515_52%,#050505_100%)]" />
        <div className="relative mx-auto grid min-h-[calc(100vh-73px)] w-full max-w-[1600px] gap-10 px-[clamp(1rem,3vw,3rem)] py-16 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:py-24">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('eyebrow')}</p>
            <h1 className="mt-5 text-[clamp(3rem,7vw,7.8rem)] font-black uppercase leading-[0.9] text-white">
              {t('heroTitle')}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#D1D1D1]">{t('heroSubtitle')}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PrimaryLink href="#listings">{t('browseCta')}</PrimaryLink>
              <Link
                href="/marketplace/sell"
                className="inline-flex items-center justify-center rounded-lg border border-[#2B2B2B] bg-[#111111] px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:border-brand/45"
              >
                {t('sellCta')}
              </Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2" aria-label={t('categoriesTitle')}>
            {featuredCategories.map((category) => (
              <div key={category.slug} className="rounded-2xl border border-[#2B2B2B] bg-[#111111]/86 p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">{t('categoryLabel')}</p>
                <h2 className="mt-3 text-lg font-black uppercase leading-tight text-white">
                  {t(`categories.${category.labelKey}`)}
                </h2>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Section id="listings">
        <div className="mb-8 grid gap-4 lg:grid-cols-[0.74fr_1.26fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('listingsEyebrow')}</p>
            <h2 className="mt-5 text-[clamp(2.4rem,5vw,5rem)] font-black uppercase leading-[0.92] text-white">
              {t('listingsTitle')}
            </h2>
          </div>
          <p className="text-sm leading-7 text-[#D1D1D1]">{t('listingsNote')}</p>
        </div>
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
          }}
        />
      </Section>

      <Section tinted lazy>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#2B2B2B] bg-[#111111] p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">{t('usedNew.eyebrow')}</p>
            <h2 className="mt-3 text-2xl font-black uppercase text-white">{t('usedNew.title')}</h2>
            <p className="mt-4 text-sm leading-7 text-[#D1D1D1]">{t('usedNew.body')}</p>
          </div>
          <div className="rounded-2xl border border-[#2B2B2B] bg-[#111111] p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">{t('seller.eyebrow')}</p>
            <h2 className="mt-3 text-2xl font-black uppercase text-white">{t('seller.title')}</h2>
            <p className="mt-4 text-sm leading-7 text-[#D1D1D1]">{t('seller.body')}</p>
            <div className="mt-5">
              <PrimaryLink href="/marketplace/sell">{t('seller.cta')}</PrimaryLink>
            </div>
          </div>
          <div className="rounded-2xl border border-[#2B2B2B] bg-[#111111] p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">{t('safety.eyebrow')}</p>
            <h2 className="mt-3 text-2xl font-black uppercase text-white">{t('safety.title')}</h2>
            <p className="mt-4 text-sm leading-7 text-[#D1D1D1]">{t('safety.body')}</p>
          </div>
        </div>
      </Section>
    </>
  );
}
