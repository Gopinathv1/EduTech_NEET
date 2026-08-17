'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ComponentType, type SVGProps } from 'react';
import { apiPost } from '@/lib/client/api';
import { ADMIN_NAV } from '@/lib/admin/nav';
import {
  GridIcon,
  BookIcon,
  FileIcon,
  UsersIcon,
  CardIcon,
  TargetIcon,
  BellIcon,
  ChartIcon,
  SettingsIcon,
  MenuIcon,
  CloseIcon,
} from './icons';

const ICONS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  grid: GridIcon,
  book: BookIcon,
  file: FileIcon,
  users: UsersIcon,
  card: CardIcon,
  target: TargetIcon,
  bell: BellIcon,
  chart: ChartIcon,
  settings: SettingsIcon,
};

function isActive(pathname: string, href: string) {
  // "/admin" (dashboard) must match exactly, else it lights up on every page.
  return href === '/admin' ? pathname === href : pathname.startsWith(href);
}

/**
 * Admin chrome: a fixed left sidebar on desktop (offset with `lg:pl-64` in the
 * layout) and a sticky top bar + slide-in drawer on mobile.
 */
export default function AdminNav({
  name,
  role,
  newLeadsCount = 0,
}: {
  name: string;
  role: string;
  newLeadsCount?: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  async function logout() {
    await apiPost('/api/auth/logout');
    window.location.href = '/admin/login';
  }

  const navList = (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Admin">
      {ADMIN_NAV.filter((item) => !item.superOnly || role === 'SUPER_ADMIN').map((item) => {
        const Icon = ICONS[item.icon] ?? GridIcon;
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active ? 'bg-brand text-white' : 'text-textSecondary hover:bg-surfaceElevated'
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.href === '/admin/leads' && newLeadsCount > 0 ? (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? 'bg-surfaceElevated/20 text-white' : 'bg-brand text-white'}`}
                title={`${newLeadsCount} new lead${newLeadsCount === 1 ? '' : 's'}`}
              >
                {newLeadsCount}
              </span>
            ) : null}
            {!item.functional ? (
              <span className="rounded bg-surfaceElevated px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-400">
                Soon
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t border-border p-4">
      <p className="truncate text-sm font-semibold text-textPrimary">{name}</p>
      <p className="text-xs text-textSecondary">{role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}</p>
      <button
        type="button"
        onClick={logout}
        className="mt-3 w-full rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-textSecondary hover:bg-surfaceElevated"
      >
        Logout
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-surfaceElevated px-4 py-3 lg:hidden">
        <span className="text-base font-extrabold text-red-200">NEET Admin</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-textSecondary hover:bg-surfaceElevated"
          aria-label="Open menu"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Desktop fixed sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-surfaceElevated lg:flex">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-extrabold text-white">
            N
          </span>
          <span className="text-base font-extrabold text-red-200">NEET Admin</span>
        </div>
        {navList}
        {footer}
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-brand/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-surfaceElevated shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <span className="text-base font-extrabold text-red-200">NEET Admin</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-textSecondary hover:bg-surfaceElevated"
                aria-label="Close menu"
              >
                <CloseIcon className="h-6 w-6" />
              </button>
            </div>
            {navList}
            {footer}
          </div>
        </div>
      ) : null}
    </>
  );
}
