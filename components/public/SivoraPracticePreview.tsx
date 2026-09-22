const previewBadge = (
  <span className="rounded-full bg-[#fff0ec] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-brand">
    Preview
  </span>
);

export default function SivoraPracticePreview() {
  return (
    <section aria-labelledby="practice-preview-title">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-brand">SIVORA practice test preview</p>
        <h2 id="practice-preview-title" className="mt-4 text-3xl font-black uppercase text-[#171717] sm:text-5xl">
          See how your test will work
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#565c60] sm:text-base">
          This is only a preview. Your real practice test starts after you choose a test and select Start Test.
        </p>
      </div>

      <div className="mt-10 grid gap-6 xl:grid-cols-2">
        <PreviewFrame number="1" title="Before the test">
          <div className="rounded-lg border border-[#dce0e2] bg-[#f7f7f4] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">NEET subject practice</p>
            <h3 className="mt-2 text-xl font-bold text-[#171717]">Physics practice test</h3>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-[#565c60]">
              <PreviewStat label="Questions" value="20" />
              <PreviewStat label="Duration" value="20 minutes" />
              <PreviewStat label="Correct" value="+4 marks" />
              <PreviewStat label="Incorrect" value="−1 mark" />
            </dl>
            <span className="mt-5 inline-flex rounded-md bg-brand px-4 py-2.5 text-sm font-bold text-white">Start Test</span>
          </div>
        </PreviewFrame>

        <PreviewFrame number="2" title="During the test">
          <div className="grid gap-4 rounded-lg border border-[#dce0e2] bg-[#f7f7f4] p-4 sm:grid-cols-[1fr_126px]">
            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">Question 12 of 20</p>
                <span className="rounded-full border border-[#dce0e2] bg-white px-2 py-1 text-xs font-bold">12:18</span>
              </div>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#171717]">Which option best completes this practice question?</p>
              <div className="mt-3 grid gap-2">
                {['A. First answer', 'B. Second answer', 'C. Third answer', 'D. Fourth answer'].map((option, index) => (
                  <div key={option} className={`rounded border px-3 py-2 text-xs ${index === 1 ? 'border-brand bg-[#fff0ec] text-[#171717]' : 'border-[#dce0e2] bg-white text-[#565c60]'}`}>{option}</div>
                ))}
              </div>
            </div>
            <aside className="rounded border border-[#dce0e2] bg-white p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#565c60]">Question palette</p>
              <div className="mt-3 grid grid-cols-4 gap-1.5">
                {Array.from({ length: 12 }, (_, index) => <span key={index} className={`grid aspect-square place-items-center rounded text-[10px] font-bold ${index === 11 ? 'bg-brand text-white' : index < 5 ? 'bg-[#698797] text-white' : 'border border-[#cbd2d5]'}`}>{index + 1}</span>)}
              </div>
            </aside>
            <div className="flex flex-wrap gap-2 text-xs font-bold sm:col-span-2">
              <span className="rounded border border-[#dce0e2] bg-white px-3 py-2">Previous</span>
              <span className="rounded bg-brand px-3 py-2 text-white">Save &amp; Next</span>
              <span className="rounded border border-[#dce0e2] bg-white px-3 py-2">Submit Test</span>
            </div>
          </div>
        </PreviewFrame>

        <PreviewFrame number="3" title="After you submit">
          <div className="rounded-lg border border-[#dce0e2] bg-[#f7f7f4] p-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <PreviewStat label="Score" value="56 / 80" />
              <PreviewStat label="Correct" value="15" />
              <PreviewStat label="Incorrect" value="4" />
              <PreviewStat label="Unanswered" value="1" />
            </div>
            <div className="mt-4 rounded border border-[#dce0e2] bg-white p-3">
              <p className="text-xs font-bold text-[#171717]">Accuracy and subject performance</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#dce0e2]"><div className="h-full w-3/4 bg-[#698797]" /></div>
              <p className="mt-2 text-xs text-[#565c60]">Review your answers and see which topics need more practice.</p>
            </div>
          </div>
        </PreviewFrame>

        <PreviewFrame number="4" title="Practice again">
          <div className="rounded-lg border border-[#dce0e2] bg-[#f7f7f4] p-4">
            <p className="text-sm font-bold text-[#171717]">My practice history</p>
            <div className="mt-3 divide-y divide-[#dce0e2] rounded border border-[#dce0e2] bg-white px-3">
              <HistoryRow attempt="Attempt 2" detail="56 / 80 · Today" />
              <HistoryRow attempt="Attempt 1" detail="48 / 80 · Last week" />
            </div>
            <span className="mt-4 inline-flex rounded-md bg-brand px-4 py-2.5 text-sm font-bold text-white">Take Another Attempt</span>
            <p className="mt-3 text-xs leading-5 text-[#565c60]">Practice again anytime — repeat attempts are currently free.</p>
          </div>
        </PreviewFrame>
      </div>
    </section>
  );
}

function PreviewFrame({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <article className="rounded-xl border border-[#cfd6dc] bg-white p-4 shadow-[0_12px_30px_rgba(23,23,23,0.06)] sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7b858d]">Screen {number}</p>
          <h3 className="mt-1 text-lg font-black uppercase text-[#171717]">{title}</h3>
        </div>
        {previewBadge}
      </div>
      {children}
    </article>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded border border-[#dce0e2] bg-white p-3"><dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7b858d]">{label}</dt><dd className="mt-1 font-bold text-[#171717]">{value}</dd></div>;
}

function HistoryRow({ attempt, detail }: { attempt: string; detail: string }) {
  return <div className="flex items-center justify-between gap-3 py-3 text-xs"><span className="font-bold text-[#171717]">{attempt}</span><span className="text-[#565c60]">{detail}</span></div>;
}
