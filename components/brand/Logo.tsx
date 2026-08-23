import Image from 'next/image';
import Link from 'next/link';

type BrandLogoProps = {
  className?: string;
  label?: string;
  size?: 'default' | 'compact';
};

export default function BrandLogo({
  className = '',
  label = 'SIVORA UP↑RISING home',
  size = 'default',
}: BrandLogoProps) {
  const frameClass =
    size === 'compact'
      ? 'h-[50px] w-[150px] sm:h-[58px] sm:w-[170px] lg:h-16 lg:w-[190px]'
      : 'h-[54px] w-40 sm:h-16 sm:w-[190px] lg:h-[74px] lg:w-[220px]';

  return (
    <Link href="/" className={`flex shrink-0 items-center text-textPrimary ${className}`} aria-label={label}>
      <span className={`relative block shrink-0 overflow-hidden ${frameClass}`}>
        <Image
          src="/branding/sivora-uprising-logo.png"
          alt="SIVORA UP↑RISING - Rise Across Boundaries"
          width={1774}
          height={887}
          priority
          className="h-full w-full scale-[1.45] object-contain object-center [filter:brightness(1.08)_contrast(1.06)_drop-shadow(0_0_8px_rgba(59,130,246,0.25))_drop-shadow(0_0_5px_rgba(212,175,55,0.18))]"
        />
      </span>
    </Link>
  );
}
