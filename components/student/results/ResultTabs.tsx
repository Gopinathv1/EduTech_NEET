'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';

/**
 * Client tab switcher for the result page. The Analysis tab is a server-rendered
 * node passed in as a prop; the Answer-review tab is its own client component.
 * Both are mounted up front and toggled with CSS so switching is instant and the
 * review's filter state survives.
 */
export default function ResultTabs({ analysis, review }: { analysis: ReactNode; review: ReactNode }) {
  const t = useTranslations('results.tabs');
  const [tab, setTab] = useState<'analysis' | 'review'>('analysis');

  const tabs: { key: 'analysis' | 'review'; label: string }[] = [
    { key: 'analysis', label: t('analysis') },
    { key: 'review', label: t('review') },
  ];

  return (
    <div>
      <div role="tablist" className="mt-4 flex gap-1 rounded-xl border border-border bg-surfaceElevated p-1">
        {tabs.map((tb) => {
          const active = tab === tb.key;
          return (
            <button
              key={tb.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(tb.key)}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                active ? 'bg-brand text-white' : 'text-textSecondary hover:bg-surfaceElevated'
              }`}
            >
              {tb.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <div hidden={tab !== 'analysis'}>{analysis}</div>
        <div hidden={tab !== 'review'}>{review}</div>
      </div>
    </div>
  );
}
