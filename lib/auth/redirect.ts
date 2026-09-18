const DEFAULT_STUDENT_DESTINATION = '/student';

export function safeReturnPath(value: unknown, fallback = DEFAULT_STUDENT_DESTINATION): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed || !trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback;

  try {
    const url = new URL(trimmed, 'http://sivora.local');
    if (url.origin !== 'http://sivora.local') return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

/**
 * NextAuth supplies callbackUrl as an absolute URL when it redirects to a
 * custom sign-in page. Accept that form only when it matches the configured
 * application origin, then reduce it back to the same safe local path used by
 * the rest of the application.
 */
export function safeAuthReturnPath(
  value: unknown,
  fallback = DEFAULT_STUDENT_DESTINATION,
  applicationUrl = process.env.NEXTAUTH_URL,
): string {
  if (typeof value !== 'string') return fallback;
  if (value.trim().startsWith('/')) return safeReturnPath(value, fallback);
  if (!applicationUrl) return fallback;

  try {
    const candidate = new URL(value);
    const application = new URL(applicationUrl);
    if (candidate.origin !== application.origin) return fallback;
    return safeReturnPath(`${candidate.pathname}${candidate.search}${candidate.hash}`, fallback);
  } catch {
    return fallback;
  }
}

export function returnParamFromUrl(url: URL, fallback = DEFAULT_STUDENT_DESTINATION): string {
  return safeReturnPath(url.searchParams.get('callbackUrl') ?? url.searchParams.get('next'), fallback);
}

export function withReturnParam(path: string, returnTo: string): string {
  const url = new URL(path, 'http://sivora.local');
  url.searchParams.set('callbackUrl', safeReturnPath(returnTo));
  return `${url.pathname}${url.search}`;
}
