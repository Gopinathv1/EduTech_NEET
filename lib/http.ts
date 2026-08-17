import { NextResponse } from 'next/server';

/**
 * Tiny helpers for consistent JSON API responses.
 * Error `code`s are stable strings the client maps to `auth.errors.<code>`
 * messages, so all API feedback is bilingual.
 */

export function ok<T extends Record<string, unknown>>(data?: T) {
  return NextResponse.json({ ok: true, ...(data ?? {}) });
}

export function fail(code: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: code, ...(extra ?? {}) }, { status });
}

/** Parse a JSON body, returning null on malformed input. */
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
