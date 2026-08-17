/**
 * Client-side fetch helpers for the auth API. Always resolve to a plain object
 * with an `ok` flag and an optional `error` code (never throw), so forms can
 * map `error` straight onto `auth.errors.<code>` messages.
 */
export type ApiResult = {
  ok: boolean;
  error?: string;
  [key: string]: unknown;
};

async function send(url: string, method: string, body?: unknown): Promise<ApiResult> {
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as ApiResult | null;
    if (!data) return { ok: false, error: 'generic' };
    return data;
  } catch {
    return { ok: false, error: 'network' };
  }
}

export const apiGet = (url: string) => send(url, 'GET');
export const apiPost = (url: string, body?: unknown) => send(url, 'POST', body);
export const apiPatch = (url: string, body?: unknown) => send(url, 'PATCH', body);
export const apiDelete = (url: string) => send(url, 'DELETE');
