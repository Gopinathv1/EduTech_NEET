export type GlobalSessionKind = 'student' | 'admin' | 'partner' | null;

const ACTIVE_TEST_PATH = /^\/student\/tests\/[^/]+\/attempt\/?$/;

export function isActiveTestPath(pathname: string) {
  return ACTIVE_TEST_PATH.test(pathname);
}

export function shouldShowFloatingSupport(pathname: string) {
  return !isActiveTestPath(pathname);
}

export function shouldShowLogout(sessionKind: GlobalSessionKind) {
  return sessionKind !== null;
}

export function logoutRedirectFor(sessionKind: Exclude<GlobalSessionKind, null>) {
  if (sessionKind === 'admin') return '/admin/login';
  if (sessionKind === 'partner') return '/partner/login';
  return '/';
}

export function shouldUseBrowserBack({
  hasObservedInternalNavigation,
  referrer,
  currentOrigin,
}: {
  hasObservedInternalNavigation: boolean;
  referrer: string;
  currentOrigin: string;
}) {
  if (hasObservedInternalNavigation) return true;
  if (!referrer) return false;
  try {
    return new URL(referrer).origin === currentOrigin;
  } catch {
    return false;
  }
}
