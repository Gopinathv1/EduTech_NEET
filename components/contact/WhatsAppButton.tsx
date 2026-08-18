'use client';

import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  PARTNER_WHATSAPP_TYPES,
  STUDENT_WHATSAPP_CATEGORIES,
  buildGeneralWhatsAppMessage,
  buildPartnerWhatsAppMessage,
  buildStudentWhatsAppMessage,
  isWhatsAppButtonHiddenPath,
} from '@/lib/contact/whatsapp-enquiry';
import { getWhatsAppUrl } from '@/lib/whatsapp';

type Audience = 'student' | 'partner' | 'general';

export default function WhatsAppButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [audience, setAudience] = useState<Audience>('student');
  const configured = useMemo(() => getWhatsAppUrl('Hello VV Overseas'), []);

  if (!configured.available || isWhatsAppButtonHiddenPath(pathname)) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-5 sm:right-5">
      {open ? (
        <div className="w-[min(calc(100vw-2rem),24rem)] rounded-3xl border border-[#d7e7e2] bg-white p-4 shadow-2xl shadow-[#0b1736]/18">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black text-[#0b1736]">WhatsApp Enquiry</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">Choose the best option so we can route your message faster.</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full px-2 py-1 text-sm font-bold text-slate-500 hover:bg-slate-100"
              aria-label="Close WhatsApp enquiry selector"
            >
              X
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              ['student', 'Student / Parent'],
              ['partner', 'B2B Partner'],
              ['general', 'General'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setAudience(value as Audience)}
                className={`rounded-2xl px-3 py-2 text-xs font-black transition ${
                  audience === value ? 'bg-[#087f5b] text-white' : 'bg-[#e8f7f3] text-[#0b1736] hover:bg-[#d5f0e9]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4 max-h-[45vh] space-y-2 overflow-y-auto pr-1">
            {audience === 'student'
              ? STUDENT_WHATSAPP_CATEGORIES.map((category) => (
                  <WhatsAppChoice key={category} label={category} message={buildStudentWhatsAppMessage(category, pathname)} />
                ))
              : null}
            {audience === 'partner'
              ? PARTNER_WHATSAPP_TYPES.map((type) => (
                  <WhatsAppChoice key={type} label={type} message={buildPartnerWhatsAppMessage(type, pathname)} />
                ))
              : null}
            {audience === 'general' ? (
              <WhatsAppChoice label="Start General Enquiry" message={buildGeneralWhatsAppMessage(pathname)} />
            ) : null}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="group flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl shadow-[#0b1736]/20 transition hover:-translate-y-0.5 hover:bg-[#1ebe5d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b1736]"
        aria-label={open ? 'Close WhatsApp enquiry selector' : 'Open WhatsApp enquiry selector'}
        aria-expanded={open}
      >
        <WhatsAppIcon className="h-7 w-7" />
      </button>
    </div>
  );
}

function WhatsAppChoice({ label, message }: { label: string; message: string }) {
  const result = getWhatsAppUrl(message);
  if (!result.available) return null;
  return (
    <a
      href={result.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl border border-[#d7e7e2] bg-[#fff9f2] px-4 py-3 text-sm font-bold text-[#0b1736] transition hover:border-[#087f5b]/35 hover:bg-white"
      onClick={() => {
        // Browser navigation to WhatsApp happens in a new tab; no sensitive data is stored here.
      }}
    >
      {label}
    </a>
  );
}

function WhatsAppIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16 3.2A12.6 12.6 0 0 0 5.3 22.5L4 29l6.6-1.7A12.6 12.6 0 1 0 16 3.2Zm0 2.3a10.3 10.3 0 0 1 8.7 15.9 10.3 10.3 0 0 1-13.2 3.5l-.5-.3-3.9 1 1-3.8-.3-.5A10.3 10.3 0 0 1 16 5.5Zm-4.4 5.4c-.2 0-.5 0-.7.3-.2.2-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.9 4.5 3.9 2.2.9 2.7.7 3.2.7.5 0 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.2-.2-.5-.4l-1.9-.9c-.3-.1-.5-.2-.7.2-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.1-.4-2.1-1.3-.8-.7-1.3-1.6-1.5-1.9-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2.1-.4 0-.6l-.9-2.1c-.2-.5-.4-.5-.7-.5h-.2Z" />
    </svg>
  );
}
