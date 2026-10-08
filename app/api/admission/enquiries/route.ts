import { admissionsEnquirySchema } from '@/lib/validation/admissions-enquiry';
import { createAdmissionsEnquiry } from '@/lib/admission/enquiries';
import { enforceRateLimit, clientIp } from '@/lib/auth/rate-limit';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';
export async function POST(req: Request) {
  try {
    const retryAfter = await enforceRateLimit(`admissions:ip:${clientIp(req)}`, { max: 5, windowSeconds: 600 });
    if (retryAfter !== null) return fail('rateLimited', 429, { retryAfterSeconds: retryAfter });
    const parsed = admissionsEnquirySchema.safeParse(await readJson(req));
    if (!parsed.success) return fail('validation', 400, { fields: parsed.error.flatten().fieldErrors });
    const result = await createAdmissionsEnquiry(parsed.data);
    return ok({ reference: `SIV-${result.id.slice(-6).toUpperCase()}`, duplicate: result.duplicate });
  } catch {
    return fail('generic', 503);
  }
}
