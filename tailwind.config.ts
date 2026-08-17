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
        background: '#080808',
        surface: '#111111',
        surfaceElevated: '#181818',
        textPrimary: '#f8fafc',
        textSecondary: '#cbd5e1',
        primaryRed: {
          DEFAULT: '#ef4444',
          hover: '#dc2626',
          dark: '#991b1b',
          soft: '#2a0d0d',
        },
        accentBlue: {
          DEFAULT: '#38bdf8',
          hover: '#0ea5e9',
          soft: '#082f49',
        },
        border: '#2a2a2a',
        brand: {
          DEFAULT: '#ef4444',
          dark: '#dc2626',
          light: '#f87171',
          soft: '#2a0d0d',
        },
        accent: {
          DEFAULT: '#38bdf8',
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
