import type { SVGProps } from 'react';

type Props = SVGProps<SVGSVGElement> & {
  decorative?: boolean;
};

export default function PeacockFeather({ decorative = true, className = '', ...props }: Props) {
  return (
    <svg
      viewBox="0 0 72 118"
      fill="none"
      className={className}
      aria-hidden={decorative}
      role={decorative ? undefined : 'img'}
      {...props}
    >
      <path d="M18 111C34 77 47 42 51 7" stroke="url(#pf-stem)" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M20 100C33 82 42 60 49 31" stroke="#f0d28a" strokeWidth="0.85" strokeLinecap="round" opacity="0.78" />
      <path d="M26 82C14 75 8 63 8 49c15 4 27 15 36 33" stroke="#9a6528" strokeWidth="1.15" strokeLinecap="round" opacity="0.72" />
      <path d="M31 72C18 60 15 43 22 27c13 11 21 25 24 43" stroke="#c5903a" strokeWidth="1.15" strokeLinecap="round" opacity="0.78" />
      <path d="M39 63C30 45 32 27 45 10c8 17 8 34 1 52" stroke="#e5b960" strokeWidth="1.15" strokeLinecap="round" opacity="0.82" />
      <path d="M48 66C59 51 62 35 57 20c-8 12-12 27-12 45" stroke="#8a561f" strokeWidth="1.05" strokeLinecap="round" opacity="0.58" />
      <path d="M23 93c8-13 17-34 22-60" stroke="#5d3919" strokeWidth="0.75" strokeLinecap="round" opacity="0.65" />
      <path d="M15 58c12 3 22 11 30 24M25 34c10 9 17 20 20 34M56 27c-5 11-8 24-10 39" stroke="#f5d990" strokeWidth="0.55" strokeLinecap="round" opacity="0.54" />
      <ellipse cx="43.5" cy="35" rx="15.5" ry="21" transform="rotate(16 43.5 35)" fill="#070b0a" opacity="0.96" />
      <ellipse cx="43.5" cy="35" rx="13.1" ry="18" transform="rotate(16 43.5 35)" stroke="url(#pf-eye-gold)" strokeWidth="2.6" />
      <ellipse cx="43.5" cy="35" rx="8.2" ry="11.2" transform="rotate(16 43.5 35)" fill="url(#pf-eye-teal)" />
      <ellipse cx="43.5" cy="35" rx="3.6" ry="5" transform="rotate(16 43.5 35)" fill="#08243b" />
      <path d="M36.5 37c4.2 2.4 9.4 2 14-1.1" stroke="#86ead8" strokeWidth="1.05" strokeLinecap="round" opacity="0.68" />
      <defs>
        <linearGradient id="pf-stem" x1="18" y1="111" x2="54" y2="8" gradientUnits="userSpaceOnUse">
          <stop stopColor="#674017" />
          <stop offset="0.48" stopColor="#d2a14a" />
          <stop offset="1" stopColor="#ffe2a0" />
        </linearGradient>
        <linearGradient id="pf-eye-gold" x1="30" y1="16" x2="58" y2="55" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffe6a3" />
          <stop offset="0.45" stopColor="#bd8131" />
          <stop offset="1" stopColor="#5b3312" />
        </linearGradient>
        <radialGradient id="pf-eye-teal" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(43 34) rotate(90) scale(12.5 9)">
          <stop stopColor="#63f3d7" />
          <stop offset="0.54" stopColor="#0f918d" />
          <stop offset="1" stopColor="#125137" />
        </radialGradient>
      </defs>
    </svg>
  );
}
