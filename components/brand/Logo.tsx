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
  label = 'SIVORA Trishul logo',
  size = 'default',
}: BrandLogoProps) {
  const imageClass = size === 'compact' ? 'h-9 max-w-[8.5rem] sm:h-10' : 'h-10 max-w-[10rem] sm:h-12 sm:max-w-[12rem]';

  return (
    <Link href={href} className={`flex shrink-0 items-center text-textPrimary ${className}`} aria-label={label}>
      <img
        src="/sivora-logo.png"
        alt="SIVORA Trishul logo"
        className={`${imageClass} w-auto object-contain object-left`}
      />
    </Link>
  );
}
