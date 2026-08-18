import Link from 'next/link';
import PeacockFeather from './PeacockFeather';

export default function VVOverseasLogo({ className = '', label }: { className?: string; label: string }) {
  return (
    <Link href="/" className={`flex shrink-0 items-center gap-3 text-textPrimary ${className}`} aria-label={label}>
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0B1736] shadow-lg shadow-[#087f5b]/15">
        <PeacockFeather className="h-10 w-5" />
      </span>
      <span className="whitespace-nowrap text-base font-black leading-tight text-current sm:text-lg">
        <span className="text-brand">VV</span> Overseas
      </span>
    </Link>
  );
}
