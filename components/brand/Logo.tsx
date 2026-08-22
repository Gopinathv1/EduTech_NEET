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
  label = 'SIVORA UPRISING Trishul logo',
  size = 'default',
}: BrandLogoProps) {
  const imageClass = size === 'compact' ? 'h-9 max-w-[8.5rem] sm:h-10' : 'h-10 max-w-[10rem] sm:h-12 sm:max-w-[12rem]';
  const textClass = size === 'compact' ? 'text-xs sm:text-sm' : 'text-sm sm:text-base';

  return (
    <Link href={href} className={`flex shrink-0 items-center gap-2 text-textPrimary ${className}`} aria-label={label}>
      <img
        src="/sivora-logo.png"
        alt="SIVORA UPRISING Trishul logo"
        className={`${imageClass} w-auto object-contain object-left`}
      />
      <span className={`font-black uppercase tracking-[0.14em] text-white ${textClass}`}>UPRISING</span>
    </Link>
  );
}
