import { getSession } from '@/lib/auth/session';
import { admissionLeadSchema } from '@/lib/validation/admission';
import { createLead } from '@/lib/admission/leads';
import { ok, fail, readJson } from '@/lib/http';

export const runtime = 'nodejs';

// POST /api/admission/leads — student submits a consultancy request. Stores an
// AdmissionLead, confirms to the student and alerts all admins.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.kind !== 'student') return fail('unauthorized', 401);

  const parsed = admissionLeadSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return fail('validation', 400, { fields: parsed.error.flatten().fieldErrors });
  }

  const result = await createLead(session.sub, parsed.data);
  if (!result.ok) {
    return fail(result.code, result.code === 'leadExists' ? 409 : 400);
  }

  return ok({ leadId: result.leadId });
}
