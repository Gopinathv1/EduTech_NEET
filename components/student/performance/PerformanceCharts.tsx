'use client';

import dynamic from 'next/dynamic';

/**
 * Lazy wrapper around the recharts-heavy PerformanceChartsInner. `next/dynamic`
 * with `ssr: false` keeps the large charting bundle out of the initial payload
 * — it is fetched only after the page is interactive, which matters a lot on
 * the slow rural connections this platform targets. A lightweight skeleton with
 * the final layout (3 cards) shows while it streams in, avoiding layout shift.
 */
const PerformanceChartsInner = dynamic(() => import('./PerformanceChartsInner'), {
  ssr: false,
  loading: () => <ChartsSkeleton />,
});

function ChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-56 w-full animate-pulse rounded-lg bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export default function PerformanceCharts(props: {
  scoreTrend: { label: string; score: number }[];
  subjectAccuracy: { name: string; accuracy: number }[];
  timeTrend: { label: string; avgSeconds: number }[];
}) {
  return <PerformanceChartsInner {...props} />;
}
