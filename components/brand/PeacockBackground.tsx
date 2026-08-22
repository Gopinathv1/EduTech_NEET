'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const ACTIVE_ATTEMPT_PATH = /^\/student\/tests\/[^/]+\/attempt(?:\/)?$/;

function shouldShowPeacockBackground(pathname: string | null) {
  if (!pathname) return true;
  if (ACTIVE_ATTEMPT_PATH.test(pathname)) return false;
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return false;
  if (pathname === '/partner' || pathname.startsWith('/partner/')) return false;
  return true;
}

export default function PeacockBackground() {
  const pathname = usePathname();
  const visible = shouldShowPeacockBackground(pathname);

  useEffect(() => {
    document.body.classList.toggle('sivora-peacock-active', visible);
    return () => document.body.classList.remove('sivora-peacock-active');
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="sivora-global-peacock pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="sivora-global-peacock__image absolute inset-0 bg-[url('/peacock-background.png')] bg-cover bg-[66%_center] opacity-80 sm:bg-[72%_center]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_28%,rgba(20,184,166,0.2),transparent_34%),radial-gradient(circle_at_88%_56%,rgba(246,166,35,0.16),transparent_30%),linear-gradient(90deg,rgba(5,5,5,0.92)_0%,rgba(5,5,5,0.68)_42%,rgba(5,5,5,0.28)_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/60 via-[#050505]/18 to-[#050505]/72" />
    </div>
  );
}
