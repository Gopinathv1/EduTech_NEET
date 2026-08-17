import { prisma } from '@/lib/prisma';
import { getPartnerSession, getPartnerContext, isApprovedPartner } from '@/lib/auth/partner';
import { partnerProfileSchema } from '@/lib/validation/partner';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

export async function PATCH(req: Request) {
  const session = await getPartnerSession();
  if (!session) return fail('unauthorized', 401);
  const context = await getPartnerContext(session);
  if (!context || !isApprovedPartner(context)) return fail('unauthorized', 403);

  const parsed = partnerProfileSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400);
  const input = parsed.data;

  await prisma.agency.update({
    where: { id: context.agency.id },
    data: {
      contactPerson: input.contactPerson,
      mobile: input.mobile,
      city: input.city,
      state: input.state,
      country: input.country,
      website: input.website,
    },
  });
  return ok();
}
