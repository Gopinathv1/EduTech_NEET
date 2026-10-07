import { getSession } from '@/lib/auth/session';
import { ingestAttemptMonitoring } from '@/lib/attempts/monitoring';
import { monitoringBatchSchema } from '@/lib/validation/monitoring';
import { fail, ok } from '@/lib/http';

export const runtime = 'nodejs';

const MAX_BODY_BYTES = 16_384;

async function readBoundedJson(req: Request): Promise<{ value: unknown; tooLarge: boolean }> {
  const declaredLength = req.headers.get('content-length');
  if (declaredLength && Number(declaredLength) > MAX_BODY_BYTES) return { value: null, tooLarge: true };
  if (!req.body) return { value: null, tooLarge: false };
  const reader = req.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel().catch(() => undefined);
        return { value: null, tooLarge: true };
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
    return { value: JSON.parse(text) as unknown, tooLarge: false };
  } catch {
    return { value: null, tooLarge: false };
  } finally {
    reader.releaseLock();
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.kind !== 'student') return fail('unauthorized', 401);
    const { id } = await params;
    if (!id || id.length > 128) return fail('attemptNotFound', 404);
    const origin = req.headers.get('origin');
    if (req.headers.get('sec-fetch-site') === 'cross-site' || (origin && origin !== new URL(req.url).origin)) {
      return fail('monitoringOrigin', 403);
    }
    if (req.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
      return fail('validation', 400);
    }
    const body = await readBoundedJson(req);
    if (body.tooLarge) return fail('monitoringPayloadTooLarge', 413);
    const parsed = monitoringBatchSchema.safeParse(body.value);
    if (!parsed.success) return fail('validation', 400);
    const result = await ingestAttemptMonitoring(id, session.sub, parsed.data);
    switch (result.status) {
      case 'stored': return ok({ saved: result.saved, ignored: result.ignored });
      case 'notFound': return fail('attemptNotFound', 404);
      case 'closed': return fail('attemptClosed', 409);
      case 'expired': return fail('timeUp', 409);
      case 'rateLimited': {
        const response = fail('monitoringRateLimited', 429, { retryAfterSeconds: result.retryAfterSeconds });
        response.headers.set('Retry-After', String(result.retryAfterSeconds));
        return response;
      }
      default: return fail('monitoringUnavailable', 503);
    }
  } catch {
    return fail('monitoringUnavailable', 503);
  }
}
