import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import { PrimaryLink, Section } from '@/components/public/ui';
import { MARKETPLACE_CATEGORIES, getMarketplaceCategory } from '@/lib/marketplace/catalog';
import styles from '@/components/public/MarketplaceExperience.module.css';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() { return MARKETPLACE_CATEGORIES.map((category) => ({ slug: category.slug })); }

export async function generateMetadata({ params }: Props) {
  const category = getMarketplaceCategory((await params).slug);
  if (!category) return {};
  const t = await getTranslations('seo.marketplaceDetail');
  return pageMetadata({ title: t('title', { title: category.title }), description: t('description'), path: `/marketplace/${category.slug}` });
}

export default async function MarketplaceCategoryPage({ params }: Props) {
  const category = getMarketplaceCategory((await params).slug);
  if (!category) notFound();
  const status = category.state === 'COMING_LATER' ? 'Coming later' : 'Currently unavailable · Marketplace launching soon';
  return <div className={styles.page}><Section className="!border-0 !bg-transparent"><div className={styles.detailHero}><div className={styles.detailVisual}><div><p>{category.group} CATEGORY</p><h1>{category.title}</h1></div></div><div><p className={styles.eyebrow}>CATEGORY PREVIEW</p><h2 className={styles.detailPrice}>{category.state === 'COMING_LATER' ? 'Coming later' : 'Coming soon'}</h2><p className={styles.detailCopy}>This is a SIVORA Marketplace category preview. Inventory, listings, pricing, seller details and purchasing are not available in this phase.</p><p className={styles.notice}>{status}</p><div className="mt-6"><PrimaryLink href="/marketplace">Back to Marketplace</PrimaryLink></div></div></div></Section></div>;
}
