'use client';

import { useTranslations } from 'next-intl';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { strengthOf } from '@/lib/attempts/analysis';

/**
 * Charts for the performance dashboard (recharts). Data arrives pre-localized from
 * the server so axis categories read in the active language; the component only
 * supplies translated axis/section titles. Everything is wrapped in a
 * ResponsiveContainer so it stays readable on small screens.
 *
 * This is the heavy inner component — it is loaded lazily (client-only) by
 * `PerformanceCharts.tsx` via next/dynamic so the ~large recharts bundle stays
 * out of the initial page payload on slow connections.
 */

const BRAND = '#dc2626';
const AXIS = '#94a3b8';
const GRID = '#e2e8f0';
const STRENGTH_FILL = { strong: '#16a34a', average: '#d97706', weak: '#dc2626' } as const;

const axisTick = { fontSize: 11, fill: AXIS };

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surfaceElevated p-4">
      <h3 className="text-sm font-semibold text-textPrimary">{title}</h3>
      <div className="mt-3 h-56 w-full">{children}</div>
    </div>
  );
}

export default function PerformanceCharts({
  scoreTrend,
  subjectAccuracy,
  timeTrend,
}: {
  scoreTrend: { label: string; score: number }[];
  subjectAccuracy: { name: string; accuracy: number }[];
  timeTrend: { label: string; avgSeconds: number }[];
}) {
  const t = useTranslations('performance.charts');

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard title={t('scoreTrend')}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={scoreTrend} margin={{ top: 8, right: 12, bottom: 4, left: -16 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: GRID }} />
            <YAxis tick={axisTick} tickLine={false} axisLine={false} width={44} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: GRID }} />
            <Line type="monotone" dataKey="score" name={t('score')} stroke={BRAND} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={t('subjectAccuracy')}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={subjectAccuracy} margin={{ top: 8, right: 12, bottom: 4, left: -16 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={axisTick} tickLine={false} axisLine={{ stroke: GRID }} interval={0} />
            <YAxis domain={[0, 100]} tick={axisTick} tickLine={false} axisLine={false} width={44} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: GRID }}
              formatter={(v) => [`${v}%`, t('accuracy')]}
            />
            <Bar dataKey="accuracy" name={t('accuracy')} radius={[4, 4, 0, 0]}>
              {subjectAccuracy.map((row) => (
                <Cell key={row.name} fill={STRENGTH_FILL[strengthOf(row.accuracy)]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={t('timeTrend')}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={timeTrend} margin={{ top: 8, right: 12, bottom: 4, left: -16 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: GRID }} />
            <YAxis tick={axisTick} tickLine={false} axisLine={false} width={44} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: GRID }}
              formatter={(v) => [`${v}s`, t('seconds')]}
            />
            <Line type="monotone" dataKey="avgSeconds" name={t('seconds')} stroke="#0891b2" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
