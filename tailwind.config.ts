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
        background: '#050B12',
        surface: '#07121A',
        surfaceElevated: '#0B1722',
        textPrimary: '#f8fafc',
        textSecondary: '#c8d3de',
        primaryRed: {
          DEFAULT: '#ef4444',
          hover: '#dc2626',
          dark: '#991b1b',
          soft: '#2a0d0d',
        },
        accentBlue: {
          DEFAULT: '#0B5FA5',
          hover: '#007C91',
          soft: '#06283A',
        },
        peacock: {
          blue: '#0B5FA5',
          teal: '#007C91',
          green: '#0F8F7D',
          gold: '#D4A53A',
          navy: '#07121A',
        },
        border: '#183040',
        brand: {
          DEFAULT: '#007C91',
          dark: '#0B5FA5',
          light: '#22B8B0',
          soft: '#06283A',
        },
        accent: {
          DEFAULT: '#D4A53A',
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
