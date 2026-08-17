import PeacockFeather from './PeacockFeather';

export default function PeacockQuillArtwork({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute ${className}`} aria-hidden="true">
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(244,63,63,0.22),transparent_58%)] blur-3xl" />
      <svg viewBox="0 0 760 560" className="absolute inset-0 h-full w-full" fill="none">
        <path
          d="M240 362c128-34 290-31 438 8 16 4 24 18 18 31l-37 79c-5 11-18 18-31 16-144-27-283-25-420 8-16 4-31-5-34-19l-16-76c-3-15 7-39 82-47Z"
          fill="#0d0b09"
          stroke="rgba(240,210,138,0.45)"
          strokeWidth="2"
        />
        <path d="M212 401c139-28 289-29 455-1M220 435c128-22 268-22 423-1M228 468c110-17 240-18 384-2" stroke="rgba(240,210,138,0.28)" strokeWidth="2" strokeLinecap="round" />
        <path d="M382 344l71 38-42 40-69-35 40-43Z" fill="url(#nibGold)" stroke="rgba(255,226,160,0.62)" strokeWidth="2" />
        <path d="M392 358l37 19-21 21-36-18 20-22Z" fill="#070707" opacity="0.82" />
        <path d="M411 420c26 22 76 26 126 6" stroke="rgba(244,63,63,0.38)" strokeWidth="3" strokeLinecap="round" />
        <path d="M432 438c36 13 87 11 144-8" stroke="rgba(240,210,138,0.24)" strokeWidth="2" strokeLinecap="round" />
        <defs>
          <linearGradient id="nibGold" x1="342" y1="344" x2="454" y2="422" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffe2a0" />
            <stop offset="0.52" stopColor="#a96f27" />
            <stop offset="1" stopColor="#4b2b10" />
          </linearGradient>
        </defs>
      </svg>
      <PeacockFeather className="absolute left-[20%] top-[0%] h-[77%] w-[32%] -rotate-[52deg] opacity-95" />
    </div>
  );
}
