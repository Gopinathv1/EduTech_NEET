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
        background: '#020608',
        surface: '#081117',
        surfaceElevated: '#0B141B',
        textPrimary: '#F6F7F8',
        textSecondary: '#AAB3BA',
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
          navy: '#04090D',
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
