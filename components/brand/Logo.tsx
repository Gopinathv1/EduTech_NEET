import Image from 'next/image';
import Link from 'next/link';

type BrandLogoProps = {
  className?: string;
  label?: string;
  size?: 'default' | 'compact' | 'footer';
  showTagline?: boolean;
};

export default function BrandLogo({
  className = '',
  label = 'SIVORA UP↑RISING home',
  size = 'default',
  showTagline = false,
}: BrandLogoProps) {
  const logoClass =
    size === 'compact'
      ? 'h-11 w-11 sm:h-12 sm:w-12 lg:h-[58px] lg:w-[58px]'
      : size === 'footer'
        ? 'h-16 w-16 sm:h-[72px] sm:w-[72px]'
        : 'h-12 w-12 sm:h-14 sm:w-14 lg:h-[68px] lg:w-[68px]';

  const nameClass =
    size === 'compact'
      ? 'text-[1.15rem] sm:text-[1.3rem] lg:text-[1.45rem]'
      : size === 'footer'
        ? 'text-[1.65rem] sm:text-[1.9rem]'
        : 'text-[1.35rem] sm:text-[1.55rem] lg:text-[1.8rem]';

  const uprisingClass =
    size === 'compact'
      ? 'text-[0.62rem] sm:text-[0.68rem] lg:text-[0.76rem]'
      : size === 'footer'
        ? 'text-[0.82rem] sm:text-[0.92rem]'
        : 'text-[0.68rem] sm:text-[0.76rem] lg:text-[0.86rem]';

  return (
    <Link href="/" className={`flex shrink-0 items-center gap-3 text-textPrimary ${className}`} aria-label={label}>
      <span className={`relative block shrink-0 ${logoClass}`}>
        <Image
          src="/branding/sivora-su-logo.png"
          alt=""
          width={1024}
          height={1024}
          priority
          className="h-full w-full object-contain object-center [filter:brightness(1.06)_contrast(1.04)_drop-shadow(0_0_7px_rgba(246,166,35,0.22))]"
        />
      </span>
      <span className="flex min-w-0 flex-col justify-center leading-none">
        <span className={`${nameClass} font-black uppercase tracking-[0.12em] text-[#fff8e7]`}>SIVORA</span>
        <span className={`${uprisingClass} mt-1 font-black uppercase tracking-[0.28em] text-[#f6a623]`}>
          UP<span className="text-brand">↑</span>RISING
        </span>
        {showTagline ? (
          <span className="mt-2 text-[0.62rem] font-black uppercase tracking-[0.22em] text-[#D1D1D1]">
            RISE BEYOND BOUNDARIES
          </span>
        ) : null}
      </span>
    </Link>
  );
}
