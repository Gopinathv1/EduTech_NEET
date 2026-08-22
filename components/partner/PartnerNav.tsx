'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { apiPost } from '@/lib/client/api';
import WhatsAppLink from '@/components/whatsapp/WhatsAppLink';

const nav = [
  { label: 'Dashboard', href: '/partner', section: '' },
  { label: 'Leads', href: '/partner/leads', section: 'Application Management', note: 'Phase 2' },
  { label: 'Applications', href: '/partner/applications', section: 'Application Management', note: 'Phase 2' },
  { label: 'Students', href: '/partner/students', section: 'Application Management', note: 'Phase 2' },
  { label: 'Tasks', href: '/partner/tasks', section: 'Application Management', note: 'Later' },
  { label: 'Universities', href: '/partner/universities', section: 'Discovery', note: 'Phase 3' },
  { label: 'Support', href: '/partner/support', section: 'Help', note: 'Later' },
  { label: 'Agency Profile', href: '/partner/profile', section: 'Account' },
];

function isActive(pathname: string, href: string) {
  return href === '/partner' ? pathname === href : pathname.startsWith(href);
}

export default function PartnerNav({ userName, agencyName }: { userName: string; agencyName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const supportMessage = `Hello SIVORA,\nI am contacting you from ${agencyName} and need partner support.`;

  async function logout() {
    await apiPost('/api/auth/logout');
    window.location.href = '/partner/login';
  }

  let lastSection = '';
  const links = (
    <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Partner">
      {nav.map((item) => {
        const section = item.section !== lastSection ? item.section : '';
        lastSection = item.section;
        const active = isActive(pathname, item.href);
        return (
          <div key={item.href}>
            {section ? <p className="px-3 pb-1 pt-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#e4c46a]">{section}</p> : null}
            <Link
              href={item.href}
              onClick={() => setOpen(false)}
              className={`mt-1 flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                active ? 'bg-[#0f766e] text-white' : 'text-slate-300 hover:bg-white/8 hover:text-white'
              }`}
            >
              <span>{item.label}</span>
              {item.note ? <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] text-slate-300">{item.note}</span> : null}
            </Link>
          </div>
        );
      })}
      <div className="mt-4 px-3">
        <WhatsAppLink
          label="WhatsApp Support"
          message={supportMessage}
          className="flex w-full items-center justify-center rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-sm font-bold text-emerald-100 hover:bg-emerald-500/20"
        />
      </div>
    </nav>
  );

  const footer = (
    <div className="border-t border-white/10 p-4">
      <p className="truncate text-sm font-bold text-white">{userName}</p>
      <p className="truncate text-xs text-slate-400">{agencyName}</p>
      <button type="button" onClick={logout} className="mt-3 w-full rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/8">
        Logout
      </button>
    </div>
  );

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#061114] px-4 py-3 lg:hidden">
        <span className="text-sm font-black uppercase tracking-[0.12em] text-white">SIVORA Partner</span>
        <button type="button" onClick={() => setOpen(true)} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white">
          Menu
        </button>
      </div>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-white/10 bg-[#061114] lg:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#2dd4bf]">SIVORA</p>
          <p className="mt-1 text-lg font-black text-white">Partner Portal</p>
        </div>
        {links}
        {footer}
      </aside>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-80 max-w-[86vw] flex-col bg-[#061114] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <span className="font-black text-white">Partner Portal</span>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-slate-300">Close</button>
            </div>
            {links}
            {footer}
          </div>
        </div>
      ) : null}
    </>
  );
}
