import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { partnerRegisterSchema } from '@/lib/validation/partner';
import { hashPassword } from '@/lib/auth/password';
import { enforceRateLimit, clientIp } from '@/lib/auth/rate-limit';
import { nextPartnerCode } from '@/lib/partner/codes';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const parsed = partnerRegisterSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail('validation', 400);

  const ip = clientIp(req);
  const retryAfter = await enforceRateLimit(`partner-register:ip:${ip}`, { max: 8, windowSeconds: 600 });
  if (retryAfter !== null) return fail('rateLimited', 429, { retryAfterSeconds: retryAfter });

  const input = parsed.data;
  const existing = await prisma.agency.findFirst({
    where: { OR: [{ email: input.email }, { users: { some: { email: input.email } } }] },
    select: { id: true },
  });
  if (existing) return fail('emailTaken', 409);

  const passwordHash = await hashPassword(input.password);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const partnerCode = await nextPartnerCode();
      const agency = await prisma.agency.create({
        data: {
          partnerCode,
          name: input.agencyName,
          contactPerson: input.contactPerson,
          email: input.email,
          mobile: input.mobile,
          city: input.city,
          state: input.state,
          country: input.country,
          website: input.website,
          registrationNumber: input.registrationNumber,
          users: {
            create: {
              name: input.contactPerson,
              email: input.email,
              mobile: input.mobile,
              passwordHash,
              role: 'OWNER',
              isActive: false,
            },
          },
        },
        select: { partnerCode: true, approvalStatus: true },
      });
      return ok({ partnerCode: agency.partnerCode, status: agency.approvalStatus });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        if (attempt < 2) continue;
        return fail('conflict', 409);
      }
      throw error;
    }
  }

  return fail('generic', 500);
}
