import type { Config } from 'tailwindcss';

/**
 * Mobile-first Tailwind config.
 * Default (unprefixed) utilities target the smallest screens; layer larger
 * breakpoints on with sm:/md:/lg: as needed.
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Single trustworthy primary: deep blue. One colour used throughout the
        // education brand; amber accent reserved for the ₹30 value cue.
        brand: {
          DEFAULT: '#1e40af', // blue-800
          dark: '#1e3a8a', // blue-900
          light: '#3b82f6', // blue-500
          soft: '#eff6ff', // blue-50 (tint backgrounds)
        },
        accent: {
          DEFAULT: '#f59e0b', // amber-500 (affordable / value cues)
        },
      },
      fontFamily: {
        // System font stack keeps the first paint fast on low-bandwidth
        // rural connections; Tamil glyphs fall back to installed Tamil fonts.
        sans: [
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Noto Sans',
          'Noto Sans Tamil',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

export default config;
