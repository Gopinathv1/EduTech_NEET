import Link from 'next/link';
import PeacockFeather from './PeacockFeather';

export default function VVOverseasLogo({ className = '', label }: { className?: string; label: string }) {
  return (
    <Link href="/" className={`flex shrink-0 items-center gap-3 text-textPrimary ${className}`} aria-label={label}>
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D71920]/25 bg-[#050505] shadow-lg shadow-[#D71920]/20">
        <PeacockFeather className="h-11 w-7 drop-shadow-[0_0_10px_rgba(215,25,32,0.28)]" />
      </span>
      <span className="whitespace-nowrap text-base font-black leading-tight text-current sm:text-lg">
        <span className="text-brand">VV</span> Overseas
      </span>
    </Link>
  );
}
