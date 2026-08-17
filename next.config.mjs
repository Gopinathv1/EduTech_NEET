import createNextIntlPlugin from 'next-intl/plugin';

// Point the plugin at our request config (cookie-based locale resolution).
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Content-Security-Policy.
 * - Razorpay Checkout injects a script from checkout.razorpay.com and opens an
 *   iframe from api.razorpay.com, so both are allowlisted (script-src/frame-src)
 *   and *.razorpay.com is allowed for connect-src (its analytics/API calls).
 * - `'unsafe-inline'` is required for Next's inline bootstrap + Tailwind's inline
 *   styles + Razorpay; upgrading to nonce-based CSP is documented in
 *   DEPLOYMENT.md (needs a middleware nonce on every route).
 * - Dev adds `'unsafe-eval'` and ws: for React Fast Refresh / HMR.
 * If Sentry is enabled, route its events through the same-origin `tunnel`
 * option (see DEPLOYMENT.md) so connect-src does not need the ingest host.
 */
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ''} https://checkout.razorpay.com`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: https:`,
  `font-src 'self' data:`,
  `connect-src 'self' https://*.razorpay.com ${isDev ? 'ws: wss:' : ''}`,
  `frame-src https://api.razorpay.com https://checkout.razorpay.com`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `object-src 'none'`,
  `${isDev ? '' : 'upgrade-insecure-requests'}`,
]
  .filter((d) => d.trim() !== '')
  .join('; ')
  .replace(/\s+/g, ' ')
  .trim();

// Security response headers applied to every route.
const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  // HSTS: ignored by browsers over plain http (dev), enforced over https (prod).
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  reactStrictMode: true,
  // pdfkit reads its bundled font-metric (.afm) files at runtime, so keep it as
  // an external (unbundled) server dependency for the invoice PDF route.
  serverExternalPackages: ['pdfkit'],
  // Tree-shake barrel imports so only the used recharts/icon modules ship —
  // smaller JS on the low-bandwidth connections this platform targets.
  experimental: {
    optimizePackageImports: ['recharts'],
  },
  // Linting is run explicitly via `npm run lint`; keep production builds
  // from being blocked while the codebase is still being scaffolded.
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // We ship lightweight local SVG illustrations (no stock-photo clutter).
    // Allow the optimizer to serve them, sandboxed so they can't run scripts.
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default withNextIntl(nextConfig);
