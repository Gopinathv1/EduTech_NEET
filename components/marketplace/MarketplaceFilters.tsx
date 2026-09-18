'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { MarketplaceCategory, MarketplaceListing, MarketplaceLevel } from '@/lib/marketplace/catalog';
import styles from '@/components/public/MarketplaceExperience.module.css';

function normalized(value: string) {
  return value.trim().toLowerCase();
}

export default function MarketplaceFilters({
  categories,
  listings,
  initialCategory = 'ALL',
  labels,
}: {
  categories: MarketplaceCategory[];
  listings: MarketplaceListing[];
  initialCategory?: string;
  labels: {
    search: string;
    searchPlaceholder: string;
    category: string;
    condition: string;
    level: string;
    all: string;
    categories: Record<string, string>;
    levels: Record<MarketplaceLevel, string>;
    buy: string;
    soldBy: string;
    delivery: string;
    pickup: string;
    noResults: string;
    noResultsForCategory: string;
  };
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [condition, setCondition] = useState('ALL');
  const [level, setLevel] = useState('ALL');

  const categoryFamilies = useMemo(() => {
    const families = Object.fromEntries(
      categories.map((current) => [current.slug, new Set<string>([current.slug])]),
    ) as Record<string, Set<string>>;

    for (const current of categories) {
      let parent = current.parentSlug;
      while (parent) {
        families[parent]?.add(current.slug);
        parent = categories.find((candidate) => candidate.slug === parent)?.parentSlug;
      }
    }

    return families;
  }, [categories]);

  const categoryOptions = useMemo(
    () => categories.filter((current) => !current.parentSlug),
    [categories],
  );

  const categoryLabels = useMemo(
    () =>
      categories.reduce<Record<string, string>>((acc, current) => {
        acc[current.slug] = labels.categories[current.labelKey] ?? current.slug.replaceAll('-', ' ');
        return acc;
      }, {}),
    [categories, labels.categories],
  );

  const visible = useMemo(() => {
    const q = normalized(query);
    return listings.filter((listing) => {
      const categoryFamily = categoryFamilies[category];
      const matchesQuery =
        !q ||
        normalized(listing.title).includes(q) ||
        normalized(listing.description).includes(q) ||
        normalized(listing.location).includes(q) ||
        normalized(listing.categorySlug).includes(q) ||
        normalized(listing.subcategorySlug ?? '').includes(q);
      const matchesCategory =
        category === 'ALL' ||
        categoryFamily?.has(listing.categorySlug) ||
        categoryFamily?.has(listing.subcategorySlug ?? '');
      const matchesCondition = condition === 'ALL' || listing.condition === condition;
      const matchesLevel = level === 'ALL' || listing.level === level;
      return matchesQuery && matchesCategory && matchesCondition && matchesLevel;
    });
  }, [category, categoryFamilies, condition, level, listings, query]);

  return (
    <div>
      <div className={styles.filters}>
        <label className="block">
          <span className="sr-only">{labels.search}</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={labels.searchPlaceholder}
            className={styles.filterInput}
          />
        </label>
        <label className="block">
          <span className="sr-only">{labels.category}</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={styles.filterInput}
          >
            <option value="ALL">{labels.all}</option>
            {categoryOptions.map((option) => (
              <option key={option.slug} value={option.slug}>
                {categoryLabels[option.slug]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="sr-only">{labels.condition}</span>
          <select
            value={condition}
            onChange={(event) => setCondition(event.target.value)}
            className={styles.filterInput}
          >
            <option value="ALL">{labels.all}</option>
            <option value="NEW">New</option>
            <option value="LIKE_NEW">Like new</option>
            <option value="GOOD">Good</option>
            <option value="FAIR">Fair</option>
          </select>
        </label>
        <label className="block">
          <span className="sr-only">{labels.level}</span>
          <select
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            className={styles.filterInput}
          >
            <option value="ALL">{labels.all}</option>
            <option value="BEGINNER">{labels.levels.BEGINNER}</option>
            <option value="INTERMEDIATE">{labels.levels.INTERMEDIATE}</option>
            <option value="ADVANCED">{labels.levels.ADVANCED}</option>
          </select>
        </label>
      </div>

      {visible.length > 0 ? (
        <div className={styles.productGrid}>
          {visible.map((listing) => (
            <Link
              key={listing.slug}
              href={`/marketplace/${listing.slug}`}
              className={styles.productCard}
            >
              <div className={styles.productVisual}>
                <span>
                  {categoryLabels[listing.subcategorySlug ?? listing.categorySlug] ?? listing.categorySlug.replaceAll('-', ' ')}
                </span>
              </div>
              <div className={styles.productTitleRow}>
                <h3 className={styles.productTitle}>{listing.title}</h3><p className={styles.price}>₹{listing.priceInr.toLocaleString('en-IN')}</p>
              </div>
              <p className={styles.productDescription}>{listing.description}</p>
              <div className={styles.metadata}>
                <span>{listing.condition.replace('_', ' ')}</span><span>{listing.listingType}</span>
                {listing.level ? (
                  <span>{labels.levels[listing.level]}</span>
                ) : null}
                <span>
                  {listing.deliveryAvailable ? labels.delivery : labels.pickup}
                </span>
              </div>
              <p className={styles.seller}>
                {labels.soldBy}: {listing.sellerName}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>
          {category === 'ALL' ? labels.noResults : labels.noResultsForCategory.replace('{category}', categoryLabels[category] ?? category)}
        </p>
      )}
    </div>
  );
}
