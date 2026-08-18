'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import {
  buildDefaultWhatsAppMessage,
  isWhatsAppButtonHiddenPath,
} from '@/lib/contact/whatsapp-enquiry';
import { getWhatsAppUrl } from '@/lib/whatsapp';

export default function WhatsAppButton() {
  const pathname = usePathname();
  const result = useMemo(() => getWhatsAppUrl(buildDefaultWhatsAppMessage(pathname)), [pathname]);

  if (!result.available || isWhatsAppButtonHiddenPath(pathname)) return null;

  return (
    <div className="fixed bottom-5 left-5 z-50 sm:bottom-6 sm:left-6">
      <a
        href={result.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl shadow-black/40 transition hover:-translate-y-0.5 hover:bg-[#1ebe5d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        aria-label="Contact VV Overseas on WhatsApp"
      >
        <WhatsAppIcon className="h-7 w-7" />
      </a>
    </div>
  );
}

function WhatsAppIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16 3.2A12.6 12.6 0 0 0 5.3 22.5L4 29l6.6-1.7A12.6 12.6 0 1 0 16 3.2Zm0 2.3a10.3 10.3 0 0 1 8.7 15.9 10.3 10.3 0 0 1-13.2 3.5l-.5-.3-3.9 1 1-3.8-.3-.5A10.3 10.3 0 0 1 16 5.5Zm-4.4 5.4c-.2 0-.5 0-.7.3-.2.2-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.9 4.5 3.9 2.2.9 2.7.7 3.2.7.5 0 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.2-.2-.5-.4l-1.9-.9c-.3-.1-.5-.2-.7.2-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.1-.4-2.1-1.3-.8-.7-1.3-1.6-1.5-1.9-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2.1-.4 0-.6l-.9-2.1c-.2-.5-.4-.5-.7-.5h-.2Z" />
    </svg>
  );
}
