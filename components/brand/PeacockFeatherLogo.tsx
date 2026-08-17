import type { SVGProps } from 'react';

type Props = SVGProps<SVGSVGElement> & {
  decorative?: boolean;
};

export default function PeacockFeatherLogo({ decorative = true, className = '', ...props }: Props) {
  return (
    <svg
      viewBox="0 0 64 96"
      fill="none"
      className={className}
      aria-hidden={decorative}
      role={decorative ? undefined : 'img'}
      {...props}
    >
      <path
        d="M15 90C34 62 48 32 50 6"
        stroke="url(#featherStem)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M28 63C15 58 8 48 7 37c13 2 24 11 31 25"
        stroke="#a87330"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.82"
      />
      <path
        d="M36 56C22 47 15 34 17 20c13 7 21 18 26 34"
        stroke="#d7a94d"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.86"
      />
      <path
        d="M42 48C31 34 30 20 39 8c8 13 9 26 6 39"
        stroke="#b8863b"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.82"
      />
      <path
        d="M33 61C24 52 22 41 27 30c9 8 13 18 12 30"
        fill="url(#featherWash)"
        opacity="0.3"
      />
      <ellipse cx="35.5" cy="31" rx="14" ry="18.5" transform="rotate(18 35.5 31)" fill="#0b1110" />
      <ellipse
        cx="35.5"
        cy="31"
        rx="12.2"
        ry="16"
        transform="rotate(18 35.5 31)"
        stroke="url(#eyeGold)"
        strokeWidth="3"
      />
      <ellipse
        cx="35.5"
        cy="31"
        rx="7.5"
        ry="10"
        transform="rotate(18 35.5 31)"
        fill="url(#eyeTeal)"
      />
      <ellipse cx="35.5" cy="31" rx="3.2" ry="4.2" transform="rotate(18 35.5 31)" fill="#0b2740" />
      <path
        d="M29 33c3 2 8 2 12-1"
        stroke="#79e4cf"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.75"
      />
      <defs>
        <linearGradient id="featherStem" x1="15" y1="90" x2="53" y2="8" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7a4b1c" />
          <stop offset="0.52" stopColor="#d7a94d" />
          <stop offset="1" stopColor="#f0d28a" />
        </linearGradient>
        <linearGradient id="eyeGold" x1="24" y1="18" x2="47" y2="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f2d486" />
          <stop offset="0.55" stopColor="#b8792f" />
          <stop offset="1" stopColor="#6f4218" />
        </linearGradient>
        <radialGradient id="eyeTeal" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(35 30) rotate(90) scale(12 9)">
          <stop stopColor="#4df1d2" />
          <stop offset="0.55" stopColor="#0b8f8d" />
          <stop offset="1" stopColor="#14543a" />
        </radialGradient>
        <linearGradient id="featherWash" x1="18" y1="25" x2="42" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#d7a94d" />
          <stop offset="1" stopColor="#5c3514" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
