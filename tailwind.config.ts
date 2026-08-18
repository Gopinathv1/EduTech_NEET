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
        background: '#050505',
        surface: '#0B0B0B',
        surfaceElevated: '#111111',
        textPrimary: '#FFFFFF',
        textSecondary: '#D1D1D1',
        primaryRed: {
          DEFAULT: '#D71920',
          hover: '#FF2B32',
          dark: '#991B1B',
          soft: '#2A0D0D',
        },
        accentBlue: {
          DEFAULT: '#D71920',
          hover: '#FF2B32',
          soft: '#2A0D0D',
        },
        peacock: {
          blue: '#1261A0',
          teal: '#0F9D9A',
          green: '#087F5B',
          gold: '#F6A623',
          navy: '#0B1736',
        },
        border: '#2B2B2B',
        brand: {
          DEFAULT: '#D71920',
          dark: '#991B1B',
          light: '#FF2B32',
          soft: '#2A0D0D',
        },
        accent: {
          DEFAULT: '#FF2B32',
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
