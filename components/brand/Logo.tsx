import Image from 'next/image';
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
  label = 'SIVORA UP↑RISING',
  size = 'default',
}: BrandLogoProps) {
  const imageClass =
    size === 'compact'
      ? 'h-10 max-w-[10rem] sm:h-11 lg:h-12'
      : 'h-11 max-w-[11rem] sm:h-12 sm:max-w-[12rem] lg:h-14 lg:max-w-[14rem]';

  return (
    <Link href={href} className={`flex shrink-0 items-center text-textPrimary ${className}`} aria-label={label}>
      <span className="inline-flex items-center justify-center rounded-lg bg-white p-0.5 shadow-sm shadow-black/20">
        <Image
          src="/branding/sivora-uprising-logo.png"
          alt="SIVORA UP↑RISING"
          width={687}
          height={688}
          priority
          className={`${imageClass} w-auto rounded-md object-contain`}
        />
      </span>
    </Link>
  );
}
