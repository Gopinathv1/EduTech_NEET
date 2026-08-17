'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { apiPost } from '@/lib/client/api';
import { notificationStyle } from '@/lib/notifications/types';
import { timeAgo } from './timeAgo';
import type { SerializedNotification } from './NotificationBell';

/**
 * Full notifications page: filter by type, mark all read, and open a notification
 * (marks it read + follows its link). Filtering is client-side for instant tabs.
 */
export default function NotificationsClient({ initialItems }: { initialItems: SerializedNotification[] }) {
  const t = useTranslations('notifications');
  const locale = useLocale();
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<string>('ALL');

  // Tabs: "All" plus every type that appears, in first-seen order.
  const types = useMemo(() => {
    const seen: string[] = [];
    for (const n of items) if (!seen.includes(n.type)) seen.push(n.type);
    return seen;
  }, [items]);

  const filtered = filter === 'ALL' ? items : items.filter((n) => n.type === filter);
  const unread = items.filter((n) => !n.read).length;

  function openItem(n: SerializedNotification) {
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      void apiPost(`/api/notifications/${n.id}/read`);
    }
    if (n.linkUrl) window.location.href = n.linkUrl;
  }

  async function markAll() {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    await apiPost('/api/notifications/read-all');
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <FilterChip active={filter === 'ALL'} label={t('filterAll')} onClick={() => setFilter('ALL')} />
          {types.map((tp) => (
            <FilterChip key={tp} active={filter === tp} label={t(`types.${tp}`)} onClick={() => setFilter(tp)} />
          ))}
        </div>
        {unread > 0 ? (
          <button
            type="button"
            onClick={markAll}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-textSecondary hover:bg-surfaceElevated"
          >
            {t('markAllRead')}
          </button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-border bg-surfaceElevated p-10 text-center text-sm text-textSecondary">
          {t('empty')}
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {filtered.map((n) => {
            const st = notificationStyle(n.type);
            const Wrapper = n.linkUrl ? 'button' : 'div';
            return (
              <li key={n.id}>
                <Wrapper
                  {...(n.linkUrl ? { type: 'button' as const, onClick: () => openItem(n) } : {})}
                  className={`flex w-full gap-3 rounded-2xl border border-border border-l-4 bg-surfaceElevated p-4 text-left ${st.accent} ${
                    n.linkUrl ? 'hover:bg-surface' : ''
                  } ${n.read ? '' : 'ring-1 ring-brand/10'}`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${st.chip}`}>
                    {st.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className={`text-sm ${n.read ? 'font-medium text-textPrimary' : 'font-bold text-textPrimary'}`}>
                        {n.title}
                      </span>
                      {!n.read ? (
                        <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {t('newBadge')}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-sm text-textSecondary">{n.message}</span>
                    <span className="mt-1 block text-[11px] text-slate-400">{timeAgo(n.createdAt, locale)}</span>
                  </span>
                </Wrapper>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
        active ? 'bg-brand text-white' : 'border border-border bg-surfaceElevated text-textSecondary hover:bg-surfaceElevated'
      }`}
    >
      {label}
    </button>
  );
}
