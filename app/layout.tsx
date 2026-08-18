import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { SITE_NAME, SITE_URL } from '@/lib/public/site';
import { getA11yPrefs } from '@/lib/a11y';
import SkipLink from '@/components/a11y/SkipLink';
import SentryInit from '@/components/observability/SentryInit';
import WhatsAppFloatingButton from '@/components/contact/WhatsAppFloatingButton';
import './globals.css';

// Root metadata is localised from the active locale's message file.
// `metadataBase` makes per-page relative OG image URLs (/og.svg) absolute.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t('title'), template: `%s · ${SITE_NAME}` },
    description: t('description'),
    openGraph: {
      siteName: SITE_NAME,
      type: 'website',
      images: [{ url: '/og.svg', width: 1200, height: 630, alt: SITE_NAME }],
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  // Accessibility preferences are stamped on <html> server-side so the chosen
  // font size / contrast theme is already in the first paint (no flash).
  const { fontScale, contrast } = await getA11yPrefs();

  return (
    // suppressHydrationWarning: browser extensions (e.g. Bitdefender, Grammarly)
    // inject attributes into <html>/<body> before React hydrates, which would
    // otherwise trigger a false hydration-mismatch warning. This suppresses only
    // these top-level nodes' attributes, not real mismatches deeper in the tree.
    <html
      lang={locale}
      data-font-scale={fontScale}
      data-contrast={contrast}
      suppressHydrationWarning
    >
      <body
        suppressHydrationWarning
        className="min-h-screen bg-background font-sans text-textPrimary antialiased"
      >
        <NextIntlClientProvider messages={messages}>
          <SentryInit />
          <SkipLink />
          {children}
          <WhatsAppFloatingButton />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
