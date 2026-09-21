export default function SivoraPracticePreview() {
  return (
    <section aria-label="SIVORA practice interface preview" className="rounded-md border border-[#dce0e2] bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-center justify-between border-b border-[#dce0e2] pb-3 text-xs font-black uppercase tracking-[0.14em] text-[#565c60]">
        <span>SIVORA practice interface preview</span>
        <span className="text-brand">01:42:18</span>
      </div>
      <div className="grid gap-5 pt-5 lg:grid-cols-[1fr_180px]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-brand">Physics · Question 12 of 45</p>
          <p className="mt-3 text-base font-bold leading-7 text-[#171717]">A student records the motion of an object. Which option best describes the next calculation?</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {['A. Use the given values', 'B. Compare the quantities', 'C. Check the direction', 'D. Review the conditions'].map((option) => (
              <div key={option} className="rounded border border-[#dce0e2] px-3 py-2 text-sm text-[#565c60]">{option}</div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded border border-[#dce0e2] px-3 py-2">← Previous</span>
            <span className="rounded bg-brand px-3 py-2 text-white">Save &amp; Next →</span>
            <span className="rounded border border-[#dce0e2] px-3 py-2">Mark for review</span>
          </div>
        </div>
        <aside className="rounded border border-[#dce0e2] bg-[#f7f7f4] p-3">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#565c60]">Question palette</p>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {Array.from({ length: 15 }, (_, index) => <span key={index} className={`grid aspect-square place-items-center rounded text-xs font-bold ${index === 11 ? 'bg-brand text-white' : index < 6 ? 'bg-[#698797] text-white' : 'border border-[#cbd2d5] text-[#565c60]'}`}>{index + 1}</span>)}
          </div>
        </aside>
      </div>
      <div className="mt-5 grid gap-2 border-t border-[#dce0e2] pt-4 text-sm text-[#565c60] sm:grid-cols-4">
        <span><b className="text-[#171717]">Result metrics:</b> score</span><span>correct / wrong / skipped</span><span>subject &amp; chapter analysis</span><span>time analysis</span>
      </div>
    </section>
  );
}
