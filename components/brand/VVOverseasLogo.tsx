import Link from 'next/link';
import PeacockFeather from './PeacockFeather';

export default function VVOverseasLogo({ className = '', label }: { className?: string; label: string }) {
  return (
    <Link href="/" className={`flex shrink-0 items-center gap-2.5 ${className}`} aria-label={label}>
      <PeacockFeather className="h-8 w-5 shrink-0 sm:h-10 sm:w-6 lg:h-11 lg:w-7" />
      <span className="whitespace-nowrap text-base font-extrabold leading-tight text-textPrimary sm:text-lg">
        <span className="text-brand">VV</span> Overseas
      </span>
    </Link>
  );
}
