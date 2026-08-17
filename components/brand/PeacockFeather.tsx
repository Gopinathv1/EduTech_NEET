import type { SVGProps } from 'react';

type Props = SVGProps<SVGSVGElement> & {
  decorative?: boolean;
};

export default function PeacockFeather({ decorative = true, className = '', ...props }: Props) {
  return (
    <svg
      viewBox="0 0 56 128"
      fill="none"
      className={className}
      aria-hidden={decorative}
      role={decorative ? undefined : 'img'}
      {...props}
    >
      <path d="M12 119C24 86 35 48 43 9" stroke="url(#pf-stem)" strokeWidth="2.05" strokeLinecap="round" />
      <path d="M15 111C26 82 36 48 42 17" stroke="#ffe1a1" strokeWidth="0.65" strokeLinecap="round" opacity="0.72" />

      <path d="M22 91C12 84 8 72 10 58c12 5 21 16 28 30" stroke="#b47a2d" strokeWidth="0.95" strokeLinecap="round" opacity="0.7" />
      <path d="M25 81C14 69 13 53 19 39c11 11 17 25 19 41" stroke="#d9ad55" strokeWidth="0.95" strokeLinecap="round" opacity="0.78" />
      <path d="M31 72C23 55 25 35 39 14c6 19 5 38-2 57" stroke="#f2cc76" strokeWidth="1" strokeLinecap="round" opacity="0.88" />
      <path d="M38 75C49 58 52 40 48 24c-8 13-12 29-12 49" stroke="#9a6426" strokeWidth="0.9" strokeLinecap="round" opacity="0.68" />
      <path d="M13 66c9 4 17 12 25 23M19 43c9 9 15 22 18 37M48 32c-5 12-8 26-10 41" stroke="#f8dd96" strokeWidth="0.45" strokeLinecap="round" opacity="0.52" />
      <path d="M16 102c8-15 17-40 23-74" stroke="#6a431c" strokeWidth="0.55" strokeLinecap="round" opacity="0.58" />

      <ellipse cx="39" cy="34" rx="12.2" ry="17.2" transform="rotate(14 39 34)" fill="#070b0a" opacity="0.96" />
      <ellipse cx="39" cy="34" rx="10.4" ry="14.7" transform="rotate(14 39 34)" stroke="url(#pf-eye-gold)" strokeWidth="2.25" />
      <ellipse cx="39" cy="34" rx="6.5" ry="9.2" transform="rotate(14 39 34)" fill="url(#pf-eye-teal)" />
      <ellipse cx="39" cy="34" rx="2.85" ry="4.05" transform="rotate(14 39 34)" fill="#08284d" />
      <circle cx="37" cy="30" r="1.2" fill="#c8fff2" opacity="0.88" />
      <path d="M33.4 36.2c3.4 1.9 7.4 1.5 10.9-1" stroke="#8ef2dd" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />
      <defs>
        <linearGradient id="pf-stem" x1="12" y1="119" x2="43" y2="9" gradientUnits="userSpaceOnUse">
          <stop stopColor="#674017" />
          <stop offset="0.48" stopColor="#d2a14a" />
          <stop offset="1" stopColor="#ffe2a0" />
        </linearGradient>
        <linearGradient id="pf-eye-gold" x1="29" y1="19" x2="49" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffe6a3" />
          <stop offset="0.45" stopColor="#bd8131" />
          <stop offset="1" stopColor="#5b3312" />
        </linearGradient>
        <radialGradient id="pf-eye-teal" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(38.8 33.5) rotate(90) scale(10.3 7.3)">
          <stop stopColor="#63f3d7" />
          <stop offset="0.54" stopColor="#0f918d" />
          <stop offset="1" stopColor="#125137" />
        </radialGradient>
      </defs>
    </svg>
  );
}
