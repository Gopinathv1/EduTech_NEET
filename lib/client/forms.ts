import type { ZodType } from 'zod';

export type SetFieldError = (name: string, message: string) => void;

/**
 * Validate `values` with a zod schema (the SAME schema the server uses).
 * On success returns the parsed/normalised output. On failure it pushes a
 * localised message onto each offending field via `setError` and returns null.
 *
 * `translate` maps our bare error keys (e.g. "mobileInvalid") to localised text.
 */
export function parseForm<TOut>(
  schema: ZodType<TOut>,
  values: unknown,
  setError: SetFieldError,
  translate: (code: string) => string,
): TOut | null {
  const result = schema.safeParse(values);
  if (result.success) return result.data;
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (field != null) setError(String(field), translate(issue.message));
  }
  return null;
}

/** Apply server-returned field errors (`{ field: [code, ...] }`) to a form. */
export function applyServerFieldErrors(
  fields: Record<string, string[]> | undefined,
  setError: SetFieldError,
  translate: (code: string) => string,
): void {
  if (!fields) return;
  for (const [name, codes] of Object.entries(fields)) {
    if (codes?.length) setError(name, translate(codes[0]));
  }
}
