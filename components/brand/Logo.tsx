import Link from 'next/link';

type BrandLogoProps = {
  className?: string;
  href?: string;
  label?: string;
  size?: 'default' | 'compact';
};

export default function BrandLogo({
  className = '',
  href = '/',
  label = 'SIVORA UP↑RISING Trishul logo',
  size = 'default',
}: BrandLogoProps) {
  const imageClass = size === 'compact' ? 'h-9 max-w-[8.5rem] sm:h-10' : 'h-10 max-w-[10rem] sm:h-12 sm:max-w-[12rem]';
  const textClass = size === 'compact' ? 'text-xs sm:text-sm' : 'text-sm sm:text-base';

  return (
    <Link href={href} className={`flex shrink-0 items-center gap-2 text-textPrimary ${className}`} aria-label={label}>
      <img
        src="/sivora-logo.png"
        alt="SIVORA UP↑RISING Trishul logo"
        className={`${imageClass} w-auto object-contain object-left`}
      />
      <span className={`inline-flex items-center gap-0.5 font-black uppercase tracking-[0.14em] text-white ${textClass}`}>
        <span>UP</span>
        <svg viewBox="0 0 12 18" className="h-[1.1em] w-[0.8em] text-[#f0c878]" fill="none" aria-hidden="true">
          <path d="M6 16V3.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M2.2 7.2 6 3.2l3.8 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>RISING</span>
      </span>
    </Link>
  );
}
