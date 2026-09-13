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

export function returnParamFromUrl(url: URL, fallback = DEFAULT_STUDENT_DESTINATION): string {
  return safeReturnPath(url.searchParams.get('callbackUrl') ?? url.searchParams.get('next'), fallback);
}

export function withReturnParam(path: string, returnTo: string): string {
  const url = new URL(path, 'http://sivora.local');
  url.searchParams.set('callbackUrl', safeReturnPath(returnTo));
  return `${url.pathname}${url.search}`;
}
