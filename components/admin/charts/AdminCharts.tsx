'use client';

import dynamic from 'next/dynamic';

/**
 * Lazy re-exports of the admin charts. Each recharts wrapper is code-split
 * (`ssr: false`) so the charting bundle only loads on pages that actually show
 * a chart, and only after they are interactive. A simple pulsing box holds the
 * space while it streams in. Public API (named exports) is unchanged, so no
 * consumer page needs editing.
 */

function ChartBox({ height = 240 }: { height?: number }) {
  return <div style={{ height }} className="w-full animate-pulse rounded-lg bg-surfaceElevated" aria-hidden="true" />;
}

export const AdminLineChart = dynamic(
  () => import('./AdminChartsInner').then((m) => m.AdminLineChart),
  { ssr: false, loading: () => <ChartBox /> },
);

export const AdminBarChart = dynamic(
  () => import('./AdminChartsInner').then((m) => m.AdminBarChart),
  { ssr: false, loading: () => <ChartBox /> },
);

export const AdminPie = dynamic(
  () => import('./AdminChartsInner').then((m) => m.AdminPie),
  { ssr: false, loading: () => <ChartBox height={220} /> },
);
