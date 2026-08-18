import PeacockFeather from './PeacockFeather';

export default function PeacockQuillArtwork({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute ${className}`} aria-hidden="true">
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_56%_45%,rgba(0,139,156,0.34),transparent_42%),radial-gradient(circle_at_42%_32%,rgba(231,182,90,0.22),transparent_36%),radial-gradient(circle_at_60%_48%,rgba(215,25,32,0.34),transparent_58%)] blur-3xl" />
      <div className="absolute left-[12%] top-[9%] h-[78%] w-[78%] rounded-full border border-[#D71920]/35 shadow-[0_0_70px_rgba(215,25,32,0.28)]" />
      <svg viewBox="0 0 760 560" className="absolute inset-0 h-full w-full" fill="none">
        <path d="M170 390c150-76 340-74 520 4" stroke="rgba(215,25,32,0.38)" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M196 424c132-46 300-45 458 2" stroke="rgba(231,182,90,0.22)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M228 458c110-26 250-26 392-1" stroke="rgba(255,255,255,0.13)" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      <PeacockFeather className="absolute left-[44%] top-[1%] h-[92%] w-[28%] -rotate-[18deg] opacity-95 drop-shadow-[0_0_24px_rgba(215,25,32,0.28)]" />
      <PeacockFeather className="absolute left-[32%] top-[8%] h-[78%] w-[23%] -rotate-[40deg] opacity-80 blur-[0.1px]" />
      <PeacockFeather className="absolute left-[58%] top-[12%] h-[73%] w-[21%] rotate-[4deg] opacity-75 blur-[0.1px]" />
    </div>
  );
}
