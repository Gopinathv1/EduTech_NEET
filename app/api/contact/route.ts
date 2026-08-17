import { prisma } from '@/lib/prisma';
import { contactEnquirySchema } from '@/lib/validation/contact';
import { enforceRateLimit, clientIp } from '@/lib/auth/rate-limit';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

// POST /api/contact — save a public "Contact Us" enquiry.
export async function POST(req: Request) {
  // Public + unauthenticated → throttle per IP (5 / 10 min) to curb spam.
  const retryAfter = await enforceRateLimit(`contact:ip:${clientIp(req)}`, {
    max: 5,
    windowSeconds: 600,
  });
  if (retryAfter !== null) return fail('rateLimited', 429, { retryAfterSeconds: retryAfter });

  const parsed = contactEnquirySchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return fail('validation', 400, { fields: parsed.error.flatten().fieldErrors });
  }
  const d = parsed.data;

  await prisma.contactEnquiry.create({
    data: {
      name: d.name,
      mobile: d.mobile,
      email: d.email,
      message: d.message,
    },
  });

  return ok();
}
