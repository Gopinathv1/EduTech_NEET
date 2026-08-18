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
        background: '#FFF9F2',
        surface: '#FFFFFF',
        surfaceElevated: '#FFF9F2',
        textPrimary: '#172033',
        textSecondary: '#64748B',
        primaryRed: {
          DEFAULT: '#ef4444',
          hover: '#dc2626',
          dark: '#991b1b',
          soft: '#2a0d0d',
        },
        accentBlue: {
          DEFAULT: '#1261A0',
          hover: '#0B1736',
          soft: '#EAF3FA',
        },
        peacock: {
          blue: '#1261A0',
          teal: '#0F9D9A',
          green: '#087F5B',
          gold: '#F6A623',
          navy: '#0B1736',
        },
        border: '#E8DCCB',
        brand: {
          DEFAULT: '#087F5B',
          dark: '#075F45',
          light: '#0F9D9A',
          soft: '#E8F7F3',
        },
        accent: {
          DEFAULT: '#F6A623',
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
