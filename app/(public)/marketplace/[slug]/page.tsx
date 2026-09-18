import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import { PrimaryLink, Section } from '@/components/public/ui';
import { MARKETPLACE_LISTINGS, getMarketplaceListing } from '@/lib/marketplace/catalog';
import styles from '@/components/public/MarketplaceExperience.module.css';

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return MARKETPLACE_LISTINGS.map((listing) => ({ slug: listing.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const listing = getMarketplaceListing(slug);
  if (!listing) return {};
  const t = await getTranslations('seo.marketplaceDetail');
  return pageMetadata({
    title: t('title', { title: listing.title }),
    description: t('description'),
    path: `/marketplace/${listing.slug}`,
  });
}

export default async function MarketplaceDetailPage({ params }: Props) {
  const { slug } = await params;
  const listing = getMarketplaceListing(slug);
  if (!listing) notFound();
  const t = await getTranslations('marketplace');

  return (
    <div className={styles.page}><Section className="!border-0 !bg-transparent">
        <div className={styles.detailHero}>
          <div className={styles.detailVisual}>
            <div>
              <p>{listing.categorySlug.replaceAll('-', ' ')}</p><h1>{listing.title}</h1>
            </div>
          </div>
          <div>
            <p className={styles.eyebrow}>{t('detailEyebrow')}</p><h2 className={styles.detailPrice}>₹{listing.priceInr.toLocaleString('en-IN')}</h2><p className={styles.detailCopy}>{listing.description}</p>
            <dl className={styles.detailInfo}>
              <Info label={t('condition')} value={listing.condition.replace('_', ' ')} />
              <Info label={t('listingType')} value={listing.listingType} />
              <Info label={t('soldBy')} value={listing.sellerName} />
              <Info label={t('location')} value={listing.location} />
              <Info label={t('delivery')} value={listing.deliveryAvailable ? t('delivery') : t('pickup')} />
              <Info label={t('stock')} value={String(listing.stock)} />
              <Info label={t('author')} value={listing.author ?? t('notApplicable')} />
              <Info label={t('publisher')} value={listing.publisher ?? t('notApplicable')} />
            </dl>
            <p className={styles.notice}>
              {t('checkoutPending')}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <PrimaryLink href="/marketplace">{t('backToMarketplace')}</PrimaryLink>
              <Link href="/contact" className="inline-flex items-center justify-center rounded-md border border-[#d9dee5] px-5 py-3 text-sm font-semibold text-[#10151c] transition hover:border-[#2774e6] hover:text-[#2774e6]">
                {t('askSeller')}
              </Link>
            </div>
          </div>
        </div>
      </Section></div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div><dt>{label}</dt><dd>{value}</dd>
    </div>
  );
}
