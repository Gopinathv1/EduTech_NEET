import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import { PrimaryLink, Section } from '@/components/public/ui';
import { MARKETPLACE_LISTINGS, getMarketplaceListing } from '@/lib/marketplace/catalog';

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
    <>
      <Section>
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-[#2B2B2B] bg-[linear-gradient(135deg,#111111,#050505)] p-8 text-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-brand">{listing.categorySlug.replaceAll('-', ' ')}</p>
              <h1 className="mt-4 text-4xl font-black uppercase leading-tight text-white sm:text-6xl">{listing.title}</h1>
            </div>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-brand">{t('detailEyebrow')}</p>
            <h2 className="mt-4 text-3xl font-black uppercase text-white sm:text-5xl">₹{listing.priceInr.toLocaleString('en-IN')}</h2>
            <p className="mt-5 text-base leading-8 text-[#D1D1D1]">{listing.description}</p>
            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              <Info label={t('condition')} value={listing.condition.replace('_', ' ')} />
              <Info label={t('listingType')} value={listing.listingType} />
              <Info label={t('soldBy')} value={listing.sellerName} />
              <Info label={t('location')} value={listing.location} />
              <Info label={t('delivery')} value={listing.deliveryAvailable ? t('delivery') : t('pickup')} />
              <Info label={t('stock')} value={String(listing.stock)} />
              <Info label={t('author')} value={listing.author ?? t('notApplicable')} />
              <Info label={t('publisher')} value={listing.publisher ?? t('notApplicable')} />
            </dl>
            <p className="mt-6 rounded-2xl border border-[#2B2B2B] bg-[#111111] p-4 text-sm leading-7 text-[#D1D1D1]">
              {t('checkoutPending')}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <PrimaryLink href="/marketplace">{t('backToMarketplace')}</PrimaryLink>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-lg border border-[#2B2B2B] bg-[#111111] px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:border-brand/45"
              >
                {t('askSeller')}
              </Link>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#2B2B2B] bg-[#111111] p-4">
      <dt className="text-xs font-black uppercase tracking-[0.16em] text-brand">{label}</dt>
      <dd className="mt-2 text-sm font-bold leading-6 text-white">{value}</dd>
    </div>
  );
}
