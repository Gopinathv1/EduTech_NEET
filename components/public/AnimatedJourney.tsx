export default function AnimatedJourney() {
  const nodes = ['INDIA', 'DISCOVER', 'PREPARE', 'LEARN', 'GLOBAL OPPORTUNITY'];
  return (
    <div className="sivora-journey-visual relative min-h-[390px] overflow-hidden border border-[#d4c9b8] bg-[#e8e0d4] p-6 text-[#171613] sm:min-h-[500px] sm:p-10" aria-label="SIVORA student journey from India to global opportunity">
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(rgba(23,22,19,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(23,22,19,.12) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.22em] text-[#7c7468]"><span>SIVORA / JOURNEY</span><span>01—05</span></div>
        <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-3 py-10">
          {nodes.map((node, index) => <div key={node} className="sivora-journey-node relative flex items-center gap-4" style={{ animationDelay: `${index * 500}ms` }}><span className="z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#c94137]/40 bg-[#f2eee7] text-[10px] font-bold text-[#c94137]">0{index + 1}</span><span className="text-sm font-semibold uppercase tracking-[0.18em] sm:text-base">{node}</span>{index < nodes.length - 1 ? <span className="absolute left-6 top-12 h-8 w-px bg-[#c94137]/40" /> : null}</div>)}
          <span className="sivora-journey-orbit absolute left-[1.35rem] top-10 h-24 w-24 rounded-full border border-[#c94137]/50" />
        </div>
        <p className="max-w-xs text-sm leading-6 text-[#6d665b]">From the first question to the next opportunity, keep moving with clarity.</p>
      </div>
    </div>
  );
}
