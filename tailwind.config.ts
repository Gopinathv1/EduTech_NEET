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
        background: '#03080D',
        surface: '#0A121A',
        surfaceElevated: '#0D1720',
        textPrimary: '#F5F7F8',
        textSecondary: '#AEBBC6',
        primaryRed: {
          DEFAULT: '#ef4444',
          hover: '#dc2626',
          dark: '#991b1b',
          soft: '#2a0d0d',
        },
        accentBlue: {
          DEFAULT: '#087DA8',
          hover: '#007C91',
          soft: '#06283A',
        },
        peacock: {
          blue: '#087DA8',
          teal: '#007C91',
          green: '#008C86',
          gold: '#D2A63C',
          navy: '#050B12',
        },
        border: '#142937',
        brand: {
          DEFAULT: '#007C91',
          dark: '#087DA8',
          light: '#22B8B0',
          soft: '#06283A',
        },
        accent: {
          DEFAULT: '#D2A63C',
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
