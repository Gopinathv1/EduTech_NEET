type ExamProductVisualProps = {
  exam?: 'NEET' | 'JEE';
};

const subjects = ['Physics', 'Chemistry', 'Botany', 'Zoology'];

export default function ExamProductVisual({ exam = 'NEET' }: ExamProductVisualProps) {
  const visibleSubjects = exam === 'NEET' ? subjects : ['Physics', 'Chemistry', 'Mathematics'];

  return (
    <div className="overflow-hidden rounded-md border border-[#dce0e2] bg-white shadow-[0_18px_50px_rgba(23,23,23,0.08)]">
      <div className="flex items-center justify-between border-b border-[#dce0e2] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6b6b67] sm:px-6">
        <span>{exam} mock test</span>
        <span className="text-[#2774e6]">01 / 03 attempts</span>
      </div>
      <div className="grid gap-0 lg:grid-cols-[1fr_220px]">
        <div className="p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2774e6]">Question 042</p>
              <h3 className="mt-3 max-w-xl text-xl font-semibold tracking-[-0.04em] text-[#171717] sm:text-2xl">
                Select the response that best completes this practice question.
              </h3>
            </div>
            <span className="shrink-0 rounded-full border border-[#dce0e2] px-3 py-1 text-xs font-semibold text-[#6b6b67]">01:48:20</span>
          </div>
          <div className="mt-7 grid gap-2 sm:grid-cols-2">
            {['A response option for review', 'Another response option', 'Mark for review later', 'Continue to next question'].map((option, index) => (
              <div key={option} className={`border px-3 py-3 text-sm ${index === 1 ? 'border-[#2774e6] bg-[#eaf2ff] text-[#171717]' : 'border-[#dce0e2] text-[#6b6b67]'}`}>
                <span className="mr-2 font-bold text-[#2774e6]">{String.fromCharCode(65 + index)}</span>{option}
              </div>
            ))}
          </div>
        </div>
        <aside className="border-t border-[#dce0e2] bg-[#f0f0ed] p-5 lg:border-l lg:border-t-0 sm:p-6">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.16em] text-[#6b6b67]">
            <span>Progress</span><span>42 / 180</span>
          </div>
          <div className="mt-3 h-1.5 bg-[#dce0e2]"><div className="h-full w-[23%] bg-[#2774e6]" /></div>
          <div className="mt-6 grid grid-cols-4 gap-2">
            {Array.from({ length: 16 }, (_, index) => <span key={index} className={`flex h-7 items-center justify-center text-[10px] font-bold ${index < 6 ? 'bg-[#171717] text-white' : index === 6 ? 'border border-[#2774e6] text-[#2774e6]' : 'border border-[#dce0e2] text-[#6b6b67]'}`}>{index + 1}</span>)}
          </div>
          <div className="mt-6 border-t border-[#dce0e2] pt-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6b6b67]">Sections</p>
            <div className="mt-3 space-y-2">{visibleSubjects.map((subject, index) => <div key={subject} className="flex justify-between text-xs text-[#565c60]"><span>{subject}</span><span>{index < 2 ? '45' : '45'} Q</span></div>)}</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
