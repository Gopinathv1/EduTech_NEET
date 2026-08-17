import Link from 'next/link';
import PeacockFeather from './PeacockFeather';

export default function VVOverseasLogo({ className = '', label }: { className?: string; label: string }) {
  return (
    <Link href="/" className={`flex shrink-0 items-center gap-2.5 ${className}`} aria-label={label}>
      <PeacockFeather className="h-8 w-4 shrink-0 sm:h-9 sm:w-5 lg:h-10 lg:w-5" />
      <span className="whitespace-nowrap text-base font-extrabold leading-tight text-textPrimary sm:text-lg">
        <span className="text-accent">VV</span> Overseas
      </span>
    </Link>
  );
}
