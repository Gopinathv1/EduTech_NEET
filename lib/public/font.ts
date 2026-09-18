import localFont from 'next/font/local';

// Geist is distributed with the installed Next.js package under the SIL OFL.
// Load locally so previews and builds do not depend on a font CDN.
export const publicFont = localFont({
  src: '../../node_modules/next/dist/next-devtools/server/font/geist-latin.woff2',
  display: 'swap',
  weight: '100 900',
  fallback: ['Arial', 'sans-serif'],
});
