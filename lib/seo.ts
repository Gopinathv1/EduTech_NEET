import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from '@/lib/public/site';

/**
 * Build per-page Metadata (title, description, canonical, Open Graph, Twitter).
 * Titles passed in already include the brand, so OG/Twitter stay consistent.
 */
export function pageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
}: {
  /** Short page title (e.g. "About Us"); the root layout appends "· <brand>". */
  title: string;
  description: string;
  path: string;
  /** Set true when `title` is already the full <title> (used for the home page). */
  absoluteTitle?: boolean;
}): Metadata {
  const url = path === '/' ? SITE_URL : `${SITE_URL}${path}`;
  // OG/Twitter titles are not run through the root template, so compose the
  // brand ourselves for consistency.
  const socialTitle = absoluteTitle ? title : `${title} · ${SITE_NAME}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: socialTitle,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      images: [{ url: '/og.svg', width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: ['/og.svg'],
    },
  };
}
