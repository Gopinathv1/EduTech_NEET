'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { apiPost } from '@/lib/client/api';
import { notificationStyle } from '@/lib/notifications/types';
import { timeAgo } from './timeAgo';

export type SerializedNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  linkUrl: string | null;
  createdAt: string;
  read: boolean;
};

/**
 * Header notification bell: unread badge + dropdown of recent notifications.
 * Opening an item marks it read (optimistically) and follows its deep link.
 * Initial data is passed from the server so the first paint needs no fetch.
 */
export default function NotificationBell({
  initialUnread,
  items: initialItems,
}: {
  initialUnread: number;
  items: SerializedNotification[];
}) {
  const t = useTranslations('notifications');
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState(initialItems);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function openItem(n: SerializedNotification) {
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      void apiPost(`/api/notifications/${n.id}/read`);
    }
    if (n.linkUrl) window.location.href = n.linkUrl;
    else setOpen(false);
  }

  async function markAll() {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    setUnread(0);
    await apiPost('/api/notifications/read-all');
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t('bell')}
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <path
            d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <span className="text-sm font-semibold text-slate-900">{t('title')}</span>
            {unread > 0 ? (
              <button type="button" onClick={markAll} className="text-xs font-medium text-brand hover:text-brand-dark">
                {t('markAllRead')}
              </button>
            ) : null}
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">{t('dropdownEmpty')}</p>
          ) : (
            <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
              {items.slice(0, 8).map((n) => {
                const st = notificationStyle(n.type);
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => openItem(n)}
                      className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-slate-50 ${n.read ? '' : 'bg-brand-soft/30'}`}
                    >
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base ${st.chip}`}>
                        {st.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className={`truncate text-sm ${n.read ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'}`}>
                            {n.title}
                          </span>
                          {!n.read ? <span className="h-2 w-2 shrink-0 rounded-full bg-brand" /> : null}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500">{n.message}</span>
                        <span className="mt-0.5 block text-[11px] text-slate-400">{timeAgo(n.createdAt, locale)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <Link
            href="/student/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-slate-100 px-4 py-2.5 text-center text-sm font-medium text-brand hover:bg-slate-50"
          >
            {t('seeAll')}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
