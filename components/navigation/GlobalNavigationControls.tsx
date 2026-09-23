'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { apiPost } from '@/lib/client/api';
import {
  isActiveTestPath,
  logoutRedirectFor,
  shouldUseBrowserBack,
  shouldShowLogout,
  type GlobalSessionKind,
} from '@/lib/navigation/global-controls';

const ACTIVE_TEST_LEAVE_MESSAGE =
  'Your test is still in progress. Leave the exam-taking screen?';

export default function GlobalNavigationControls({
  sessionKind,
}: {
  sessionKind: GlobalSessionKind;
}) {
  const pathname = usePathname();
  const previousPath = useRef(pathname);
  const [hasObservedInternalNavigation, setHasObservedInternalNavigation] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const activeTest = isActiveTestPath(pathname);

  useEffect(() => {
    if (previousPath.current !== pathname) {
      setHasObservedInternalNavigation(true);
      previousPath.current = pathname;
    }
  }, [pathname]);

  function confirmActiveTestExit() {
    return !activeTest || window.confirm(ACTIVE_TEST_LEAVE_MESSAGE);
  }

  function goHome() {
    if (!confirmActiveTestExit()) return;
    window.location.assign('/');
  }

  function goBack() {
    if (!confirmActiveTestExit()) return;
    if (shouldUseBrowserBack({
      hasObservedInternalNavigation,
      referrer: document.referrer,
      currentOrigin: window.location.origin,
    })) {
      window.history.back();
      return;
    }
    window.location.assign('/');
  }

  function goForward() {
    if (!confirmActiveTestExit()) return;
    window.history.forward();
  }

  async function logout() {
    if (!sessionKind || loggingOut || !confirmActiveTestExit()) return;
    setLoggingOut(true);
    const result = await apiPost('/api/auth/logout');
    if (!result.ok) {
      setLoggingOut(false);
      return;
    }
    window.location.assign(logoutRedirectFor(sessionKind));
  }

  return (
    <nav
      aria-label="Global navigation"
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-[70] flex -translate-x-1/2 items-center gap-0.5 rounded-md border border-[#d9dee5] bg-white/95 p-1 text-[#10151c] shadow-[0_8px_24px_rgba(7,17,31,0.14)] backdrop-blur-xl"
    >
      <ControlButton label="Home" onClick={goHome}>
        <HomeIcon />
      </ControlButton>
      <ControlButton label="Go back" onClick={goBack}>
        <BackIcon />
      </ControlButton>
      <ControlButton label="Go forward" onClick={goForward}>
        <ForwardIcon />
      </ControlButton>
      {shouldShowLogout(sessionKind) ? (
        <ControlButton label="Log out" onClick={logout} disabled={loggingOut}>
          <LogoutIcon />
        </ControlButton>
      ) : null}
    </nav>
  );
}

function ControlButton({
  label,
  onClick,
  disabled = false,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-[#4f5b68] transition hover:bg-[#eaf2ff] hover:text-[#2774e6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2774e6] disabled:cursor-wait disabled:opacity-50 sm:h-10 sm:w-10"
    >
      {children}
    </button>
  );
}

function HomeIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m4 10 8-6 8 6" strokeLinecap="round" strokeLinejoin="round" /><path d="M6.5 9.5V20h11V9.5M10 20v-6h4v6" strokeLinejoin="round" /></svg>;
}

function BackIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m14.5 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ForwardIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m9.5 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function LogoutIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
